import { useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import ConfirmModal from '../components/ConfirmModal';
import { deleteRFP } from '../api/rfps';
import { ChevronLeft, EditIcon, TrashIcon } from '../components/icons';
import './RfpDetails.css';

const SECTIONS = [
  { key: 'objective',          label: 'Objective' },
  { key: 'scope_of_work',      label: 'Scope of Work' },
  { key: 'technical_criteria', label: 'Technical Criteria' },
  { key: 'commercials',        label: 'Commercials' },
  { key: 'project_delivery',   label: 'Project Delivery' },
];

function RfpDetailsDraftPage({ rfp, onNavigate, onSignOut, onEditDraft }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteRFP(rfp.rfp_id);
      onNavigate?.('dashboard');
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  }

  function handleEdit() {
    onEditDraft?.(rfp);
    onNavigate?.('edit-draft');
  }

  const hasSections = SECTIONS.some((s) => rfp?.[s.key]);

  return (
    <EmployeeLayout active="dashboard" onNavigate={onNavigate} onSignOut={onSignOut}>
      <button className="rfpd-back" onClick={() => onNavigate?.('dashboard')}>
        <ChevronLeft /> Back to Dashboard
      </button>

      {/* Info card — title, metadata, actions */}
      <div className="rfpd-infocard">
        <div className="rfpd-infocard-body">
          <div className="rfpd-infocard-row">
            <div>
              <p className="rfpd-field-label">RFP Title</p>
              <p className="rfpd-field-value rfpd-field-title">{rfp?.title ?? 'Untitled Draft'}</p>
            </div>
            <div>
              <p className="rfpd-field-label">RFP ID</p>
              <p className="rfpd-field-value rfpd-field-id">{rfp?.rfp_id ?? '-'}</p>
            </div>
            <div>
              <p className="rfpd-field-label">Date Created</p>
              <p className="rfpd-field-value">{rfp?.date_created ?? '-'}</p>
            </div>
            <div>
              <p className="rfpd-field-label">Status</p>
              <StatusBadge status="draft" />
            </div>
          </div>

          <div className="rfpd-infocard-btns">
            <Button variant="primary" onClick={handleEdit}>
              <EditIcon /> Edit Draft
            </Button>
            <button className="btn btn-danger-outline rfpd-draft-delete" onClick={() => setShowConfirm(true)}>
              <TrashIcon /> Delete Draft
            </button>
          </div>
        </div>
      </div>

      {/* Draft content sections */}
      <div className="rfpd-card">
        <h3 className="rfpd-card-title">Draft Content</h3>
        {hasSections ? (
          <div className="rfpd-draft-sections">
            {SECTIONS.map((s) => {
              const text = rfp?.[s.key];
              if (!text) return null;
              return (
                <div className="rfpd-draft-section" key={s.key}>
                  <p className="rfpd-field-label">{s.label}</p>
                  <p className="rfpd-draft-section-text">{text}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rfpd-draft-empty">
            No sections filled in yet. Click <strong>Edit Draft</strong> to continue writing.
          </p>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Delete Draft RFP?"
          icon={<TrashIcon />}
          iconVariant="danger"
          body={`"${rfp?.title ?? 'This draft'}" will be permanently deleted. This cannot be undone.`}
          onDismiss={() => setShowConfirm(false)}
          actions={[
            { label: 'Cancel',  variant: 'secondary', onClick: () => setShowConfirm(false) },
            { label: deleting ? 'Deleting…' : 'Delete', variant: 'danger', onClick: handleDelete },
          ]}
        />
      )}
    </EmployeeLayout>
  );
}

export default RfpDetailsDraftPage;
