import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import Button from '../components/Button';
import { sendChatMessage } from '../api/chat';
import { createRFP, updateRFP } from '../api/rfps';
import { ChevronLeft, SendIcon } from '../components/icons';
import './CreateRFP2.css';

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
    </svg>
  );
}
function BotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="12" rx="2" /><path d="M12 8V4M9 13h.01M15 13h.01" />
    </svg>
  );
}
function SendArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function CancelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}

const FIELD_LABELS = {
  objective: 'Objective',
  scope: 'Scope of Work',
  technical: 'Technical Criteria',
  commercial: 'Commercial Template',
  delivery: 'Project Delivery & Deadline',
};

const ALL_SECTION_KEYS = ['objective', 'scope', 'technical', 'commercial', 'delivery'];

// Initial fallback — replaced immediately by DOM measurement before first paint
const INITIAL_PAGES = [
  { items: ALL_SECTION_KEYS.map((key) => ({ key, value: '', isContinued: false })), isFirst: true },
];

const QUICK_CHIPS = [
  'Rewrite for professional tone',
  'What information is missing?',
  'Check compliance requirements',
];

const WELCOME_MSG = {
  role: 'bot',
  text: "I've reviewed your RFP draft. Ask me to improve any section, fill missing fields, or click the button above to get a full analysis.",
};

