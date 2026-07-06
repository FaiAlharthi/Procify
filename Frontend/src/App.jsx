import { useEffect, useState } from 'react';

import IntroPage from './pages/IntroPage';
import { clearSession, loadSession } from './api/auth';
import { getEmployee } from './api/employees';
import { getVendor } from './api/vendors';
import Dashboard from './pages/Dashboard';
import CreateRFP1 from './pages/CreateRFP1';
import CreateRFP2 from './pages/CreateRFP2';
import ProposalLists from './pages/ProposalLists';
import VendorComparison from './pages/VendorComparison';
import ProposalDetails from './pages/ProposalDetails';
import VendorPOV from './pages/VendorPOV';
import SubmitProposal from './pages/SubmitProposal';
import VendorSelection from './pages/VendorSelection';
import RfpSentSuccess from './pages/RfpSentSuccess';
import RfpDetailsClosedPage from './pages/RfpDetailsClosedPage';
import RfpDetailsInProgressPage from './pages/RfpDetailsInProgressPage';
import RfpDetailsDraftPage from './pages/RfpDetailsDraftPage';
import Profile from './pages/Profile';
import LogoutScreen from './pages/LogoutScreen';

export default function App() {
  // Single source of truth for which screen shows. 'login' = logged out.
  const [page, setPage] = useState('login');
  const [sentInfo, setSentInfo] = useState(null);
  const [activeRfp, setActiveRfp] = useState(null);

  // Holds the last "Save as draft" snapshot ({ title, fields }) or null.
  const [draft, setDraft] = useState(null);

  // The RFP a vendor selected to submit a proposal against.
  const [selectedRfp, setSelectedRfp] = useState(null);

  // The RFP saved by the employee during Create RFP flow.
  const [createdRfp, setCreatedRfp] = useState(null);

  // Form data passed from CreateRFP1 → CreateRFP2 (Enhance with AI).
  const [rfpFormState, setRfpFormState] = useState(null);

  // Proposal selected from Received Proposals list for detail view.
  const [activeProposal, setActiveProposal] = useState(null);

  // The signed-in user: { role: 'employee' | 'vendor', id: '<typed at login>' } or null.
  const [user, setUser] = useState(null);

  // Real vendor record fetched once after login — drives sidebar + profile.
  const [vendorInfo, setVendorInfo] = useState(null);

  // Real employee record fetched once after login — drives profile page.
  const [employeeInfo, setEmployeeInfo] = useState(null);

  // Restore session from localStorage on first load.
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser(session.user);
      setPage(session.user.role === 'vendor' ? 'vendor-portal' : 'dashboard');
    }
  }, []);

  // Fetch vendor details whenever the logged-in vendor ID changes.
  useEffect(() => {
    if (user?.role === 'vendor' && user.id) {
      getVendor(user.id).then(setVendorInfo).catch(() => {});
    } else {
      setVendorInfo(null);
    }
  }, [user?.role, user?.id]);

  // Fetch employee details whenever the logged-in employee ID changes.
  // Also syncs the name into localStorage so the sidebar always matches the profile page.
  useEffect(() => {
    if (user?.role === 'employee' && user.id) {
      getEmployee(user.id).then((info) => {
        // Write to localStorage BEFORE calling setEmployeeInfo so the sidebar
        // reads the fresh name on the very next render EmployeeLayout does.
        try {
          const stored = JSON.parse(localStorage.getItem('procify_user') || '{}');
          localStorage.setItem('procify_user', JSON.stringify({
            ...stored,
            name: info.name,
            company_name: info.company_name,
            company_id: info.company_id,
          }));
        } catch { /* ignore */ }
        setEmployeeInfo(info);
      }).catch(() => {});
    } else {
      setEmployeeInfo(null);
    }
  }, [user?.role, user?.id]);

  // One navigation helper handed down to every screen.
  const navigate = (next) => setPage(next);

  // Sidebar-compatible profile object for the logged-in vendor.
  function mkInitials(name) {
    return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }
  const vendorProfile = vendorInfo
    ? { initials: mkInitials(vendorInfo.company_name), name: vendorInfo.company_name, role: 'Vendor' }
    : { initials: '…', name: 'Loading…', role: 'Vendor' };

  // Persist a draft from the Create RFP form.
  const saveDraft = (data) => setDraft(data);

  // Login: capture the user (role + entered id) and route to the landing page.
  const signIn = ({ role, credentials }) => {
    setUser({ role, id: credentials?.id ?? '', name: credentials?.name ?? '' });
    setPage(role === 'vendor' ? 'vendor-portal' : 'dashboard');
  };

  // Sign out: clear JWT + session and show the logout confirmation screen.
  const signOut = () => {
    clearSession();
    setUser(null);
    setPage('logout');
  };

  // RBAC guards — redirect if the user navigates to the wrong role's pages
  // 'profile' is shared — both roles can access it.
  const VENDOR_ONLY_PAGES = new Set(['vendor-portal', 'submit-proposal']);
  const SHARED_PAGES = new Set(['profile']);
  const VENDOR_PAGES = new Set([...VENDOR_ONLY_PAGES, ...SHARED_PAGES]);
  const PUBLIC_PAGES = new Set(['login', 'logout']);
  if (user && !PUBLIC_PAGES.has(page)) {
    if (user.role === 'vendor' && !VENDOR_PAGES.has(page)) {
      return <VendorPOV onNavigate={navigate} onSignOut={signOut} onSelectRfp={setSelectedRfp} user={user} vendorProfile={vendorProfile} />;
    }
    if (user.role === 'employee' && VENDOR_ONLY_PAGES.has(page)) {
      return <Dashboard onNavigate={navigate} onSignOut={signOut}
        onOpenRfp={(rfp) => {
          setActiveRfp(rfp);
          if (rfp.status === 'closed') navigate('rfp-details-closed');
          else if (rfp.status === 'inProgress') navigate('rfp-details-inprogress');
          else if (rfp.status === 'draft') navigate('rfp-details-draft');
          else navigate('vendor-comparison');
        }}
        onViewComparison={(rfp) => { setActiveRfp(rfp); navigate('vendor-comparison'); }}
      />;
    }
  }

  switch (page) {
    case 'dashboard':
      return (
        <Dashboard
          onNavigate={navigate}
          onSignOut={signOut}
          onViewComparison={(rfp) => { setActiveRfp(rfp); navigate('vendor-comparison'); }}
          onOpenRfp={(rfp) => {
            setActiveRfp(rfp);
            if (rfp.status === 'closed') navigate('rfp-details-closed');
            else if (rfp.status === 'inProgress') navigate('rfp-details-inprogress');
            else if (rfp.status === 'draft') navigate('rfp-details-draft');
            else navigate('vendor-comparison');
          }}
        />
      );

    case 'create-rfp':
      return (
        <CreateRFP1
          key="fresh"
          onNavigate={navigate}
          onSignOut={signOut}
          onSaveDraft={saveDraft}
          onRfpCreated={setCreatedRfp}
          onEnhanceAI={setRfpFormState}
          existingRfp={null}
          user={user}
        />
      );

    case 'edit-draft':
      return (
        <CreateRFP1
          key="draft"
          initialData={draft}
          onNavigate={navigate}
          onSignOut={signOut}
          onSaveDraft={saveDraft}
          onRfpCreated={setCreatedRfp}
          onEnhanceAI={setRfpFormState}
          existingRfp={createdRfp}
          user={user}
        />
      );

    case 'received-proposals':
      return <ProposalLists onNavigate={navigate} onSignOut={signOut} onSelectProposal={setActiveProposal} />;

    // "Enhance it with AI" view = your colleague's CreateRFP2 (Step 2 of 3).
    case 'enhance-ai':
      return (
        <CreateRFP2
          onNavigate={navigate}
          onSignOut={signOut}
          rfpData={rfpFormState}
          user={user}
          onRfpCreated={setCreatedRfp}
          onSaveDraft={saveDraft}
          existingRfp={createdRfp}
          onBackFromEnhance={(updatedData) => {
            setDraft(updatedData);
          }}
        />
      );

    case 'vendor-selection':
      return (
        <VendorSelection
          onNavigate={navigate}
          onSignOut={signOut}
          rfp={createdRfp}
          onConfirmSend={(vendors) => {
            setSentInfo({
              count: vendors.length,
              title: createdRfp?.title ?? 'RFP',
              date: new Date().toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              }),
            });
            navigate('rfp-sent-success');
          }}
        />
      );

    case 'rfp-sent-success':
      return <RfpSentSuccess info={sentInfo} onNavigate={navigate} onSignOut={signOut} />;

    case 'rfp-details-draft':
      return (
        <RfpDetailsDraftPage
          rfp={activeRfp}
          onNavigate={navigate}
          onSignOut={signOut}
          onEditDraft={(rfp) => {
            setCreatedRfp(rfp);
            setDraft({
              title: rfp.title,
              fields: {
                objective:  rfp.objective        ?? '',
                scope:      rfp.scope_of_work     ?? '',
                technical:  rfp.technical_criteria ?? '',
                commercial: rfp.commercials        ?? '',
                delivery:   rfp.project_delivery   ?? '',
              },
            });
          }}
        />
      );

    case 'rfp-details-closed':
      return <RfpDetailsClosedPage rfp={activeRfp} onNavigate={navigate} onSignOut={signOut} />;

    case 'rfp-details-inprogress':
      return <RfpDetailsInProgressPage rfp={activeRfp} onNavigate={navigate} onSignOut={signOut} onRfpClosed={() => setActiveRfp(null)} />;

    case 'vendor-comparison':
      return <VendorComparison onNavigate={navigate} onSignOut={signOut} rfp={activeRfp} />;

    case 'proposal-details':
      return <ProposalDetails onNavigate={navigate} onSignOut={signOut} proposal={activeProposal} />;

    // ---- Vendor flow ----
    case 'vendor-portal':
      return <VendorPOV onNavigate={navigate} onSignOut={signOut} onSelectRfp={setSelectedRfp} user={user} vendorProfile={vendorProfile} />;

    case 'submit-proposal':
      return <SubmitProposal onNavigate={navigate} onSignOut={signOut} rfp={selectedRfp} user={user} vendorProfile={vendorProfile} />;

    // ---- Profile (role-aware) ----
    case 'profile':
      return <Profile user={user} onNavigate={navigate} onSignOut={signOut} vendorInfo={vendorInfo} employeeInfo={employeeInfo} />;

    // ---- Logout confirmation ----
    case 'logout':
      return <LogoutScreen onBackToLogin={() => setPage('login')} />;

    case 'login':
    default:
      return <IntroPage onSignIn={signIn} />;
  }
}
