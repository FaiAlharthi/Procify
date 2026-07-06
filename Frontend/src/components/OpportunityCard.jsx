import Button from './Button';
import './OpportunityCard.css';

function DocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
function ValueIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function OpportunityCard({ title, dueLabel, estValue, onViewDocument, onSubmit }) {
  return (
    <article className="opp-card">
      <span className="opp-icon"><DocIcon /></span>

      <div className="opp-body">
        <h2 className="opp-title">{title}</h2>
        <div className="opp-meta">
          <span className="opp-meta-item"><ClockIcon /> {dueLabel}</span>
          {estValue && <span className="opp-meta-item"><ValueIcon /> {estValue}</span>}
        </div>
      </div>

      <span className="opp-status">Open for Bid</span>

      <div className="opp-actions">
        <Button variant="secondary" onClick={onViewDocument}>
          <EyeIcon /> RFP Document
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          Submit Proposal
        </Button>
      </div>
    </article>
  );
}

export default OpportunityCard;
