import './StatusBadge.css';

const LABEL_MAP = {
  inProgress: 'In Progress',
  closed: 'Closed',
  draft: 'Draft',
};

const VARIANT_MAP = {
  'In Progress': 'info',
  'Closed': 'success',
  'Draft': 'warning',
};

function StatusBadge({ status }) {
  const label = LABEL_MAP[status] ?? status;
  const variant = VARIANT_MAP[label] ?? 'info';
  return <span className={'badge badge-' + variant}>{label}</span>;
}

export default StatusBadge;
