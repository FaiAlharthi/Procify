import Sidebar from './Sidebar';
import './EmployeeLayout.css';

function mkInitials(name) {
  return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function EmployeeLayout({ active, sidebarCollapsed = false, onNavigate, onSignOut, children }) {
  let profile;
  try {
    const stored = JSON.parse(localStorage.getItem('procify_user') || '{}');
    const name = stored.name || 'Employee';
    const company = stored.company_name || 'Procify Corp';
    profile = { initials: mkInitials(name), name, role: company };
  } catch {
    profile = { initials: 'E', name: 'Employee', role: 'Procify Corp' };
  }

  return (
    <div className="layout">
      <Sidebar
        active={active}
        defaultCollapsed={sidebarCollapsed}
        profile={profile}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
      />
      <main className="layout-main">{children}</main>
    </div>
  );
}

export default EmployeeLayout;