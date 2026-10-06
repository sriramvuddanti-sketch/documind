import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';
import { documentApi, getApiError } from '../lib/api';
import { formatFileType } from '../lib/format';

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

export default function Upload() {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const chooseFile = (candidate) => {
    if (!candidate) return;
    const extension = `.${candidate.name.split('.').pop().toLowerCase()}`;
    if (!ACCEPTED_TYPES.includes(candidate.type) || !ACCEPTED_EXTENSIONS.includes(extension)) { setError('Please choose a PDF, JPG, JPEG, or PNG file.'); return; }
    if (candidate.size > 10 * 1024 * 1024) { setError('Files must be smaller than 10MB.'); return; }
    setError(''); setFile(candidate);
  };

  const handleDrop = (event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); };
  const handleSubmit = async (event) => {
    event.preventDefault(); if (!file) { setError('Choose a document before continuing.'); return; }
    setError(''); setUploading(true);
    try { const { data } = await documentApi.upload(file); navigate(`/documents/${data.document.id}`, { replace: true }); }
    catch (requestError) { setError(getApiError(requestError, 'We could not process this document.')); setUploading(false); }
  };

  return <div><PageHeader eyebrow="AI-powered ingestion" title="Upload a document" description="Drop an invoice or bill below. DocuMind will extract the fields and surface anything that needs a review." />
    <div className="mx-auto max-w-3xl"><form onSubmit={handleSubmit}><div className={`relative rounded-3xl border-2 border-dashed p-6 transition sm:p-12 ${dragging ? 'border-cyan-400 bg-cyan-50' : 'border-slate-300 bg-white hover:border-cyan-300'}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}><input accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} ref={inputRef} type="file" />{uploading ? <div className="flex flex-col items-center justify-center py-12 text-center"><span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"><span className="absolute inset-0 rounded-2xl border-2 border-cyan-200 border-t-cyan-600 spinner" /><Icon name="sparkles" size={26} /></span><h2 className="mt-6 text-xl font-bold text-slate-950">AI is reading your document</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">We’re extracting vendor details, totals, and line items. This usually takes a few seconds.</p><div className="mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-500" /></div></div> : file ? <div className="flex flex-col items-center justify-center py-10 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><Icon name="file" size={29} /></span><h2 className="mt-5 max-w-full truncate px-4 text-lg font-bold text-slate-950">{file.name}</h2><p className="mt-2 text-sm text-slate-500">{formatFileType(file.type)} · {(file.size / 1024 / 1024).toFixed(2)} MB</p><button className="button-secondary mt-5" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }} type="button"><Icon name="close" size={15} />Choose another</button></div> : <div className="flex flex-col items-center justify-center py-10 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-cyan-300 shadow-xl shadow-slate-900/10"><Icon name="upload" size={27} /></span><h2 className="mt-5 text-xl font-bold text-slate-950">Drop your document here</h2><p className="mt-2 text-sm text-slate-500">or click to browse from your computer</p><button className="button-secondary mt-5" onClick={() => inputRef.current?.click()} type="button">Browse files <Icon name="arrow" size={15} /></button><p className="mt-5 text-xs font-medium text-slate-400">PDF, JPG, JPEG, or PNG · Max 10MB</p></div>}</div>{error && <div className="form-error mt-4"><Icon name="alert" size={16} />{error}</div>}<div className="mt-5 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center"><Link className="text-center text-sm font-semibold text-slate-500 hover:text-slate-800 sm:text-left" to="/documents">Cancel</Link><button className="button-primary py-3 sm:min-w-44" disabled={!file || uploading} type="submit">{uploading ? <><span className="spinner h-4 w-4 border-white/30 border-t-white" />Processing…</> : <><Icon name="sparkles" size={16} />Extract with AI</>}</button></div></form><div className="mt-10 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4"><Icon className="text-cyan-600" name="sparkles" size={19} /><p className="mt-3 text-sm font-bold text-slate-800">AI extraction</p><p className="mt-1 text-xs leading-5 text-slate-500">Fields and line items are structured automatically.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><Icon className="text-cyan-600" name="alert" size={19} /><p className="mt-3 text-sm font-bold text-slate-800">Smart validation</p><p className="mt-1 text-xs leading-5 text-slate-500">Missing data and mismatches are highlighted.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4"><Icon className="text-cyan-600" name="check" size={19} /><p className="mt-3 text-sm font-bold text-slate-800">Review with confidence</p><p className="mt-1 text-xs leading-5 text-slate-500">Edit and approve your document in one place.</p></div></div></div>
  </div>;
}
