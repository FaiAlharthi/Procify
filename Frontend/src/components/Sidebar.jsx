import { useState } from 'react';
import Logo from './Logo';
import ConfirmModal from './ConfirmModal';
import './Sidebar.css';

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function StackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

const ICONS = {
  grid: GridIcon,
  plus: PlusIcon,
  stack: StackIcon,
};

// Each item's `key` doubles as the page key passed to onNavigate.
const DEFAULT_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'create-rfp', label: 'Create RFP', icon: 'plus' },
  { key: 'received-proposals', label: 'Received Proposals', icon: 'stack' },
];
const DEFAULT_PROFILE = { initials: 'AB', name: 'Abrar', role: 'Employee' };

function Sidebar({
  active = 'dashboard',
  defaultCollapsed = false,
  navItems = DEFAULT_NAV,
  profile = DEFAULT_PROFILE,
  onNavigate,
  onSignOut,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showSignOut, setShowSignOut] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronLeftIcon />
      </button>

      <div className="sidebar-logo">
        <Logo width={collapsed ? 40 : 110} />
      </div>

      <p className="sidebar-section-label">Workspace</p>

      <nav className="sidebar-nav">
        {navItems.map(({ key, label, icon }) => {
          const Icon = ICONS[icon] || StackIcon;
          return (
            <button
              key={key}
              className={`sidebar-item ${active === key ? 'is-active' : ''}`}
              onClick={() => onNavigate?.(key)}
              title={label}
            >
              <span className="sidebar-item-icon"><Icon /></span>
              <span className="sidebar-item-label">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div
          className="sidebar-profile"
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate?.('profile')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onNavigate?.('profile')}
        >
          <div className="sidebar-avatar">{profile.initials}</div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{profile.name}</span>
            <span className="sidebar-profile-role">{profile.role}</span>
          </div>
        </div>
        <button className="sidebar-signout" onClick={() => setShowSignOut(true)}>
          <SignOutIcon />
          <span className="sidebar-item-label">Sign out</span>
        </button>
      </div>

      {showSignOut && (
        <ConfirmModal
          title="Sign out?"
          icon={<SignOutIcon />}
          iconVariant="danger"
          body="You will be returned to the login screen. Any unsaved changes will be lost."
          onDismiss={() => setShowSignOut(false)}
          actions={[
            { label: 'Cancel',   variant: 'secondary', onClick: () => setShowSignOut(false) },
            { label: 'Sign out', variant: 'danger',    onClick: () => { setShowSignOut(false); onSignOut?.(); } },
          ]}
        />
      )}
    </aside>
  );
}

export default Sidebar;

