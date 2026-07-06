import { useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import VendorLayout from '../components/VendorLayout';
import ConfirmModal from '../components/ConfirmModal';
import { BuildingIcon, TagIcon } from '../components/icons';
import './Profile.css';

/* ---- field icons ---- */
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}
function IdIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="2" />
      <path d="M6.5 16c.4-1.2 2-1.8 3-1.8s2.6.6 3 1.8M14 10h4M14 14h3" />
    </svg>
  );
}

const ICONS = { user: UserIcon, id: IdIcon, company: BuildingIcon, tag: TagIcon };

function initials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function Profile({ user, onNavigate, onSignOut, vendorInfo, employeeInfo }) {
  const isVendor = user?.role === 'vendor';
  const Layout = isVendor ? VendorLayout : EmployeeLayout;
  const [showSignOut, setShowSignOut] = useState(false);

  // Build sidebar-compatible profile so the sidebar reflects real vendor data too.
  const vendorProfile = vendorInfo
    ? { initials: initials(vendorInfo.company_name), name: vendorInfo.company_name, role: 'Vendor' }
    : null;

  /* ---- build display data ---- */
  let heading, roleLabel, meta, fields, avatarInitials;

  if (isVendor) {
    const companyName  = vendorInfo?.company_name  ?? '—';
    const vendorId     = vendorInfo?.vendor_id     ?? user?.id ?? '—';
    const description  = vendorInfo?.description   ?? '—';

    avatarInitials = initials(companyName);
    heading        = companyName;
    roleLabel      = 'Vendor';
    meta           = `ID · ${vendorId}`;
    fields = [
      { label: 'Company Name',  value: companyName,  icon: 'company', wide: true },
      { label: 'Vendor ID',     value: vendorId,     icon: 'id' },
      { label: 'Description',   value: description,  icon: 'tag', wide: true },
    ];
  } else {
    const empName    = employeeInfo?.name        ?? user?.name     ?? '—';
    const empId      = employeeInfo?.employee_id ?? user?.id       ?? '—';
    const empCompany = employeeInfo?.company_name ?? 'Procify Corp';
    const empCompId  = employeeInfo?.company_id  ?? 'C0001';

    avatarInitials = initials(empName);
    heading        = empName;
    roleLabel      = 'Employee';
    meta           = `ID · ${empId}`;
    fields = [
      { label: 'Employee Name', value: empName,    icon: 'user', wide: true },
      { label: 'Employee ID',   value: empId,       icon: 'id' },
      { label: 'Company Name',  value: empCompany,  icon: 'company' },
      { label: 'Company ID',    value: empCompId,   icon: 'tag' },
    ];
  }

  return (
    <Layout active="profile" profile={vendorProfile ?? undefined} onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="profile">
        <div className="profile-card">
          {/* Brand header */}
          <div className="profile-banner">
            <span className="profile-banner-glow" />
            <div className="profile-avatar">{avatarInitials}</div>
            <div className="profile-identity">
              <h1 className="profile-name">{heading}</h1>
              <div className="profile-tags">
                <span className="profile-role">{roleLabel}</span>
                <span className="profile-meta">{meta}</span>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="profile-body">
            <p className="profile-section-label">Account details</p>

            <div className="profile-grid">
              {fields.map((f) => {
                const Icon = ICONS[f.icon];
                return (
                  <div className={`profile-field${f.wide ? ' is-wide' : ''}`} key={f.label}>
                    <span className="profile-field-label">{f.label}</span>
                    <div className="profile-field-box" tabIndex={0}>
                      <span className="profile-field-icon">{Icon && <Icon />}</span>
                      <span className="profile-field-value">{f.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="profile-actions">
              <button
                className="profile-btn-ghost"
                onClick={() => onNavigate?.(isVendor ? 'vendor-portal' : 'dashboard')}
              >
                Back to {isVendor ? 'portal' : 'dashboard'}
              </button>
              <button className="profile-btn-primary" onClick={() => setShowSignOut(true)}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSignOut && (
        <ConfirmModal
          title="Sign out?"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          }
          iconVariant="danger"
          body="You will be returned to the login screen. Any unsaved changes will be lost."
          actions={[
            { label: 'Cancel',   variant: 'secondary', onClick: () => setShowSignOut(false) },
            { label: 'Sign out', variant: 'danger',    onClick: onSignOut },
          ]}
          onDismiss={() => setShowSignOut(false)}
        />
      )}
    </Layout>
  );
}

export default Profile;
