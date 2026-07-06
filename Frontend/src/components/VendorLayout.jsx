import Sidebar from './Sidebar';
import './VendorLayout.css';

// Vendor navigation: only "Received RFPs". Its key doubles as the page key.
const VENDOR_NAV = [
  { key: 'vendor-portal', label: 'Received RFPs', icon: 'stack' },
];
const DEFAULT_VENDOR_PROFILE = { initials: 'WC', name: 'WeCloudData', role: 'Vendor' };

function VendorLayout({
  active = 'vendor-portal',
  sidebarCollapsed = false,
  profile = DEFAULT_VENDOR_PROFILE,
  onNavigate,
  onSignOut,
  children,
}) {
  return (
    <div className="layout">
      <Sidebar
        active={active}
        defaultCollapsed={sidebarCollapsed}
        navItems={VENDOR_NAV}
        profile={profile}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
      />
      <main className="layout-main">{children}</main>
    </div>
  );
}

export default VendorLayout;
