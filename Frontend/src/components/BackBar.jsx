import './BackBar.css';

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function BackBar({ label = 'Back', onClick }) {
  return (
    <button className="backbar" onClick={onClick}>
      <ChevronLeft /> {label}
    </button>
  );
}

export default BackBar;
