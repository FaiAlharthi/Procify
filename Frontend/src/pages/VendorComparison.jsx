import { useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import BackBar from '../components/BackBar';
import MatchBadge from '../components/MatchBadge';
import { getProposals } from '../api/proposals';
import { CalendarIcon } from '../components/icons';
import './VendorComparison.css';

function fmtDeadline(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function scoreTone(score) {
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow';
  return 'blue';
}

const CRITERIA = [
  { label: 'Objective',          sub: 'Alignment to procurement goals', key: 'objective' },
  { label: 'Scope of Work',      sub: 'Service coverage & depth',       key: 'scope_of_work' },
  { label: 'Technical Criteria', sub: 'Specs & certifications',         key: 'technical_criteria' },
  { label: 'Commercials',        sub: 'Pricing & SLA',                  key: 'commercials' },
  { label: 'Project Delivery',   sub: 'Timelines & dates',              key: 'project_delivery' },
];

function VendorComparison({ onNavigate, onSignOut, rfp }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rfp?.rfp_id) {
      setError('No RFP selected.');
      setLoading(false);
      return;
    }
    getProposals(rfp.rfp_id)
      .then(setProposals)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [rfp?.rfp_id]);

  return (
    <EmployeeLayout active="dashboard" onNavigate={onNavigate} onSignOut={onSignOut}>
      <BackBar label="Back To RFPs List" onClick={() => onNavigate?.('dashboard')} />

      <div className="vc-header">
        <h1 className="vc-title">Vendor Comparison</h1>
        <p className="vc-subtitle">{rfp?.title ?? 'Unknown Project'}</p>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading proposals...</p>}
      {error && <p style={{ color: 'red' }}>Failed to load proposals: {error}</p>}

      {!loading && !error && proposals.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>No proposals submitted yet.</p>
      )}

      {!loading && !error && proposals.length > 0 && (
        <div
          className="vc-grid"
          style={{
            gridTemplateColumns: `1.1fr ${proposals.map(() => '1fr').join(' ')}`,
          }}
        >
          {/* Header row */}
          <div className="vc-cell vc-cell-head vc-criteria-head">Criteria</div>
          {proposals.map((p) => (
            <div className="vc-cell vc-cell-head vc-vendor-head" key={p.proposal_id}>
              <span className="vc-vendor-name">{p.vendor_name || 'Unknown Vendor'}</span>
              <MatchBadge score={p.ai_score ?? 0} tone={scoreTone(p.ai_score ?? 0)} />
            </div>
          ))}

          {/* Data rows */}
          {CRITERIA.map((criterion) => (
            <div className="vc-row-group" key={criterion.key}>
              <div className="vc-cell vc-criteria">
                <p className="vc-criteria-label">{criterion.label}</p>
                <p className="vc-criteria-sub">{criterion.sub}</p>
              </div>
              {proposals.map((p) => (
                <div className="vc-cell vc-data" key={p.proposal_id}>
                  {criterion.key === 'commercials' ? (() => {
                    const raw = p.price || p.commercials || 'Not specified';
                    const parenIdx = raw.indexOf(' (');
                    if (parenIdx === -1) return <p className="vc-price">{raw}</p>;
                    return (
                      <div className="vc-commercial">
                        <p className="vc-price">{raw.slice(0, parenIdx)}</p>
                        <p className="vc-commercial-label">{raw.slice(parenIdx + 1)}</p>
                      </div>
                    );
                  })() : criterion.key === 'project_delivery' ? (
                    <div className="vc-delivery">
                      <p className="vc-timeline-cap">
                        <CalendarIcon /> {p.timeline || 'Not specified'}
                      </p>
                      {fmtDeadline(rfp?.deadline) && (
                        <p className="vc-delivery-date">By {fmtDeadline(rfp?.deadline)}</p>
                      )}
                    </div>
                  ) : (
                    <p>{p[criterion.key] || 'Not specified'}</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </EmployeeLayout>
  );
}

export default VendorComparison;
