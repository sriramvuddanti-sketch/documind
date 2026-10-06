import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Icon from '../components/Icon';
import LoadingState from '../components/LoadingState';
import { ConfidenceBadge, IssueBadge, StatusBadge } from '../components/StatusBadge';
import { documentApi, getApiError } from '../lib/api';
import { formatCurrency, formatDate, formatFileType, getDocumentData, getDocumentIssues } from '../lib/format';

const emptyLineItem = () => ({ description: '', quantity: '', unitPrice: '', amount: '' });

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const editableFromDocument = (document) => {
  const data = getDocumentData(document);
  return {
    docType: document.docType || 'unknown',
    vendor: data.vendor ?? '',
    invoiceNumber: data.invoiceNumber ?? '',
    date: data.date ?? '',
    dueDate: data.dueDate ?? '',
    currency: data.currency ?? '',
    subtotal: data.subtotal ?? '',
    tax: data.tax ?? '',
    total: data.total ?? '',
    lineItems: (data.lineItems || []).map((item) => ({
      description: item.description ?? '',
      quantity: item.quantity ?? '',
      unitPrice: item.unitPrice ?? '',
      amount: item.amount ?? '',
    })),
  };
};

export default function DocumentReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    documentApi.get(id).then(({ data }) => {
      if (!active) return;
      setDocument(data.document);
      setForm(editableFromDocument(data.document));
    }).catch((requestError) => { if (active) setError(getApiError(requestError, 'Could not load this document.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const updateLineItem = (index, field, value) => setForm((current) => ({ ...current, lineItems: current.lineItems.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  const addLineItem = () => setForm((current) => ({ ...current, lineItems: [...current.lineItems, emptyLineItem()] }));
  const removeLineItem = (index) => setForm((current) => ({ ...current, lineItems: current.lineItems.filter((_item, itemIndex) => itemIndex !== index) }));

  const save = async (status) => {
    setError(''); setSuccess(''); setSaving(true);
    const payload = {
      status,
      docType: form.docType,
      extractedData: {
        vendor: form.vendor || null,
        invoiceNumber: form.invoiceNumber || null,
        date: form.date || null,
        dueDate: form.dueDate || null,
        currency: form.currency || null,
        subtotal: toNumberOrNull(form.subtotal),
        tax: toNumberOrNull(form.tax),
        total: toNumberOrNull(form.total),
        lineItems: form.lineItems.map((item) => ({ description: item.description || null, quantity: toNumberOrNull(item.quantity), unitPrice: toNumberOrNull(item.unitPrice), amount: toNumberOrNull(item.amount) })),
      },
    };
    try {
      const { data } = await documentApi.update(id, payload);
      setDocument(data.document);
      setForm(editableFromDocument(data.document));
      setSuccess(status === 'approved' ? 'Document approved successfully.' : 'Document changes saved.');
    } catch (requestError) { setError(getApiError(requestError, 'Could not save this document.')); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!window.confirm('Delete this document permanently?')) return;
    setError(''); setDeleting(true);
    try { await documentApi.remove(id); navigate('/documents', { replace: true }); }
    catch (requestError) { setError(getApiError(requestError, 'Could not delete this document.')); setDeleting(false); }
  };

  if (loading) return <LoadingState label="Loading document review…" />;
  if (!document || !form) return <div className="form-error"><Icon name="alert" size={16} />{error || 'Document not found.'}</div>;
  const data = getDocumentData(document);
  const issues = getDocumentIssues(document);
  const confidence = data.validation?.confidence || 0;

  return <div><div className="mb-7 flex flex-wrap items-center gap-3"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900" to="/documents"><Icon name="back" size={17} />Back to documents</Link><span className="text-slate-300">/</span><span className="max-w-[240px] truncate text-sm font-semibold text-slate-800">{document.originalName || 'Document review'}</span></div>
    <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-cyan-600">Review workspace</p><div className="flex flex-wrap items-center gap-3"><h1 className="max-w-2xl truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{data.vendor || document.originalName || 'Untitled document'}</h1><StatusBadge status={document.status} /></div><p className="mt-2 text-sm text-slate-500">{document.originalName} · {formatFileType(document.fileType)} · Uploaded {formatDate(document.createdAt)}</p></div><div className="flex flex-wrap gap-2"><button className="button-danger" disabled={deleting || saving} onClick={remove} type="button"><Icon name="trash" size={16} />{deleting ? 'Deleting…' : 'Delete'}</button><button className="button-secondary" disabled={saving || deleting} onClick={() => save('completed')} type="button"><Icon name="save" size={16} />Save changes</button><button className="button-primary" disabled={saving || deleting} onClick={() => save('approved')} type="button">{saving ? <span className="spinner h-4 w-4 border-white/30 border-t-white" /> : <Icon name="check" size={16} />}{saving ? 'Saving…' : 'Approve'}</button></div></div>
    {error && <div className="form-error mb-4"><Icon name="alert" size={16} />{error}</div>}{success && <div className="toast-success mb-4"><Icon name="check" size={16} />{success}</div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-slate-950">Extracted fields</h2><p className="mt-1 text-xs text-slate-400">Review and correct anything the AI missed.</p></div><ConfidenceBadge confidence={confidence} /></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="field-label" htmlFor="docType">Document type</label><select className="field-input" id="docType" name="docType" onChange={updateField} value={form.docType}><option value="invoice">Invoice</option><option value="receipt">Receipt</option><option value="purchase_order">Purchase order</option><option value="other">Other</option><option value="unknown">Unknown</option></select></div><div><label className="field-label" htmlFor="vendor">Vendor</label><input className="field-input" id="vendor" name="vendor" onChange={updateField} placeholder="Vendor name" value={form.vendor} /></div><div><label className="field-label" htmlFor="invoiceNumber">Invoice number</label><input className="field-input" id="invoiceNumber" name="invoiceNumber" onChange={updateField} placeholder="INV-0001" value={form.invoiceNumber} /></div><div><label className="field-label" htmlFor="currency">Currency</label><input className="field-input" id="currency" maxLength={10} name="currency" onChange={updateField} placeholder="USD" value={form.currency} /></div><div><label className="field-label" htmlFor="date">Invoice date</label><input className="field-input" id="date" name="date" onChange={updateField} type="date" value={form.date} /></div><div><label className="field-label" htmlFor="dueDate">Due date</label><input className="field-input" id="dueDate" name="dueDate" onChange={updateField} type="date" value={form.dueDate} /></div><div><label className="field-label" htmlFor="subtotal">Subtotal</label><input className="field-input" id="subtotal" min="0" name="subtotal" onChange={updateField} placeholder="0.00" step="0.01" type="number" value={form.subtotal} /></div><div><label className="field-label" htmlFor="tax">Tax</label><input className="field-input" id="tax" min="0" name="tax" onChange={updateField} placeholder="0.00" step="0.01" type="number" value={form.tax} /></div><div><label className="field-label" htmlFor="total">Total</label><input className="field-input font-bold" id="total" min="0" name="total" onChange={updateField} placeholder="0.00" step="0.01" type="number" value={form.total} /></div></div></section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div><h2 className="font-bold text-slate-950">Line items</h2><p className="mt-1 text-xs text-slate-400">Edit descriptions, quantities, and amounts.</p></div><button className="button-secondary self-start" onClick={addLineItem} type="button"><Icon name="plus" size={15} />Add line</button></div>{form.lineItems.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No line items extracted. Add one to complete the review.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400"><tr><th className="w-[38%] px-5 py-3">Description</th><th className="px-3 py-3">Quantity</th><th className="px-3 py-3">Unit price</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3"><span className="sr-only">Remove</span></th></tr></thead><tbody className="divide-y divide-slate-100">{form.lineItems.map((item, index) => <tr key={`line-${index}`}><td className="px-5 py-3"><input aria-label={`Line ${index + 1} description`} className="field-input" onChange={(event) => updateLineItem(index, 'description', event.target.value)} placeholder="Item description" value={item.description} /></td><td className="px-3 py-3"><input aria-label={`Line ${index + 1} quantity`} className="field-input" min="0" onChange={(event) => updateLineItem(index, 'quantity', event.target.value)} placeholder="0" step="any" type="number" value={item.quantity} /></td><td className="px-3 py-3"><input aria-label={`Line ${index + 1} unit price`} className="field-input" min="0" onChange={(event) => updateLineItem(index, 'unitPrice', event.target.value)} placeholder="0.00" step="0.01" type="number" value={item.unitPrice} /></td><td className="px-3 py-3"><input aria-label={`Line ${index + 1} amount`} className="field-input" min="0" onChange={(event) => updateLineItem(index, 'amount', event.target.value)} placeholder="0.00" step="0.01" type="number" value={item.amount} /></td><td className="px-3 py-3"><button aria-label={`Remove line ${index + 1}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeLineItem(index)} type="button"><Icon name="trash" size={16} /></button></td></tr>)}</tbody></table></div>}</section></div>
      <aside className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30"><div className="flex items-center justify-between"><h2 className="font-bold text-slate-950">Validation</h2><IssueBadge count={issues.length} /></div>{issues.length ? <ul className="mt-5 space-y-3">{issues.map((issue) => <li className="flex gap-2.5 text-sm leading-5 text-slate-600" key={issue}><Icon className="mt-0.5 shrink-0 text-amber-500" name="alert" size={16} />{issue}</li>)}</ul> : <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-700"><div className="mb-2 flex items-center gap-2 font-bold"><Icon name="check" size={16} />Everything looks good</div>This document has passed all available validation checks.</div>}</section><section className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-cyan-300"><Icon name="sparkles" size={15} />AI confidence</div><div className="mt-5 flex items-end gap-2"><span className="text-4xl font-bold">{Math.round(Number(confidence) * 100)}%</span><span className="mb-1 text-xs text-slate-500">extraction confidence</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${confidence >= .85 ? 'bg-emerald-400' : confidence >= .65 ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${Math.max(0, Math.min(100, Number(confidence) * 100))}%` }} /></div><p className="mt-4 text-xs leading-5 text-slate-400">Confidence reflects the AI extraction and any validation issues found.</p></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30"><h2 className="font-bold text-slate-950">Review snapshot</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-slate-500">Invoice total</span><span className="font-bold text-slate-800">{formatCurrency(data.total, data.currency)}</span></div><div className="flex justify-between gap-3"><span className="text-slate-500">Line items</span><span className="font-bold text-slate-800">{form.lineItems.length}</span></div><div className="flex justify-between gap-3"><span className="text-slate-500">Invoice date</span><span className="font-bold text-slate-800">{formatDate(data.date)}</span></div></div></section></aside>
    </div>
  </div>;
}
