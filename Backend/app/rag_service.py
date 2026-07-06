import os
import re
import math
from collections import Counter

DOCUMENTS_DIR = os.path.join(os.path.dirname(__file__), "..", "documents")

# BM25 hyper-parameters
_K1 = 1.5
_B = 0.75

# Module-level cache: built once on first call
_index = None  # list of (chunk_text, tokens_list)
_idf = None    # dict term -> idf score
_avgdl = None  # average chunk length in tokens


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _chunk_document(text: str, source: str) -> list[str]:
    """Split a markdown file into sections by ## headings, keeping source label."""
    sections = re.split(r"\n(?=##\s)", text)
    chunks = []
    for sec in sections:
        sec = sec.strip()
        if len(sec) < 30:
            continue
        chunks.append(f"[Source: {source}]\n{sec}")
    return chunks if chunks else [f"[Source: {source}]\n{text}"]


def _build_index() -> None:
    global _index, _idf, _avgdl

    chunks: list[str] = []

    if os.path.exists(DOCUMENTS_DIR):
        for fname in sorted(os.listdir(DOCUMENTS_DIR)):
            if not fname.endswith(".md"):
                continue
            path = os.path.join(DOCUMENTS_DIR, fname)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    text = f.read()
                chunks.extend(_chunk_document(text, fname.replace(".md", "")))
            except Exception:
                pass

    if not chunks:
        _index = []
        _idf = {}
        _avgdl = 1.0
        return

    tokenized = [_tokenize(c) for c in chunks]
    total_tokens = sum(len(t) for t in tokenized)
    _avgdl = total_tokens / len(tokenized)

    # document frequency per term
    df: dict[str, int] = Counter()
    for tok_list in tokenized:
        for term in set(tok_list):
            df[term] += 1

    N = len(chunks)
    _idf = {
        term: math.log((N - freq + 0.5) / (freq + 0.5) + 1.0)
        for term, freq in df.items()
    }

    _index = list(zip(chunks, tokenized))


def _bm25_score(query_tokens: list[str], doc_tokens: list[str]) -> float:
    tf_map = Counter(doc_tokens)
    dl = len(doc_tokens)
    score = 0.0
    for term in query_tokens:
        if term not in _idf:
            continue
        tf = tf_map.get(term, 0)
        numerator = tf * (_K1 + 1)
        denominator = tf + _K1 * (1 - _B + _B * dl / _avgdl)
        score += _idf[term] * (numerator / denominator)
    return score


def search_documents(query: str, top_k: int = 4) -> str:
    """Return the top_k most relevant document chunks for the query as a single string."""
    global _index
    if _index is None:
        _build_index()

    if not _index:
        return ""

    query_tokens = _tokenize(query)
    if not query_tokens:
        return ""

    scored = [
        (_bm25_score(query_tokens, tok_list), chunk)
        for chunk, tok_list in _index
    ]
    scored.sort(key=lambda x: x[0], reverse=True)

    top = [chunk for score, chunk in scored[:top_k] if score > 0]
    if not top:
        return ""

    return "\n\n---\n\n".join(top)
