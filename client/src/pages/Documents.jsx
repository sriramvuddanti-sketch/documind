import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Icon from '../components/Icon';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import { IssueBadge, StatusBadge } from '../components/StatusBadge';
import { documentApi, getApiError } from '../lib/api';
import { formatCurrency, formatDate, getDocumentData, getDocumentIssues } from '../lib/format';

const statuses = ['all', 'processing', 'completed', 'approved', 'failed'];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    documentApi.list().then(({ data }) => { if (active) setDocuments(data.documents || []); }).catch((requestError) => { if (active) setError(getApiError(requestError, 'Could not load your documents.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredDocuments = useMemo(() => documents.filter((document) => {
    const data = getDocumentData(document);
    const searchable = [data.vendor, data.invoiceNumber, document.originalName, document.docType].filter(Boolean).join(' ').toLowerCase();
    return (!query || searchable.includes(query.toLowerCase())) && (status === 'all' || document.status === status);
  }), [documents, query, status]);

  return <div><PageHeader eyebrow="Document center" title="All documents" description="Search, filter, and review every invoice processed through your workspace." action={<Link className="button-primary" to="/upload"><Icon name="plus" size={16} />New upload</Link>} />
    {error && <div className="form-error mb-6"><Icon name="alert" size={16} />{error}</div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-xs"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" name="search" size={16} /><input aria-label="Search documents" className="field-input pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Search vendor, invoice…" value={query} /></div><div className="relative w-full sm:w-44"><Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" name="filter" size={16} /><select aria-label="Filter by status" className="field-input appearance-none pl-9 pr-8" onChange={(event) => setStatus(event.target.value)} value={status}>{statuses.map((item) => <option key={item} value={item}>{item === 'all' ? 'All statuses' : item.charAt(0).toUpperCase() + item.slice(1)}</option>)}</select><Icon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" name="chevron" size={15} /></div></div>{loading ? <div className="p-4"><LoadingState label="Loading documents…" /></div> : filteredDocuments.length === 0 ? <div className="px-5 py-16 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="search" size={21} /></span><h3 className="mt-4 font-bold text-slate-900">No documents found</h3><p className="mt-2 text-sm text-slate-500">Try another search or upload a new document.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400"><tr><th className="px-5 py-3">Document</th><th className="px-5 py-3">Vendor</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Validation</th><th className="px-5 py-3"><span className="sr-only">Open</span></th></tr></thead><tbody className="divide-y divide-slate-100">{filteredDocuments.map((document) => { const data = getDocumentData(document); const issues = getDocumentIssues(document); return <tr className="group transition hover:bg-slate-50" key={document.id}><td className="px-5 py-4"><Link className="flex items-center gap-3" to={`/documents/${document.id}`}><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700"><Icon name="file" size={16} /></span><span className="max-w-[190px] truncate text-sm font-bold text-slate-800">{document.originalName || 'Untitled document'}</span></Link></td><td className="px-5 py-4 text-sm font-semibold text-slate-700">{data.vendor || '—'}</td><td className="px-5 py-4 text-sm text-slate-500">{formatDate(data.date)}</td><td className="px-5 py-4 text-sm font-bold text-slate-800">{formatCurrency(data.total, data.currency)}</td><td className="px-5 py-4"><StatusBadge status={document.status} /></td><td className="px-5 py-4"><IssueBadge count={issues.length} /></td><td className="px-5 py-4 text-right"><Link aria-label={`Review ${document.originalName || 'document'}`} className="inline-flex rounded-lg p-2 text-slate-400 opacity-70 transition group-hover:bg-white group-hover:text-cyan-700 group-hover:opacity-100" to={`/documents/${document.id}`}><Icon name="arrow" size={16} /></Link></td></tr>; })}</tbody></table></div>}</section>
    <p className="mt-4 text-xs text-slate-400">Showing {filteredDocuments.length} of {documents.length} documents</p>
  </div>;
}
