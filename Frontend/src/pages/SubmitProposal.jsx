import { useRef, useState } from 'react';
import VendorLayout from '../components/VendorLayout';
import Textarea from '../components/Textarea';
import FileCard from '../components/FileCard';
import Toast from '../components/Toast';
import { analyzeProposal } from '../api/proposals';
import { CalendarIcon, BuildingIcon, HashIcon, SendIcon } from '../components/icons';
import './VendorUploadProposal.css';
import '../components/UploadDropzone.css';

const VENDOR_PROFILE = { initials: 'JD', name: 'John Doe', role: 'j.doe@agency.gov' };

function SubmitProposal({ onNavigate, onSignOut, rfp, user, vendorProfile }) {
  const [letter, setLetter] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState({ show: false, title: '', subtitle: '', error: false });
  const fileInputRef = useRef(null);

  const canSubmit = letter.trim().length > 0 && file !== null && !submitted;

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  }

  function handleBrowse() {
    fileInputRef.current?.click();
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    if (!rfp?.rfp_id) {
      setToast({ show: true, title: 'No RFP selected', subtitle: 'Please go back and choose an RFP first.', error: true });
      return;
    }

    setLoading(true);
    try {
      await analyzeProposal(rfp.rfp_id, file);
      setSubmitted(true);
      setToast({
        show: true,
        title: 'Proposal Submitted',
        subtitle: 'Your proposal has been successfully submitted.',
        error: false,
      });
    } catch (err) {
      setToast({ show: true, title: 'Submission Failed', subtitle: err.message, error: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <VendorLayout active="vendor-portal" profile={vendorProfile ?? VENDOR_PROFILE} onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="vup-topbar">
        <div>
          <p className="vup-breadcrumb">
            <button className="vup-crumb" onClick={() => onNavigate?.('vendor-portal')}>Submissions</button>
            <span className="vup-crumb-sep">›</span>
            <span>New Proposal</span>
          </p>
          <h1 className="vup-title">Submit Proposal</h1>
        </div>
      </div>

      {/* Target RFP card */}
      <div className="vup-target">
        <div className="vup-target-head">
          <p className="vup-target-label">Target RFP</p>
          <span className="vup-target-status">{rfp?.status ?? 'In Progress'}</span>
        </div>
        <h2 className="vup-target-title">{rfp?.title ?? 'No RFP selected'}</h2>
        <div className="vup-target-meta">
          <div>
            <p className="vup-meta-label"><CalendarIcon /> Created</p>
            <p className="vup-meta-value">{rfp?.date_created ?? '—'}</p>
          </div>
          <div>
            <p className="vup-meta-label"><BuildingIcon /> Company</p>
            <p className="vup-meta-value">{rfp?.company_name ?? '—'}</p>
          </div>
          <div>
            <p className="vup-meta-label"><HashIcon /> Company ID</p>
            <p className="vup-meta-value">{rfp?.company_id ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Proposal details panel */}
      <section className="vup-panel">
        <div className="vup-panel-head">
          <span className="vup-step-num">1</span>
          <h3 className="vup-panel-title">Proposal Details</h3>
        </div>

        <div className="vup-panel-body">
          <p className="vup-field-label">Letter with attached proposal</p>
          <Textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            placeholder="Provide a summary of your proposal and introductory remarks to the procurement board..."
            rows={5}
          />

          <p className="vup-field-label vup-field-label-spaced">Upload proposal document</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div className="dropzone" onClick={handleBrowse} style={{ cursor: 'pointer' }}>
            <span className="dropzone-icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7 1.5A3.5 3.5 0 0 0 6.5 19" />
                <path d="M12 12v7M9 15l3-3 3 3" />
              </svg>
            </span>
            <p className="dropzone-text">
              Drag and drop proposal files or <span className="dropzone-browse">browse</span>
            </p>
            <p className="dropzone-hint">PDF files up to 50MB</p>
          </div>

          {file && (
            <div className="vup-files">
              <FileCard align="left" name={file.name} meta={`${(file.size / 1024 / 1024).toFixed(1)} MB`} />
            </div>
          )}

          <button
            className="vup-submit-btn"
            onClick={handleSubmit}
            disabled={!canSubmit || loading || submitted}
          >
            <SendIcon /> {loading ? 'Submitting...' : submitted ? 'Proposal Submitted' : 'Submit Proposal'}
          </button>
        </div>
      </section>

      <Toast
        show={toast.show}
        title={toast.title}
        subtitle={toast.subtitle}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
      />
    </VendorLayout>
  );
}

export default SubmitProposal;
