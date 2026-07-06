import EmployeeLayout from '../components/EmployeeLayout';
import BackBar from '../components/BackBar';
import Button from '../components/Button';
import FileCard from '../components/FileCard';
import { BASE_URL } from '../api/client';
import { EyeIcon } from '../components/icons';
import './ProposalDetails.css';

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const AI_SECTIONS = [
  { key: 'objective',          label: 'Objective' },
  { key: 'scope_of_work',      label: 'Scope of Work' },
  { key: 'technical_criteria', label: 'Technical Criteria' },
  { key: 'commercials',        label: 'Commercials' },
  { key: 'project_delivery',   label: 'Project Delivery' },
];

function ProposalDetails({ onNavigate, onSignOut, proposal }) {
  const info = [
    { label: 'Company Name',  value: proposal?.vendor_name  ?? '-' },
    { label: 'Company ID',    value: proposal?.vendor_id    ?? '-' },
    { label: 'Project',       value: proposal?.rfp_title    ?? '-' },
    { label: 'Project ID',    value: proposal?.rfp_id       ?? '-' },
    { label: 'Proposal ID',   value: proposal?.proposal_id  ?? '-' },
    { label: 'AI Match Score', value: proposal?.ai_score != null ? `${Math.round(proposal.ai_score)}%` : '-' },
  ];

  const fileName = proposal?.file_path
    ? proposal.file_path.split('/').pop()
    : (proposal?.name ? proposal.name + '.pdf' : 'Proposal.pdf');

  function handlePreview() {
    if (!proposal?.proposal_id) return;
    window.open(`${BASE_URL}/proposals/${proposal.proposal_id}/file`, '_blank');
  }

  const hasSections = AI_SECTIONS.some((s) => proposal?.[s.key]);

  return (
    <EmployeeLayout active="received-proposals" onNavigate={onNavigate} onSignOut={onSignOut}>
      <BackBar label="Back to Received Proposals" onClick={() => onNavigate?.('received-proposals')} />

      <h1 className="pd-title">Proposal Details</h1>

      <div className="pd-info-row">
        {info.map((c) => (
          <div className="pd-info-card" key={c.label}>
            <p className="pd-info-label">{c.label}</p>
            <p className="pd-info-value">{c.value}</p>
          </div>
        ))}
      </div>

      {/* AI-extracted sections */}
      {hasSections ? (
        AI_SECTIONS.map((s) => {
          const text = proposal?.[s.key];
          if (!text) return null;
          return (
            <section className="pd-panel" key={s.key}>
              <div className="pd-panel-head">{s.label}</div>
              <div className="pd-panel-body">
                <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>
              </div>
            </section>
          );
        })
      ) : (
        <section className="pd-panel">
          <div className="pd-panel-head">Description</div>
          <div className="pd-panel-body">
            <p>{proposal?.description ?? proposal?.name ?? 'No description available.'}</p>
          </div>
        </section>
      )}

      {/* Price & Timeline if present */}
      {(proposal?.price || proposal?.timeline) && (
        <div className="pd-meta-row">
          {proposal?.price && (
            <div className="pd-panel pd-meta-panel">
              <div className="pd-panel-head">Proposed Price</div>
              <div className="pd-panel-body"><p>{proposal.price}</p></div>
            </div>
          )}
          {proposal?.timeline && (
            <div className="pd-panel pd-meta-panel">
              <div className="pd-panel-head">Proposed Timeline</div>
              <div className="pd-panel-body"><p>{proposal.timeline}</p></div>
            </div>
          )}
        </div>
      )}

      <section className="pd-download">
        <p className="pd-download-caption">Proposal Document</p>
        <FileCard name={fileName} meta="Submitted PDF" />
        <Button variant="primary" className="pd-download-btn" onClick={handlePreview}>
          <EyeIcon /> Preview Proposal
        </Button>
        {proposal?.upload_date && (
          <p className="pd-download-meta">Submitted: {fmtDate(proposal.upload_date)}</p>
        )}
      </section>
    </EmployeeLayout>
  );
}

export default ProposalDetails;
