import './MatchBar.css';

/* tone: 'dark' (default) | 'muted' */
function MatchBar({ value = 0, tone = 'dark', showLabel = true }) {
  return (
    <div className="matchbar">
      <div className="matchbar-track">
        <div
          className={`matchbar-fill matchbar-fill-${tone}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && <span className="matchbar-pct">{value}%</span>}
    </div>
  );
}

export default MatchBar;
