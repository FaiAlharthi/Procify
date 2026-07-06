import './StatCard.css';

function StatCard({ variant = 'gray', icon, count, label, onClick, active = false }) {
  return (
    <div
      className={`stat-card stat-card-${variant}${active ? ' stat-card-active' : ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className={`stat-icon stat-icon-${variant}`}>{icon}</div>
      <div className="stat-count">{count}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default StatCard;
