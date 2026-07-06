import { useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import ConfirmModal from '../components/ConfirmModal';
import { getProposals } from '../api/proposals';
import { closeRFP } from '../api/rfps';
import { BASE_URL } from '../api/client';
import { ChevronLeft, EyeIcon, CheckIcon, CloseXIcon, TrophyIcon, CompareIcon, DownloadIcon } from '../components/icons';
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

function RfpDetailsInProgressPage({ rfp, onNavigate, onSignOut, onRfpClosed }) {
  const [proposals, setProposals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!rfp?.rfp_id) return;
    getProposals(rfp.rfp_id).then(setProposals).catch(() => {});
  }, [rfp?.rfp_id]);

  const selectedProposal = proposals.find((p) => p.proposal_id === selected);

  function toggleSelect(id) {
    setSelected((prev) => (prev === id ? null : id));
  }

  async function doClose(winnerVendorId) {
    setClosing(true);
    setModal(null);
    try {
      await closeRFP(rfp.rfp_id, winnerVendorId);
      onRfpClosed?.();
      onNavigate?.('dashboard');
    } catch (e) {
      setModal({ type: 'error', message: e.message });
    } finally {
      setClosing(false);
    }
  }

  function openCloseModal() {
    if (selectedProposal) {
      setModal({ type: 'close-with-vendor' });
    } else {
      setModal({ type: 'close-no-vendor' });
    }
  }

  function openConfirmVendorModal() {
    if (!selectedProposal) {
      setModal({ type: 'no-selection' });
      return;
    }
    setModal({ type: 'confirm-vendor' });
  }

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
              <StatusBadge status={rfp?.status ?? 'inProgress'} />
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
          <Button variant="primary" onClick={openConfirmVendorModal}>
            <CheckIcon /> Confirm and select Vendor
          </Button>
        </div>

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
                const score = p.ai_score != null ? Math.round(p.ai_score) : null;
                const isChecked = selected === p.proposal_id;
                return (
                  <tr key={p.proposal_id} style={isChecked ? { background: '#f5f3ff' } : {}}>
                    <td>
                      <input
                        type="radio"
                        name="proposal-select"
                        checked={isChecked}
                        onChange={() => toggleSelect(p.proposal_id)}
                        style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </td>
                    <td className="rfpd-td-name">{p.vendor_name ?? '-'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.vendor_id}</td>
                    <td>
                      {score != null ? (
                        <div className="rfpd-score-wrap">
                          <div className="rfpd-score-track">
                            <div className="rfpd-score-fill" style={{ width: score + '%' }} />
                          </div>
                          <span className="rfpd-score-pct">{score}%</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
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

      <div className="rfpd-close-wrap">
        <button
          className="btn-danger-outline"
          onClick={openCloseModal}
          disabled={closing}
        >
          <CloseXIcon /> {closing ? 'Closing...' : 'Close RFP'}
        </button>
      </div>

      {/* ---- Modals ---- */}

      {modal?.type === 'close-no-vendor' && (
        <ConfirmModal
          title="Close this RFP?"
          body="You have not selected a vendor yet. Are you sure you want to close this RFP without awarding it to any vendor?"
          onDismiss={() => setModal(null)}
          actions={[
            { label: 'Cancel', variant: 'secondary', onClick: () => setModal(null) },
            { label: 'Close without choosing vendor', variant: 'danger', onClick: () => doClose(null) },
          ]}
        />
      )}

      {modal?.type === 'close-with-vendor' && (
        <ConfirmModal
          title="Close this RFP?"
          body={'You have highlighted ' + (selectedProposal?.vendor_name ?? selectedProposal?.vendor_id) + '. Choose how you would like to close this RFP.'}
          onDismiss={() => setModal(null)}
          actions={[
            { label: 'Cancel', variant: 'secondary', onClick: () => setModal(null) },
            { label: 'Close without choosing vendor', variant: 'danger', onClick: () => doClose(null) },
            { label: 'Close and send to ' + (selectedProposal?.vendor_name ?? selectedProposal?.vendor_id), variant: 'primary', onClick: () => doClose(selectedProposal.vendor_id) },
          ]}
        />
      )}

      {modal?.type === 'confirm-vendor' && (
        <ConfirmModal
          title="Confirm Vendor Selection"
          icon={<TrophyIcon />}
          body={'Award this RFP to ' + (selectedProposal?.vendor_name ?? selectedProposal?.vendor_id) + ' (' + selectedProposal?.vendor_id + ')? This will also close the RFP.'}
          onDismiss={() => setModal(null)}
          actions={[
            { label: 'Cancel', variant: 'secondary', onClick: () => setModal(null) },
            { label: 'Confirm and close RFP', variant: 'primary', onClick: () => doClose(selectedProposal.vendor_id) },
          ]}
        />
      )}

      {modal?.type === 'no-selection' && (
        <ConfirmModal
          title="No Vendor Selected"
          icon={<CheckIcon />}
          body="Please select a vendor from the proposals table before confirming."
          onDismiss={() => setModal(null)}
          actions={[
            { label: 'OK', variant: 'primary', onClick: () => setModal(null) },
          ]}
        />
      )}

      {modal?.type === 'error' && (
        <ConfirmModal
          title="Something went wrong"
          icon={<CloseXIcon />}
          body={modal.message ?? 'Failed to close the RFP. Please try again.'}
          onDismiss={() => setModal(null)}
          actions={[
            { label: 'OK', variant: 'secondary', onClick: () => setModal(null) },
          ]}
        />
      )}
    </EmployeeLayout>
  );
}

export default RfpDetailsInProgressPage;
