import { useRef, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import FieldSection from '../components/FieldSection';
import ProgressBar from '../components/ProgressBar';
import RfpDocumentPreview from '../components/RfpDocumentPreview';
import ConfirmModal from '../components/ConfirmModal';
import { createRFP, updateRFP } from '../api/rfps';
import { TrashIcon, SendIcon } from '../components/icons';
import './CreateRFP1.css';

function CloudIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7 1.5A3.5 3.5 0 0 0 6.5 19z" />
    </svg>
  );
}
function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
    </svg>
  );
}

const SECTION_DEFS = [
  { key: 'objective', label: 'Objective',
    placeholder: 'Migrate 120 production workloads to a hyperscaler with zero downtime and SOC 2 alignment.' },
  { key: 'scope', label: 'Scope of Work (SOW)',
    placeholder: 'Discovery, assessment, lift-and-shift execution, security hardening, and 12 months of managed support.' },
  { key: 'technical', label: 'Technical Criteria',
    placeholder: 'Multi-region active failover (RPO < 15 min), Terraform IaC, zero-trust networking, full observability stack.' },
  { key: 'commercial', label: 'Commercial Template',
    placeholder: 'Fixed-price ceiling $450,000. Milestone-based billing. Penalty for SLA breach 2% per week.' },
  { key: 'delivery', label: 'Project Delivery & Deadline',
    placeholder: 'Kickoff Jul 1, 2026 • Go-live Dec 15, 2026 • 4 milestone gates with executive sign-off.' },
];

const emptyFields = () => Object.fromEntries(SECTION_DEFS.map((s) => [s.key, '']));

