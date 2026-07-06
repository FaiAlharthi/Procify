import './FileCard.css';

function FileIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  );
}

/* align: 'center' (default) | 'left' */
function FileCard({ name, meta, align = 'center', onClick }) {
  return (
    <div
      className={`file-card file-card-${align} ${onClick ? 'is-clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <span className="file-card-icon"><FileIcon /></span>
      <div className="file-card-info">
        <p className="file-card-name">{name}</p>
        {meta && <p className="file-card-meta">{meta}</p>}
      </div>
    </div>
  );
}

export default FileCard;
