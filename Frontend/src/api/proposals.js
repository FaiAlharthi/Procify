import { getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function analyzeProposal(rfpId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const res = await fetch(`${BASE_URL}/proposals/analyze/${rfpId}`, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let detail;
    try {
      detail = (await res.json())?.detail;
    } catch {
      /* no JSON body */
    }
    throw new Error(detail || `Upload failed (${res.status})`);
  }

  return res.json();
}

export async function getProposals(rfpId) {
  const url = rfpId != null
    ? `${BASE_URL}/proposals/?rfp_id=${rfpId}`
    : `${BASE_URL}/proposals/`;

  const token = getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Failed to load proposals (${res.status})`);
  return res.json();
}