/* ===== LOGIC UNCHANGED — state, handlers, props are exactly as before ===== */
function CreateRFP1({ initialData, existingRfp, onSaveDraft, onNavigate, onSignOut, onRfpCreated, onEnhanceAI, user }) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [fields, setFields] = useState(initialData?.fields ?? emptyFields());
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [modal, setModal] = useState(null);
  const [draftFeedback, setDraftFeedback] = useState(false);
  const feedbackTimer = useRef(null);

  function updateField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleCancel() {
    setShowCancelModal(true);
  }

  function confirmCancel() {
    setShowCancelModal(false);
    setTitle('');
    setFields(emptyFields());
    onNavigate?.('dashboard');
  }

  async function handleSaveDraft() {
    if (savingDraft) return;
    setSavingDraft(true);
    onSaveDraft?.({ title, fields });
    const payload = {
      title: title || 'Untitled Draft',
      status: 'draft',
      objective:          fields.objective  || null,
      scope_of_work:      fields.scope      || null,
      technical_criteria: fields.technical  || null,
      commercials:        fields.commercial || null,
      project_delivery:   fields.delivery   || null,
    };
    try {
      if (existingRfp?.rfp_id) {
        await updateRFP(existingRfp.rfp_id, payload);
      } else {
        const rfp = await createRFP({ ...payload, employee_id: user?.id || 'E0001', category: 'General' });
        onRfpCreated?.(rfp);
      }
    } catch (_) {
      // in-memory save still applied; DB failure is silent
    }
    setSavingDraft(false);
    clearTimeout(feedbackTimer.current);
    setDraftFeedback(true);
    feedbackTimer.current = setTimeout(() => {
      setDraftFeedback(false);
      onNavigate?.('dashboard');
    }, 1200);
  }

  function allFieldsEmpty() {
    const hasTitle = title.trim().length > 0;
    const hasSections = Object.values(fields).some((v) => v.trim().length > 0);
    return !hasTitle && !hasSections;
  }

  async function handleSendToVendors() {
    if (allFieldsEmpty()) {
      setShowCancelModal(false);
      setModal('empty-fields');
      return;
    }
    setSaving(true);
    const payload = {
      title: title || 'Untitled RFP',
      status: 'inProgress',
      objective:          fields.objective  || null,
      scope_of_work:      fields.scope      || null,
      technical_criteria: fields.technical  || null,
      commercials:        fields.commercial || null,
      project_delivery:   fields.delivery   || null,
    };
    try {
      if (existingRfp?.rfp_id) {
        const rfp = await updateRFP(existingRfp.rfp_id, payload);
        onRfpCreated?.(rfp);
      } else {
        const rfp = await createRFP({ ...payload, employee_id: user?.id || 'E0001', category: 'General' });
        onRfpCreated?.(rfp);
      }
      onNavigate?.('vendor-selection');
    } catch (err) {
      alert(`Failed to save RFP: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleEnhanceAI() {
    // Upsert the draft before navigating so Step 2 always has an rfp_id to update
    const payload = {
      title: title || 'Untitled Draft',
      status: 'draft',
      objective:          fields.objective  || null,
      scope_of_work:      fields.scope      || null,
      technical_criteria: fields.technical  || null,
      commercials:        fields.commercial || null,
      project_delivery:   fields.delivery   || null,
    };
    try {
      if (existingRfp?.rfp_id) {
        await updateRFP(existingRfp.rfp_id, payload);
      } else {
        const rfp = await createRFP({ ...payload, employee_id: user?.id || 'E0001', category: 'General' });
        onRfpCreated?.(rfp);
      }
    } catch (_) {
      // navigate anyway; Step 2 will create if needed
    }
    onEnhanceAI?.({ title, fields });
    onNavigate?.('enhance-ai');
  }

  const filledCount = [title, ...Object.values(fields)].filter((v) => v.trim()).length;
  const progress = Math.round((filledCount / (SECTION_DEFS.length + 1)) * 100);

  const previewSections = SECTION_DEFS.map((s) => ({
    label: s.label.replace(' (SOW)', '').toUpperCase(),
    value: fields[s.key],
  }));
  /* ===== end logic ===== */

  return (
    <EmployeeLayout active="create-rfp" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="crfp-header">
        <div>
          <p className="crfp-kicker">Step 1 of 3 • Secure Draft</p>
          <h1 className="crfp-title">Create new RFP</h1>
          <p className="crfp-subtitle">
            Type on the left — Procify structures it into a procurement-ready document on the right.
          </p>
        </div>
        <div className="crfp-autosave">
          <span className="crfp-autosave-text"><CloudIcon /> Auto-saved • Encrypted</span>
          <ProgressBar value={progress} />
          <span className="crfp-autosave-pct">{progress}%</span>
        </div>
      </div>

      <div className="crfp-split">
        <section className="crfp-form-card">
          <label className="crfp-field-label" htmlFor="projectTitle">Project title</label>
          <input
            id="projectTitle"
            className="crfp-title-input"
            type="text"
            placeholder="Cloud Migration Project"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {SECTION_DEFS.map((s, i) => (
            <FieldSection key={s.key} number={i + 1} title={s.label}>
              <Textarea
                value={fields[s.key]}
                onChange={(e) => updateField(s.key, e.target.value)}
                placeholder={s.placeholder}
                rows={3}
              />
            </FieldSection>
          ))}

          {/* Buttons in a simple bottom container — styling only */}
          <div className="crfp-actions">
            <div className="crfp-actions-left">
              <Button variant="secondary" onClick={handleCancel}>
                <TrashIcon /> Cancel RFP
              </Button>
              <Button variant="secondary" onClick={handleSaveDraft} disabled={savingDraft}>
                <SaveIcon /> {draftFeedback ? 'Saved!' : savingDraft ? 'Saving…' : 'Save as draft'}
              </Button>
            </div>
            <div className="crfp-actions-right">
              <Button variant="ai" onClick={handleEnhanceAI}>
                <SparkleIcon /> Enhance it with AI
              </Button>
              <Button variant="primary" onClick={handleSendToVendors} disabled={saving}>
                {saving ? 'Saving…' : <><SendIcon /> Send to vendors</>}
              </Button>
            </div>
          </div>
        </section>

        <aside className="crfp-preview">
          <RfpDocumentPreview
            docNumber="RFP-2026-018"
            date="May 23, 2026"
            status="Draft"
            title={title}
            preparedBy="Prepared by Acme Corp • Procurement Division"
            sections={previewSections}
          />
        </aside>
      </div>
      {modal === 'empty-fields' && (
        <ConfirmModal
          title="Nothing to send"
          body="Please fill in at least the project title or one section before sending to vendors."
          iconVariant="info"
          onDismiss={() => setModal(null)}
          actions={[
            { label: 'OK, got it', variant: 'primary', onClick: () => setModal(null) },
          ]}
        />
      )}

      {showCancelModal && (
        <div className="crfp-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="crfp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crfp-modal-header">
              <TrashIcon />
              <h2 className="crfp-modal-title">Cancel RFP?</h2>
            </div>
            <p className="crfp-modal-body">
              Are you sure you want to cancel this RFP? All unsaved changes will be discarded and you will be taken back to the dashboard.
            </p>
            <div className="crfp-modal-actions">
              <button className="crfp-modal-btn crfp-modal-btn-secondary" onClick={() => setShowCancelModal(false)}>
                Keep editing
              </button>
              <button className="crfp-modal-btn crfp-modal-btn-danger" onClick={confirmCancel}>
                Yes, cancel RFP
              </button>
            </div>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}

export default CreateRFP1;





