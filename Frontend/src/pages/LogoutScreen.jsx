import Logo from '../components/Logo';
import './LogoutScreen.css';

function CheckCircle() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

function LogoutScreen({ onBackToLogin }) {
  return (
    <div className="logout">
      <div className="logout-card">
        <div className="logout-logo"><Logo width={130} /></div>
        <span className="logout-icon"><CheckCircle /></span>
        <h1 className="logout-title">You’ve been signed out</h1>
        <p className="logout-text">
          Your session has ended securely. Thanks for using Procify.
        </p>
        <button className="logout-btn" onClick={onBackToLogin}>
          Back to sign in
        </button>
      </div>
    </div>
  );
}

export default LogoutScreen;
