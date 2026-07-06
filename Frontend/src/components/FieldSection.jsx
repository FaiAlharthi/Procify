import './FieldSection.css';

function FieldSection({ number, title, children }) {
  return (
    <div className="field-section">
      <div className="field-section-head">
        {number != null && <span className="field-section-num">{number}</span>}
        <h3 className="field-section-title">{title}</h3>
      </div>
      <div className="field-section-body">{children}</div>
    </div>
  );
}

export default FieldSection;
