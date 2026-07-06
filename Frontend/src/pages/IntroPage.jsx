import { useState } from 'react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { loginUser, saveSession } from '../api/auth';
import './IntroPage.css';

function EmployeeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="2" />
      <path d="M15 8h3M15 12h3M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" />
    </svg>
  );
}

function VendorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v11h16V9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  );
}

function IntroPage({ onSignIn }) {
  const [role, setRole] = useState('employee');
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
    setError('');
  }

  async function handleSignIn() {
    if (!credentials.id || !credentials.password) {
      setError('Please enter your ID and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await loginUser({ userId: credentials.id, password: credentials.password, role });
      saveSession(data);
      onSignIn?.({ role: data.role, credentials: { id: data.user_id, name: data.name } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const idLabel = role === 'employee' ? 'Employee ID' : 'Vendor ID';

  return (
    <div className="intro">

      {/* ── Left — brand panel ── */}
      <section className="intro-brand">
        <div className="intro-brand-orb intro-brand-orb-1" aria-hidden="true" />
        <div className="intro-brand-orb intro-brand-orb-2" aria-hidden="true" />

        <div className="intro-brand-inner">

          {/* Logo pinned at the top */}
          <div className="intro-brand-logo">
            <Logo width={160} />
          </div>

          {/* Copy + features centered in remaining space */}
          <div className="intro-brand-body">
            <div className="intro-brand-copy">
              <span className="intro-brand-badge">AI-Powered Procurement</span>
              <h1 className="intro-title">
                Welcome to Procify — step into
                the future of RFP management.
              </h1>
              <p className="intro-subtitle">
                Draft RFPs in minutes, match vendors with confidence, and close
                procurement loops faster than your competitors can schedule a meeting.
              </p>
            </div>

            <ul className="intro-features">
              <li className="intro-feature">
                <span className="intro-feature-ic"><ZapIcon /></span>
                <span>Draft structured RFPs in minutes with AI assistance</span>
              </li>
              <li className="intro-feature">
                <span className="intro-feature-ic"><UsersIcon /></span>
                <span>AI-ranked vendor matching based on proposal fit</span>
              </li>
              <li className="intro-feature">
                <span className="intro-feature-ic"><CheckCircleIcon /></span>
                <span>End-to-end procurement from draft to award</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ── Right — form panel ── */}
      <section className="intro-form-panel">
        <div className="intro-form-card">
          <div className="intro-form">
            <h2 className="intro-form-title">Sign in to your workspace</h2>
            <p className="intro-form-subtitle">
              Use your work credentials to access your procurement console.
            </p>

            <div className="role-toggle" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={role === 'employee'}
                className={`role-toggle-btn ${role === 'employee' ? 'is-active' : ''}`}
                onClick={() => setRole('employee')}
              >
                <EmployeeIcon /> Employee
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={role === 'vendor'}
                className={`role-toggle-btn ${role === 'vendor' ? 'is-active' : ''}`}
                onClick={() => setRole('vendor')}
              >
                <VendorIcon /> Vendor
              </button>
            </div>

            <div className="intro-fields">
              <InputField
                id="userId"
                name="id"
                label={idLabel}
                placeholder=""
                value={credentials.id}
                onChange={handleChange}
              />
              <InputField
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>

            {error && <p className="intro-error">{error}</p>}

            <Button variant="primary" className="intro-submit" onClick={handleSignIn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}

export default IntroPage;
