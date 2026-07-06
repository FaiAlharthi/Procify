import { useEffect, useState } from 'react';
import VendorLayout from '../components/VendorLayout';
import OpportunityCard from '../components/OpportunityCard';
import { getRFPs } from '../api/rfps';
import { BASE_URL } from '../api/client';
import './VendorPOV.css';

function VendorPOV({ onNavigate, onSignOut, onSelectRfp, user, vendorProfile }) {
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const vid = user?.id ?? null;
    getRFPs(vid)
      .then(setRfps)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  function handleSubmit(rfp) {
    onSelectRfp?.(rfp);
    onNavigate?.('submit-proposal');
  }

  const vendorId = user?.id ?? '';
  const open = rfps.filter((r) => r.status === 'inProgress');
  const awarded = rfps.filter((r) => r.status === 'closed' && r.winner_vendor_id === vendorId);

  return (
    <VendorLayout active="vendor-portal" profile={vendorProfile} onNavigate={onNavigate} onSignOut={onSignOut}>
      <div className="vpov-topbar">
        <div className="vpov-active">
          <p className="vpov-active-label">Active Vendor</p>
          <p className="vpov-active-name">{user?.name ?? 'Vendor'}</p>
        </div>
        <span className="vpov-id">ID: {vendorId || '-'}</span>
      </div>

      <header className="vpov-header">
        <h1 className="vpov-title">RFP Opportunities</h1>
        <p className="vpov-subtitle">
          Browse and respond to active procurement requests within your sector.
        </p>
      </header>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading opportunities...</p>}
      {error && <p style={{ color: 'red' }}>Failed to load RFPs: {error}</p>}

      {!loading && !error && open.length === 0 && awarded.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>No open RFPs available yet.</p>
      )}

      {!loading && !error && open.length > 0 && (
        <div className="vpov-list">
          {open.map((rfp) => (
            <OpportunityCard
              key={rfp.rfp_id}
              title={rfp.title}
              dueLabel={'Created ' + (rfp.date_created ?? rfp.rfp_id)}
              onViewDocument={() => window.open(`${BASE_URL}/rfps/${rfp.rfp_id}/pdf`, '_blank')}
              onSubmit={() => handleSubmit(rfp)}
            />
          ))}
        </div>
      )}

      {!loading && !error && awarded.length > 0 && (
        <>
          <h2 className="vpov-section-heading">Awarded to You</h2>
          <div className="vpov-list">
            {awarded.map((rfp) => (
              <div key={rfp.rfp_id} className="vpov-awarded-wrap">
                <span className="vpov-awarded-badge">Awarded</span>
                <OpportunityCard
                  title={rfp.title}
                  dueLabel={'Closed ' + (rfp.date_created ?? rfp.rfp_id)}
                  onViewDocument={() => window.open(`${BASE_URL}/rfps/${rfp.rfp_id}/pdf`, '_blank')}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </VendorLayout>
  );
}

export default VendorPOV;
