import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../components/Icon';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import { ConfidenceBadge, IssueBadge, StatusBadge } from '../components/StatusBadge';
import { documentApi, getApiError } from '../lib/api';
import { formatCurrency, formatDate, getDocumentData, getDocumentIssues } from '../lib/format';

function SummaryCard({ icon, label, value, detail, tone }) {
  const tones = { cyan: 'bg-cyan-50 text-cyan-700', violet: 'bg-violet-50 text-violet-700', amber: 'bg-amber-50 text-amber-700' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30"><div className="flex items-start justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon name={icon} size={19} /></span><span className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">This workspace</span></div><p className="mt-5 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-400">{detail}</p></div>;
}

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    documentApi.list().then(({ data }) => { if (active) setDocuments(data.documents || []); }).catch((requestError) => { if (active) setError(getApiError(requestError, 'Could not load your dashboard.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const totalSpend = documents.reduce((sum, document) => sum + (Number(getDocumentData(document).total) || 0), 0);
    const issueCount = documents.filter((document) => getDocumentIssues(document).length > 0).length;
    return { totalSpend, issueCount };
  }, [documents]);

  if (loading) return <><PageHeader eyebrow="Workspace overview" title="Good morning" description="A quick view of your document operations." /><LoadingState label="Gathering workspace insights…" /></>;

  return <div><PageHeader eyebrow="Workspace overview" title="Good morning" description="A quick view of your document operations." action={<Link className="button-primary" to="/upload"><Icon name="upload" size={16} />Upload document</Link>} />
    {error && <div className="form-error mb-6"><Icon name="alert" size={16} />{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><SummaryCard detail="Across your workspace" icon="file" label="Total documents" tone="cyan" value={documents.length} /><SummaryCard detail="Sum of extracted totals" icon="dollar" label="Total spend" tone="violet" value={formatCurrency(stats.totalSpend)} /><SummaryCard detail={stats.issueCount ? 'Needs your attention' : 'Everything looks clear'} icon="alert" label="Documents with issues" tone="amber" value={stats.issueCount} /></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-950">Recent documents</h2><p className="mt-1 text-xs text-slate-400">Your latest uploads and reviews</p></div><Link className="text-xs font-bold text-cyan-700 hover:text-cyan-600" to="/documents">View all <span aria-hidden="true">→</span></Link></div>{documents.length === 0 ? <div className="px-5 py-16 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"><Icon name="file" size={22} /></span><h3 className="mt-4 font-bold text-slate-900">Your workspace is ready</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">Upload your first invoice and let DocuMind extract the details.</p><Link className="button-primary mt-5" to="/upload"><Icon name="upload" size={15} />Upload first document</Link></div> : <div className="divide-y divide-slate-100">{documents.slice(0, 5).map((document) => { const data = getDocumentData(document); const issues = getDocumentIssues(document); return <Link className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50" key={document.id} to={`/documents/${document.id}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Icon name="file" size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{data.vendor || document.originalName || 'Untitled document'}</p><p className="mt-1 text-xs text-slate-400">{formatDate(data.date)} · {document.originalName || 'Uploaded file'}</p></div><div className="hidden text-right sm:block"><p className="text-sm font-bold text-slate-800">{formatCurrency(data.total, data.currency)}</p><div className="mt-1"><IssueBadge count={issues.length} /></div></div><StatusBadge status={document.status} /><Icon className="hidden text-slate-300 sm:block" name="arrow" size={16} /></Link>; })}</div>}</section>
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 p-6 text-white"><div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" /><div className="relative"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Icon name="sparkles" size={20} /></span><h2 className="mt-5 text-xl font-bold tracking-tight">Make review effortless</h2><p className="mt-3 text-sm leading-6 text-slate-400">DocuMind flags missing fields, mismatched totals, and duplicates so you can approve with confidence.</p><Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200" to="/upload">Process a document <Icon name="arrow" size={16} /></Link></div></section>
    </div>
  </div>;
}
