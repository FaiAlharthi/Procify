import StatusBadge from './StatusBadge';
import './RfpInfoHeader.css';

function RfpInfoHeader({ title, dueDate, status, rfpId, description, actions }) {
  return (
    <div className="rfp-info">
      <div className="rfp-info-grid">
        <div className="rfp-info-cell">
          <p className="rfp-info-label">RFP Title</p>
          <p className="rfp-info-value rfp-info-strong">{title}</p>
        </div>
        <div className="rfp-info-cell">
          <p className="rfp-info-label">Due Date</p>
          <p className="rfp-info-value">{dueDate}</p>
        </div>
        <div className="rfp-info-cell">
          <p className="rfp-info-label">Status</p>
          <StatusBadge status={status} />
        </div>
        <div className="rfp-info-actions">{actions}</div>

        <div className="rfp-info-cell">
          <p className="rfp-info-label">RFP ID</p>
          <p className="rfp-info-value">{rfpId}</p>
        </div>
        <div className="rfp-info-cell rfp-info-desc">
          <p className="rfp-info-label">Description</p>
          <p className="rfp-info-value">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default RfpInfoHeader;
