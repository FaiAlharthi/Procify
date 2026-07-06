import { useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import Button from '../components/Button';
import VendorCard from '../components/VendorCard';
import ConfirmModal from '../components/ConfirmModal';
import { getVendors, getSuggestedVendors } from '../api/vendors';
import { sendToVendors } from '../api/rfps';
import { ChevronLeft, SendIcon } from '../components/icons';
import './SelectVendors.css';

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
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
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function SendPlaneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function VendorSelection({ onNavigate, onSignOut, onConfirmSend, rfp }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);

  // All vendors from DB — used for search fallback
  const [allVendors, setAllVendors] = useState([]);

  // AI suggestions — shown by default when no search query
  const [suggestions, setSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // All-vendors loading (for search)
  const [vendorsLoading, setVendorsLoading] = useState(true);

  const [showConfirm, setShowConfirm] = useState(false);

  // Load all vendors for search
  useEffect(() => {
    getVendors()
      .then(setAllVendors)
      .catch(() => {})
      .finally(() => setVendorsLoading(false));
  }, []);

  // Load AI suggestions when rfp_id is available
  const [aiRetryCount, setAiRetryCount] = useState(0);

  useEffect(() => {
    if (!rfp?.rfp_id) return;
    setAiLoading(true);
    setAiError(null);
    getSuggestedVendors(rfp.rfp_id)
      .then((data) => setSuggestions(data.suggested_vendors ?? []))
      .catch((e) => setAiError(e.message))
      .finally(() => setAiLoading(false));
  }, [rfp?.rfp_id, aiRetryCount]);

  const isSelected = (id) => selected.some((v) => v.id === id);

  function toggleVendor(vendor) {
    setSelected((prev) =>
      prev.some((v) => v.id === vendor.id)
        ? prev.filter((v) => v.id !== vendor.id)
        : [...prev, { id: vendor.id, name: vendor.name }]
    );
  }

  function removeVendor(id) {
    setSelected((prev) => prev.filter((v) => v.id !== id));
  }

  // When searching: show all vendors filtered by query
  // When not searching: show AI suggestions
  const isSearching = query.trim().length > 0;

  const searchResults = isSearching
    ? allVendors.filter(
        (v) =>
          v.company_name.toLowerCase().includes(query.toLowerCase()) ||
          v.vendor_id.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <EmployeeLayout active="create-rfp" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="sv-topbar">
        <button className="sv-back" onClick={() => onNavigate?.('enhance-ai')}>
          <ChevronLeft /> Back to RFP Enhancing
        </button>
        <div className="sv-topbar-actions">
          <Button variant="danger-outline" onClick={() => onNavigate?.('dashboard')}>
            <CancelIcon /> Cancel RFP
          </Button>
        </div>
      </div>

      <p className="sv-kicker">Step 3 of 3 &bull; Select Vendors</p>
      <h1 className="sv-title">Select Vendors</h1>

      <div className="sv-search">
        <input
          className="sv-search-input"
          type="text"
          placeholder="Search all vendors by name or ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="sv-search-icon"><SearchIcon /></span>
      </div>

      <div className="sv-split">
        {/* Left panel */}
        <section>
          {isSearching ? (
            <>
              <p className="sv-section-label">Search Results</p>
              <div className="sv-suggested-card">
                {vendorsLoading && <p className="sv-empty">Loading vendors...</p>}
                {!vendorsLoading && searchResults.length === 0 && (
                  <p className="sv-empty">No vendors match "{query}".</p>
                )}
                {!vendorsLoading && searchResults.map((v) => (
                  <VendorCard
                    key={v.vendor_id}
                    name={v.company_name}
                    id={v.vendor_id}
                    tags={[]}
                    selected={isSelected(v.vendor_id)}
                    onToggle={() => toggleVendor({ id: v.vendor_id, name: v.company_name })}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="sv-section-label sv-ai-label">
                <SparkIcon /> AI Recommended Vendors
              </p>
              <div className="sv-suggested-card">
                {aiLoading && <p className="sv-empty">Analyzing RFP and matching vendors…</p>}
                {!aiLoading && aiError && (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <p className="sv-empty" style={{ color: 'var(--danger, #dc2626)', marginBottom: '12px' }}>
                      AI suggestions temporarily unavailable. Please try again.
                    </p>
                    <button
                      onClick={() => setAiRetryCount((n) => n + 1)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      Try again
                    </button>
                  </div>
                )}
                {!aiLoading && !aiError && suggestions.length === 0 && (
                  <p className="sv-empty">No suggestions available. Use search to find vendors.</p>
                )}
                {!aiLoading && !aiError && suggestions.map((s) => (
                  <VendorCard
                    key={s.vendor_id}
                    name={s.company_name}
                    id={s.vendor_id}
                    match={s.match_score}
                    tags={s.match_reasons ?? []}
                    selected={isSelected(s.vendor_id)}
                    onToggle={() => toggleVendor({ id: s.vendor_id, name: s.company_name })}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* Right: selected vendors */}
        <aside>
          <p className="sv-section-label sv-section-label-center">Selected Vendors</p>
          <div className="sv-selected-card">
            <div className="sv-selected-note">
              <ClockIcon /> These vendors will receive the RFP notification.
            </div>

            <div className="sv-selected-list">
              {selected.length === 0 ? (
                <p className="sv-empty">No vendors selected yet.</p>
              ) : (
                selected.map((v) => (
                  <div className="sv-selected-row" key={v.id}>
                    <div>
                      <p className="sv-selected-name">{v.name}</p>
                      <p className="sv-selected-id">ID: {v.id}</p>
                    </div>
                    <button
                      className="sv-remove"
                      onClick={() => removeVendor(v.id)}
                      aria-label={'Remove ' + v.name}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))
              )}
            </div>

            <Button
              variant="primary"
              className="sv-confirm"
              onClick={() => selected.length > 0 && setShowConfirm(true)}
            >
              <SendIcon /> Confirm and Send to Vendors
            </Button>
          </div>
        </aside>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Send RFP to Vendors?"
          icon={<SendPlaneIcon />}
          iconVariant="primary"
          body={`You are about to send this RFP to ${selected.length} vendor${selected.length !== 1 ? 's' : ''}. They will be notified and can submit proposals.`}
          onDismiss={() => setShowConfirm(false)}
          actions={[
            { label: 'Cancel', variant: 'secondary', onClick: () => setShowConfirm(false) },
            {
              label: 'Confirm & Send',
              variant: 'primary',
              onClick: async () => {
                setShowConfirm(false);
                if (rfp?.rfp_id) {
                  try {
                    await sendToVendors(rfp.rfp_id, selected.map((v) => v.id));
                  } catch (_) {}
                }
                onConfirmSend ? onConfirmSend(selected) : onNavigate?.('rfp-sent-success');
              },
            },
          ]}
        />
      )}
    </EmployeeLayout>
  );
}

export default VendorSelection;
