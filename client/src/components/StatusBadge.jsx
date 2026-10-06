import Icon from './Icon';

const statusStyles = { approved: 'border-emerald-200 bg-emerald-50 text-emerald-700', completed: 'border-cyan-200 bg-cyan-50 text-cyan-700', processing: 'border-amber-200 bg-amber-50 text-amber-700', failed: 'border-rose-200 bg-rose-50 text-rose-700' };
const statusIcons = { approved: 'check', completed: 'file', processing: 'clock', failed: 'alert' };

export function StatusBadge({ status = 'completed' }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.completed}`}><Icon name={statusIcons[status] || 'file'} size={13} strokeWidth={2} />{label}</span>;
}

export function ConfidenceBadge({ confidence }) {
  const score = Number(confidence || 0);
  const level = score >= 0.85 ? 'High' : score >= 0.65 ? 'Medium' : 'Low';
  const styles = { High: 'border-emerald-200 bg-emerald-50 text-emerald-700', Medium: 'border-amber-200 bg-amber-50 text-amber-700', Low: 'border-rose-200 bg-rose-50 text-rose-700' };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[level]}`}>{level} confidence · {Math.round(score * 100)}%</span>;
}

export function IssueBadge({ count = 0 }) {
  if (!count) return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />No issues</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"><Icon name="alert" size={13} strokeWidth={2} />{count} {count === 1 ? 'issue' : 'issues'}</span>;
}