function CreateRFP2({ onNavigate, onSignOut, rfpData, onBackFromEnhance, onRfpCreated, onSaveDraft, existingRfp, user }) {
  const [localData, setLocalData] = useState(
    rfpData ?? { title: '', fields: { objective: '', scope: '', technical: '', commercial: '', delivery: '' } }
  );
  const [aiUpdated, setAiUpdated] = useState(new Set());
  const [pendingUpdates, setPendingUpdates] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [message, setMessage] = useState('');
  const [thinking, setThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftFeedback, setDraftFeedback] = useState(false);
  const feedbackTimer = useRef(null);
  const chatEndRef = useRef(null);

  const [docPages, setDocPages] = useState(INITIAL_PAGES);
  const colRef = useRef(null);
  const measureRef = useRef(null);

  useLayoutEffect(() => {
    const col = colRef.current;
    const meas = measureRef.current;
    if (!col || !meas) return;

    const pageWidth = col.offsetWidth;
    if (pageWidth === 0) return;

    // A4 height at current width, minus top+bottom padding (44px each)
    const a4ContentHeight = pageWidth * (297 / 210) - 88;

    const headerEl = meas.querySelector('[data-mheader]');
    const headerH = headerEl?.offsetHeight ?? 80;
    // crfp2-doc-head has margin-bottom: var(--space-6) = 24px (not in offsetHeight)
    const HEADER_MARGIN = 24;

    const contEl = meas.querySelector('[data-mcont]');
    const contH = contEl?.offsetHeight ?? 40;
    // crfp2-page-cont-label has margin-bottom: var(--space-5) = 20px
    const CONT_MARGIN = 20;

    // crfp2-section has margin-bottom: var(--space-6) = 24px (except last-child)
    const SECTION_MARGIN = 24;

    // Measure a section by temporarily setting the reusable measurement element's content
    function measureItem(key, value) {
      const el = meas.querySelector('[data-msect]');
      if (!el) return 80;
      const labelEl = el.querySelector('[data-mslabel]');
      const textEl = el.querySelector('[data-mstext]');
      const prevLabel = labelEl?.textContent;
      const prevText = textEl?.textContent;

      if (labelEl) labelEl.textContent = FIELD_LABELS[key] ?? key;
      if (textEl) textEl.textContent = value || 'Not filled yet — ask AI to suggest content.';

      const h = el.offsetHeight;

      if (labelEl) labelEl.textContent = prevLabel;
      if (textEl) textEl.textContent = prevText;
      return h;
    }

    // Binary-search the longest text prefix that fits within maxH
    function splitText(key, value, maxH) {
      const el = meas.querySelector('[data-msect]');
      if (!el) return { first: value, rest: '' };
      const labelEl = el.querySelector('[data-mslabel]');
      const textEl = el.querySelector('[data-mstext]');
      const prevLabel = labelEl?.textContent;
      const prevText = textEl?.textContent;

      if (labelEl) labelEl.textContent = FIELD_LABELS[key] ?? key;

      const words = (value || '').split(' ');
      let lo = 0, hi = words.length;

      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (textEl) textEl.textContent = words.slice(0, mid).join(' ');
        if (el.offsetHeight <= maxH) lo = mid;
        else hi = mid - 1;
      }

      if (labelEl) labelEl.textContent = prevLabel;
      if (textEl) textEl.textContent = prevText;

      return {
        first: words.slice(0, lo).join(' '),
        rest: words.slice(lo).join(' '),
      };
    }

    // Pagination with within-section text splitting
    let remaining = ALL_SECTION_KEYS.map((key) => ({
      key,
      value: localData.fields[key],
      isContinued: false,
    }));
    let isFirst = true;
    const newPages = [];

    while (remaining.length > 0) {
      const fixedH = isFirst ? headerH + HEADER_MARGIN : contH + CONT_MARGIN;
      const pageAvailable = a4ContentHeight - fixedH;

      const pageItems = [];
      let usedH = 0;

      while (remaining.length > 0) {
        const item = remaining[0];
        const itemH = measureItem(item.key, item.value) + SECTION_MARGIN;

        if (pageItems.length === 0 && itemH > pageAvailable) {
          // Section is taller than a full page — split at a word boundary
          const { first, rest } = splitText(item.key, item.value, pageAvailable - SECTION_MARGIN);
          if (first.trim()) {
            pageItems.push({ ...item, value: first });
            remaining[0] = { ...item, value: rest, isContinued: true };
          } else {
            // Edge case: force-place to avoid infinite loop
            pageItems.push(item);
            remaining.shift();
          }
          break;
        } else if (usedH + itemH > pageAvailable) {
          // Doesn't fit on this page — start a new one
          break;
        } else {
          pageItems.push(item);
          usedH += itemH;
          remaining.shift();
        }
      }

      if (pageItems.length === 0) {
        remaining.shift(); // safety
      } else {
        newPages.push({ items: pageItems, isFirst });
      }
      isFirst = false;
    }

    setDocPages(newPages.length > 0 ? newPages : [{ items: [], isFirst: true }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localData.fields, localData.title]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text) {
    const input = (text ?? message).trim();
    if (!input || thinking) return;
    setMessage('');

    setMessages((prev) => [...prev, { role: 'user', text: input }]);
    setThinking(true);

    try {
      const result = await sendChatMessage(input, {
        title: localData.title,
        ...localData.fields,
      });

      if (result.response) {
        setMessages((prev) => [...prev, { role: 'bot', text: result.response }]);
      }

      if (result.updates && Object.keys(result.updates).length > 0) {
        const names = Object.keys(result.updates)
          .map((k) => FIELD_LABELS[k] ?? k)
          .join(', ');
        setPendingUpdates({ updates: result.updates, names });
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: `I've prepared improvements for: ${names}. Would you like me to apply these changes to the document?`,
            awaitConfirm: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: 'AI service unavailable. Please try again shortly.' },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function applyPendingUpdates() {
    if (!pendingUpdates) return;
    setLocalData((prev) => ({
      ...prev,
      fields: { ...prev.fields, ...pendingUpdates.updates },
    }));
    setAiUpdated((prev) => {
      const next = new Set(prev);
      Object.keys(pendingUpdates.updates).forEach((k) => next.add(k));
      return next;
    });
    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, awaitConfirm: false })),
      { role: 'bot', text: `Done! Applied changes to: ${pendingUpdates.names}. The document on the left has been updated.` },
    ]);
    setPendingUpdates(null);
  }

  function discardPendingUpdates() {
    setMessages((prev) => [
      ...prev.map((m) => ({ ...m, awaitConfirm: false })),
      { role: 'bot', text: 'No problem, the document remains unchanged.' },
    ]);
    setPendingUpdates(null);
  }

  async function handleSaveDraft() {
    if (savingDraft) return;
    setSavingDraft(true);
    onSaveDraft?.(localData);
    const payload = {
      title: localData.title || 'Untitled Draft',
      status: 'draft',
      objective:          localData.fields.objective  || null,
      scope_of_work:      localData.fields.scope      || null,
      technical_criteria: localData.fields.technical  || null,
      commercials:        localData.fields.commercial || null,
      project_delivery:   localData.fields.delivery   || null,
    };
    try {
      if (existingRfp?.rfp_id) {
        await updateRFP(existingRfp.rfp_id, payload);
      } else {
        const rfp = await createRFP({ ...payload, employee_id: user?.id || 'E0001', category: 'General' });
        onRfpCreated?.(rfp);
      }
    } catch (_) {
      // in-memory save still applied
    }
    setSavingDraft(false);
    clearTimeout(feedbackTimer.current);
    setDraftFeedback(true);
    feedbackTimer.current = setTimeout(() => {
      setDraftFeedback(false);
      onNavigate?.('dashboard');
    }, 1200);
  }

  async function handleConfirmSend() {
    setSaving(true);
    const payload = {
      title: localData.title || 'Untitled RFP',
      status: 'inProgress',
      objective:          localData.fields.objective  || null,
      scope_of_work:      localData.fields.scope      || null,
      technical_criteria: localData.fields.technical  || null,
      commercials:        localData.fields.commercial || null,
      project_delivery:   localData.fields.delivery   || null,
    };
    try {
      if (existingRfp?.rfp_id) {
        const rfp = await updateRFP(existingRfp.rfp_id, payload);
        onRfpCreated?.(rfp);
      } else {
        const rfp = await createRFP({ ...payload, employee_id: user?.id || 'E0001', category: 'General' });
        onRfpCreated?.(rfp);
      }
      onNavigate?.('vendor-selection');
    } catch (err) {
      alert(`Failed to confirm and send it to vendors: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    onBackFromEnhance?.(localData);
    onNavigate?.('edit-draft');
  }

  function renderSectionItem(item, idx) {
    const { key, value, isContinued } = item;
    const label = FIELD_LABELS[key];
    return (
      <div className="crfp2-section" key={`${key}-${idx}`}>
        <h2 className="crfp2-section-title">
          {label}{isContinued ? ' (cont.)' : ''}
          {aiUpdated.has(key) && !isContinued && (
            <span className="crfp2-ai-badge">AI Updated</span>
          )}
        </h2>
        <div className="crfp2-section-box">
          {value
            ? <p style={{ whiteSpace: 'pre-wrap' }}>{value}</p>
            : <p style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>Not filled yet &mdash; ask AI to suggest content.</p>
          }
        </div>
      </div>
    );
  }

  return (
    <EmployeeLayout active="create-rfp" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="crfp2">

        {/* Non-scrolling page header */}
        <div className="crfp2-top">
          <button className="crfp2-back" onClick={handleBack}>
            <ChevronLeft /> Back To RFP Editing
          </button>
          <p className="crfp2-kicker">Step 2 of 3 &bull; Enhance with AI</p>
          <h1 className="crfp2-title">Enhance RFP with AI</h1>
        </div>

        {/* Two-column body */}
        <div className="crfp2-body">

          {/* Left: A4 pages, scrollable */}
          <section className="crfp2-doc-col" ref={colRef} style={{ position: 'relative' }}>

            {/* Hidden measurement page — grows freely; layout effect reads heights here */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                visibility: 'hidden',
                pointerEvents: 'none',
              }}
            >
              <div
                ref={measureRef}
                className="crfp2-page"
                style={{ height: 'auto', minHeight: 0, aspectRatio: 'auto', boxShadow: 'none', overflow: 'visible' }}
              >
                <div data-mheader="">
                  <div className="crfp2-doc-head">
                    <div>
                      <p className="crfp2-doc-label">Project Name</p>
                      <p className="crfp2-doc-value">{localData.title || 'Untitled RFP'}</p>
                    </div>
                  </div>
                </div>
                <div data-mcont="">
                  <p className="crfp2-page-cont-label">Continued</p>
                </div>
                {/* Single reusable section element for on-demand measurement */}
                <div data-msect="" className="crfp2-section">
                  <h2 data-mslabel="" className="crfp2-section-title">Placeholder</h2>
                  <div className="crfp2-section-box">
                    <p data-mstext="" style={{ whiteSpace: 'pre-wrap' }}>Placeholder text</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actual A4 pages */}
            {docPages.map((page, pageIdx) => (
              <div className="crfp2-page" key={pageIdx}>
                {page.isFirst ? (
                  <div className="crfp2-doc-head">
                    <div>
                      <p className="crfp2-doc-label">Project Name</p>
                      <p className="crfp2-doc-value">{localData.title || 'Untitled RFP'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="crfp2-page-cont-label">Continued &mdash; {localData.title || 'Untitled RFP'}</p>
                )}
                {page.items.map((item, sIdx) => renderSectionItem(item, sIdx))}
              </div>
            ))}
          </section>

          {/* Right: AI chat panel */}
          <aside className="crfp2-ai">
            <div className="crfp2-ai-head">
              <h2 className="crfp2-ai-title"><SparkleIcon /> AI-Powered Writing</h2>
              <p className="crfp2-ai-subtitle">
                Get intelligent suggestions to enhance your RFP. Improvements appear live
                in the document on the left.
              </p>
            </div>

            <button
              className="crfp2-ai-check"
              onClick={() => send('Please analyze my RFP draft and identify any missing or incomplete sections.')}
              disabled={thinking}
            >
              <MailIcon /> Check if there&apos;s any missing information
            </button>

            <div className="crfp2-chat">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`crfp2-msg ${msg.role === 'bot' ? 'crfp2-msg-bot' : 'crfp2-msg-user'}`}
                >
                  {msg.role === 'bot' && (
                    <span className="crfp2-msg-avatar"><BotIcon /></span>
                  )}
                  <div className={`crfp2-bubble ${msg.role === 'bot' ? 'crfp2-bubble-bot' : 'crfp2-bubble-user'}`}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    {msg.awaitConfirm && pendingUpdates && (
                      <div className="crfp2-confirm-btns">
                        <button className="crfp2-confirm-yes" onClick={applyPendingUpdates}>
                          ✓ Yes, apply changes
                        </button>
                        <button className="crfp2-confirm-no" onClick={discardPendingUpdates}>
                          No, keep original
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="crfp2-msg crfp2-msg-bot">
                  <span className="crfp2-msg-avatar"><BotIcon /></span>
                  <div className="crfp2-bubble crfp2-bubble-bot">
                    <p style={{ color: '#9ca3af' }}>Thinking…</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="crfp2-composer">
              <div className="crfp2-input-row">
                <input
                  className="crfp2-input"
                  type="text"
                  placeholder="What do you want to improve?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  disabled={thinking}
                />
                <button
                  className="crfp2-send"
                  onClick={() => send()}
                  aria-label="Send"
                  disabled={thinking}
                >
                  <SendArrow />
                </button>
              </div>
              <div className="crfp2-chips">
                {QUICK_CHIPS.map((c) => (
                  <button
                    key={c}
                    className="crfp2-chip"
                    onClick={() => send(c)}
                    disabled={thinking}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </aside>

        </div>

        <div className="crfp2-footer">
          <span className="crfp2-footnote">Step 2 of 3 &bull; AI Enhancement</span>
          <div className="crfp2-footer-actions">
            <Button variant="danger-outline" onClick={() => onNavigate?.('dashboard')}>
              <CancelIcon /> Cancel RFP
            </Button>
            <Button variant="secondary" onClick={handleBack}>
              <SaveIcon /> Back to Edit
            </Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={savingDraft}>
              <SaveIcon /> {draftFeedback ? 'Saved!' : savingDraft ? 'Saving…' : 'Save as draft'}
            </Button>
            <Button variant="ai" onClick={handleConfirmSend} disabled={saving}>
              {saving ? 'Saving…' : <><SendIcon /> Confirm and Send to Vendors</>}
            </Button>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}

export default CreateRFP2;
