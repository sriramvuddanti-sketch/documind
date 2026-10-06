export const formatCurrency = (value, currency = 'USD') => {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  } catch {
    return `${currency || 'USD'} ${amount.toFixed(2)}`;
  }
};

export const formatDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
};

export const formatFileType = (fileType = '') => fileType.includes('/') ? fileType.split('/')[1].toUpperCase() : fileType.toUpperCase();

export const getDocumentIssues = (document) => document?.extractedData?.validation?.issues || [];

export const getDocumentData = (document) => document?.extractedData || {};
