import './ActionBar.css';

function ActionBar({ left, right }) {
  return (
    <div className="action-bar">
      <div className="action-bar-left">{left}</div>
      <div className="action-bar-right">{right}</div>
    </div>
  );
}

export default ActionBar;
