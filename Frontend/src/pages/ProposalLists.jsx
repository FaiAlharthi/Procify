import { useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import MatchBar from '../components/MatchBar';
import { getProposals } from '../api/proposals';
import './ProposalLists.css';

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function fmtDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ProposalLists({ onNavigate, onSignOut, onSelectProposal }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProposals()
      .then(setProposals)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <EmployeeLayout active="received-proposals" onNavigate={onNavigate} onSignOut={onSignOut}>
      <h1 className="pl-title">Received Proposals</h1>

      {loading && (
        <p style={{ color: 'var(--text-muted)', padding: '32px 0' }}>Loading proposals...</p>
      )}

      {!loading && proposals.length === 0 && (
        <p style={{ color: 'var(--text-muted)', padding: '32px 0' }}>No proposals submitted yet.</p>
      )}

      <div className="pl-list">
        {proposals.map((p) => {
          const score = p.ai_score != null ? Math.round(p.ai_score) : null;
          return (
            <article className="pl-card" key={p.proposal_id}>
              <div className="pl-card-body">
                <h2 className="pl-card-title">
                  From {p.vendor_name ?? p.vendor_id} - {p.proposal_id}
                </h2>

                <div className="pl-match">
                  {score != null ? (
                    <>
                      <span className="pl-match-pill">
                        <SparkleIcon /> {score}% AI Match
                      </span>
                      <MatchBar value={score} tone="dark" showLabel={false} />
                    </>
                  ) : (
                    <span className="pl-match-pill" style={{ opacity: 0.5 }}>No AI score yet</span>
                  )}
                </div>

                <p className="pl-meta"><ClockIcon /> Received: {fmtDate(p.upload_date)}</p>
                <p className="pl-project">
                  For {p.rfp_title ? p.rfp_title : p.rfp_id}
                </p>
              </div>

              <button className="pl-review" onClick={() => { onSelectProposal?.(p); onNavigate?.('proposal-details'); }}>
                <span className="pl-review-icon"><DocIcon /></span>
                <span className="pl-review-text">Review Proposal</span>
                <ChevronRight />
              </button>
            </article>
          );
        })}
      </div>
    </EmployeeLayout>
  );
}

export default ProposalLists;
