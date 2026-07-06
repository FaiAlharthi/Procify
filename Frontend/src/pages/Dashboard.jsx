import { useEffect, useState } from 'react';
import EmployeeLayout from '../components/EmployeeLayout';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getRFPs } from '../api/rfps';
import './Dashboard.css';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function FileCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 15l2 2 4-4" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
    </svg>
  );
}
function PieIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 1 0 9 9h-9z" /><path d="M12 3v9" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7.5" y="3" width="9.5" height="12" rx="1.5" opacity="0.4" />
      <rect x="4" y="5.5" width="9.5" height="12" rx="1.5" />
      <path d="M6.3 9h5M6.3 11.6h5M6.3 14.2h3" />
      <circle cx="16.6" cy="16.6" r="2.8" />
      <path d="M18.6 18.6L21 21" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Dashboard({ onNavigate, onSignOut, onOpenRfp, onViewComparison }) {
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    getRFPs()
      .then(setRfps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const closed     = rfps.filter((r) => r.status === 'closed').length;
  const inProgress = rfps.filter((r) => r.status === 'inProgress').length;
  const drafts     = rfps.filter((r) => r.status === 'draft').length;
  const total      = rfps.length;

  const STATS = [
    { variant: 'green',  count: closed,     label: 'Closed',      icon: <FileCheckIcon />, filterKey: 'closed' },
    { variant: 'blue',   count: inProgress, label: 'In Progress', icon: <ClockIcon />,     filterKey: 'inProgress' },
    { variant: 'orange', count: drafts,     label: 'Drafts',      icon: <FileIcon />,      filterKey: 'draft' },
    { variant: 'gray',   count: total,      label: 'Total',       icon: <PieIcon />,       filterKey: null },
  ];

  function toggleFilter(key) {
    setStatusFilter((prev) => (prev === key ? null : key));
  }

  const filtered = rfps.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === null || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <EmployeeLayout active="dashboard" onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="dash-search">
        <span className="dash-search-icon"><SearchIcon /></span>
        <input
          className="dash-search-input"
          type="text"
          placeholder="Search by RFP title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="dash-actions">
        <Button variant="secondary" onClick={() => onNavigate?.('received-proposals')}>
          <DocIcon /> Received Proposals
        </Button>
        <Button variant="primary" onClick={() => onNavigate?.('create-rfp')}>
          <PlusIcon /> New RFP
        </Button>
      </div>

      <div className="dash-stats">
        {STATS.map((s) => (
          <StatCard
            key={s.label}
            variant={s.variant}
            icon={s.icon}
            count={s.count}
            label={s.label}
            active={statusFilter === s.filterKey && s.filterKey !== null}
            onClick={() => toggleFilter(s.filterKey)}
          />
        ))}
      </div>

      <section className="dash-panel">
        <header className="dash-panel-head">
          <h2 className="dash-panel-title">Recent RFPs</h2>
          <p className="dash-panel-subtitle">Sorted by deadline.</p>
        </header>

        <table className="dash-table">
          <thead>
            <tr>
              <th>RFP Title</th>
              <th>Date Created</th>
              <th>Vendors Matched</th>
              <th>Status</th>
              <th>Analysis</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                  Loading RFPs...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                  {search ? 'No RFPs match your search.' : 'No RFPs yet. Create your first one.'}
                </td>
              </tr>
            )}
            {!loading && filtered.map((rfp) => (
              <tr key={rfp.rfp_id}>
                <td className="dash-td-title">
                  <button
                    type="button"
                    className="dash-title-btn"
                    onClick={() => onOpenRfp?.(rfp)}
                  >
                    {rfp.title}
                  </button>
                </td>
                <td className="dash-td-muted">{rfp.date_created ?? '-'}</td>
                <td className="dash-td-muted">{rfp.vendors_matched ?? 0} vendors</td>
                <td>
                  <button
                    type="button"
                    className="dash-badge-btn"
                    onClick={() => onOpenRfp?.(rfp)}
                  >
                    <StatusBadge status={rfp.status} />
                  </button>
                </td>
                <td>
                  <button
                    className="dash-link"
                    onClick={() => (onViewComparison ? onViewComparison(rfp) : onOpenRfp?.(rfp))}
                  >
                    View Comparison
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </EmployeeLayout>
  );
}

export default Dashboard;
