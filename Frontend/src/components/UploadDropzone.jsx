import './UploadDropzone.css';

function CloudUploadIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7 1.5A3.5 3.5 0 0 0 6.5 19" />
      <path d="M12 12v7M9 15l3-3 3 3" />
    </svg>
  );
}

function UploadDropzone({ hint = 'PDF, DOCX, or ZIP files up to 50MB', onBrowse }) {
  return (
    <div className="dropzone">
      <span className="dropzone-icon"><CloudUploadIcon /></span>
      <p className="dropzone-text">
        Drag and drop proposal files or{' '}
        <button type="button" className="dropzone-browse" onClick={onBrowse}>browse</button>
      </p>
      <p className="dropzone-hint">{hint}</p>
    </div>
  );
}

export default UploadDropzone;
