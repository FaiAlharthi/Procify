import MatchBadge from './MatchBadge';
import './VendorCard.css';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function VendorCard({ name, id, match, tags = [], selected = false, onToggle }) {
  return (
    <button
      type="button"
      className={`vendor-card ${selected ? 'is-selected' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <div className="vendor-card-body">
        <div className="vendor-card-head">
          <span className="vendor-card-name">{name}</span>
          {match != null && <MatchBadge score={match} />}
        </div>
        <p className="vendor-card-id">ID: {id}</p>
        {tags.length > 0 && (
          <div className="vendor-card-tags">
            {tags.map((t) => <span key={t} className="vendor-tag">{t}</span>)}
          </div>
        )}
      </div>
      <span className={`vendor-card-check ${selected ? 'is-on' : ''}`}>
        {selected && <CheckIcon />}
      </span>
    </button>
  );
}

export default VendorCard;
