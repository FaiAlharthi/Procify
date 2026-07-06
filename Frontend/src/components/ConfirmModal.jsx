import './ConfirmModal.css';

function ConfirmModal({ title, icon, iconVariant = 'danger', body, actions = [], onDismiss }) {
  return (
    <div className="cmodal-overlay" onClick={onDismiss}>
      <div className="cmodal" onClick={(e) => e.stopPropagation()}>
        {icon && (
          <div className={'cmodal-icon-wrap cmodal-icon-wrap-' + iconVariant}>
            {icon}
          </div>
        )}
        {title && <h2 className="cmodal-title">{title}</h2>}
        {body && <p className="cmodal-body">{body}</p>}
        <div className="cmodal-divider" />
        <div
          className="cmodal-actions"
          style={actions.length > 2 ? { flexDirection: 'column' } : { justifyContent: 'flex-end' }}
        >
          {actions.map((a, i) => (
            <button
              key={i}
              className={'cmodal-btn cmodal-btn-' + (a.variant ?? 'secondary')}
              onClick={a.onClick}
              style={actions.length > 2 ? { width: '100%' } : undefined}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
