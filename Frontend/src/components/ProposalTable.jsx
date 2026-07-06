import MatchBar from './MatchBar';
import './ProposalTable.css';

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}
function CheckCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#16a34a" stroke="#ffffff"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" stroke="none" />
      <path d="M8 12l3 3 5-5" fill="none" />
    </svg>
  );
}

/*
  mode: 'select' (checkboxes, In Progress) | 'result' (green selected row, Closed)
  vendors: [{ id, name, score }]
  selectedIds: array of ids (controlled)
*/
function ProposalTable({
  mode = 'select',
  vendors = [],
  selectedIds = [],
  onToggle,
  onToggleAll,
  onDownload,
}) {
  const allChecked = vendors.length > 0 && selectedIds.length === vendors.length;
  const isSel = (id) => selectedIds.includes(id);

  return (
    <div className="ptable-wrap">
      <table className="ptable">
        <thead>
          <tr>
            <th className="ptable-check-col">
              {mode === 'select' && (
                <input
                  type="checkbox"
                  className="ptable-checkbox"
                  checked={allChecked}
                  onChange={onToggleAll}
                  aria-label="Select all"
                />
              )}
            </th>
            <th>Vendor Name</th>
            <th>Vendor ID</th>
            <th>AI Match Score</th>
            <th className="ptable-right">Proposal File</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => {
            const selected = isSel(v.id);
            return (
              <tr key={v.id} className={mode === 'result' && selected ? 'ptable-row-selected' : ''}>
                <td className="ptable-check-col">
                  {mode === 'select' ? (
                    <input
                      type="checkbox"
                      className="ptable-checkbox"
                      checked={selected}
                      onChange={() => onToggle?.(v.id)}
                      aria-label={`Select ${v.name}`}
                    />
                  ) : (
                    selected && <CheckCircle />
                  )}
                </td>
                <td className="ptable-vendor">{v.name}</td>
                <td className="ptable-muted">{v.id}</td>
                <td>
                  {mode === 'result' ? (
                    <span className={`ptable-score ${selected ? 'is-win' : ''}`}>
                      {v.score}% {selected && <span className="ptable-spark">✦</span>}
                    </span>
                  ) : (
                    <MatchBar value={v.score} tone={selected ? 'dark' : 'muted'} />
                  )}
                </td>
                <td className="ptable-right">
                  <button className="ptable-dl" onClick={() => onDownload?.(v)} aria-label={`Download ${v.name} proposal`}>
                    <DownloadIcon />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="ptable-footer">
        <span>showing {vendors.length} of {vendors.length} vendors</span>
        <div className="ptable-pager">
          <button aria-label="Previous">‹</button>
          <button aria-label="Next">›</button>
        </div>
      </div>
    </div>
  );
}

export default ProposalTable;
