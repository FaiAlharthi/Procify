import { useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { getProposals } from '../api/proposals';
import { BASE_URL } from '../api/client';
import { ChevronLeft, EyeIcon, TrophyIcon, CompareIcon, DownloadIcon } from '../components/icons';
import './RfpDetails.css';

function PreviewIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>);
}

function fmtDate(iso) {
  if (!iso) return '-';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return parseInt(parts[2]) + '/' + parseInt(parts[1]) + '/' + parts[0];
}

function RfpDetailsClosedPage({ rfp, onNavigate, onSignOut }) {
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    if (!rfp?.rfp_id) return;
    getProposals(rfp.rfp_id).then(setProposals).catch(() => {});
  }, [rfp?.rfp_id]);

  const winnerId = rfp?.winner_vendor_id ?? null;
  const hasProposals = proposals.length > 0;

  return (
    <EmployeeLayout active="dashboard" onNavigate={onNavigate} onSignOut={onSignOut}>
      <button className="rfpd-back" onClick={() => onNavigate?.('dashboard')}>
        <ChevronLeft /> Back To RFPs List
      </button>

      <div className="rfpd-infocard">
        <div className="rfpd-infocard-body">
          <div className="rfpd-infocard-row">
            <div>
              <p className="rfpd-field-label">RFP Title</p>
              <p className="rfpd-field-value rfpd-field-title">{rfp?.title ?? '-'}</p>
            </div>
            <div>
              <p className="rfpd-field-label">RFP ID</p>
              <p className="rfpd-field-value rfpd-field-id">{rfp?.rfp_id ?? '-'}</p>
            </div>
            <div>
              <p className="rfpd-field-label">Due Date</p>
              <p className="rfpd-field-value">{fmtDate(rfp?.deadline)}</p>
            </div>
            <div>
              <p className="rfpd-field-label">Status</p>
              <StatusBadge status={rfp?.status ?? 'closed'} />
            </div>
          </div>
          <div className="rfpd-desc-section">
            <p className="rfpd-field-label">Description</p>
            <p className="rfpd-field-value rfpd-field-desc">
              {rfp?.objective ?? rfp?.description ?? '-'}
            </p>
          </div>
          <div className="rfpd-infocard-btns">
            <Button variant="primary" onClick={() => onNavigate?.('vendor-comparison')}>
              <CompareIcon /> Compare Vendors
            </Button>
            <Button variant="secondary" onClick={() => window.open(`${BASE_URL}/rfps/${rfp?.rfp_id}/pdf`, '_blank')}>
              <PreviewIcon /> Preview the RFP Document
            </Button>
          </div>
        </div>
      </div>

      <div className="rfpd-proposals">
        <div className="rfpd-proposals-head">
          <h2 className="rfpd-proposals-title">Proposals</h2>
        </div>

        {hasProposals && !winnerId && (
          <p className="rfpd-no-vendor-note">
            No vendor was selected before closing this RFP.
          </p>
        )}

        <div className="rfpd-prop-wrap">
          <table className="rfpd-prop-table">
            <thead>
              <tr>
                <th></th>
                <th>vendor name</th>
                <th>Vendor ID</th>
                <th>AI match Score</th>
                <th>Proposal file</th>
              </tr>
            </thead>
            <tbody>
              {proposals.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No proposals submitted yet.
                  </td>
                </tr>
              )}
              {proposals.map((p) => {
                const isWinner = winnerId && p.vendor_id === winnerId;
                return (
                  <tr
                    key={p.proposal_id}
                    style={isWinner ? { background: '#f0fdf4' } : {}}
                  >
                    <td>
                      {isWinner ? (
                        <span className="rfpd-winner-icon" title="Selected vendor">
                          <TrophyIcon />
                        </span>
                      ) : (
                        <input type="checkbox" disabled style={{ accentColor: '#2d1b4e' }} />
                      )}
                    </td>
                    <td className="rfpd-td-name">
                      {p.vendor_name ?? '-'}
                      {isWinner && <span className="rfpd-winner-badge">Selected</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.vendor_id}</td>
                    <td>
                      <span className="rfpd-score-pct">
                        {p.ai_score != null ? Math.round(p.ai_score) + '%' : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="rfpd-dl-btn"
                        title="Preview proposal"
                        onClick={() => window.open(`${BASE_URL}/proposals/${p.proposal_id}/file`, '_blank')}
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="rfpd-prop-footer">
            showing {proposals.length} of {proposals.length} vendors
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}

export default RfpDetailsClosedPage;
