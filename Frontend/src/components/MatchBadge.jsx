import './MatchBadge.css';

/* tone: 'green' | 'yellow' | 'blue' | 'gray' (auto from score if omitted) */
function MatchBadge({ score, tone, icon = false }) {
  let resolved = tone;
  if (!resolved) {
    if (score >= 90) resolved = 'green';
    else if (score >= 80) resolved = 'yellow';
    else resolved = 'gray';
  }
  return (
    <span className={`match-badge match-badge-${resolved}`}>
      {icon && <span className="match-badge-spark">✦</span>}
      {score}% MATCH
    </span>
  );
}

export default MatchBadge;
