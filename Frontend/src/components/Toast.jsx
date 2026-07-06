import { useEffect } from 'react';
import './Toast.css';

function CheckCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

// Controlled toast: render it always, toggle with `show`. Auto-dismisses.
function Toast({ show, title, subtitle, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  if (!show) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon"><CheckCircle /></span>
      <div className="toast-text">
        <p className="toast-title">{title}</p>
        {subtitle && <p className="toast-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

export default Toast;
