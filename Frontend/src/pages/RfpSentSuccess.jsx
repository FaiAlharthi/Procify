import EmployeeLayout from '../components/EmployeeLayout';
import Button from '../components/Button';
import { CheckIcon } from '../components/icons';
import './RfpSentSuccess.css';

function RfpSentSuccess({ info, onNavigate, onSignOut }) {
  const count = info?.count ?? 0;
  const title = info?.title ?? 'Cloud Migration Project';
  const date =
    info?.date ??
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <EmployeeLayout active="create-rfp" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="rss">
        <div className="rss-card">
          <span className="rss-icon"><CheckIcon /></span>

          <h1 className="rss-title">RFP Sent Successfully!</h1>
          <p className="rss-subtitle">
            Your request for proposal has been delivered to the selected vendors.
            You'll be notified here as their responses arrive.
          </p>

          <div className="rss-summary">
            <div className="rss-row">
              <span className="rss-row-label">Project Title</span>
              <span className="rss-row-value">{title}</span>
            </div>
            <div className="rss-row">
              <span className="rss-row-label">Vendors Notified</span>
              <span className="rss-row-value">{count} {count === 1 ? 'vendor' : 'vendors'}</span>
            </div>
            <div className="rss-row">
              <span className="rss-row-label">Date Sent</span>
              <span className="rss-row-value">{date}</span>
            </div>
          </div>

          <div className="rss-actions">
            <Button variant="secondary" className="rss-btn" onClick={() => onNavigate?.('create-rfp')}>
              Create another RFP
            </Button>
            <Button variant="primary" className="rss-btn" onClick={() => onNavigate?.('dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}

export default RfpSentSuccess;
