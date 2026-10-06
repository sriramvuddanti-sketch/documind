import Document from '../models/Document.js';

const REQUIRED_FIELDS = [
  ['vendor', 'Vendor'],
  ['invoiceNumber', 'Invoice number'],
  ['date', 'Invoice date'],
  ['total', 'Total'],
  ['currency', 'Currency'],
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isMissing = (value) => value === null || value === undefined || value === '';

const parseDateOnly = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const calculateFallbackConfidence = (data, issueCount) => {
  const populatedFields = REQUIRED_FIELDS.filter(([field]) => !isMissing(data[field])).length;
  const completeness = populatedFields / REQUIRED_FIELDS.length;
  return Math.max(0, Math.min(1, completeness - issueCount * 0.05));
};

export const validateDocumentData = async ({
  data,
  userId,
  documentId,
  aiConfidence,
}) => {
  const issues = [];

  for (const [field, label] of REQUIRED_FIELDS) {
    if (isMissing(data[field])) {
      issues.push(`${label} is missing`);
    }
  }

  if (!data.lineItems?.length) {
    issues.push('No line items were extracted');
  }

  data.lineItems?.forEach((lineItem, index) => {
    const lineNumber = index + 1;

    if (isMissing(lineItem.description)) {
      issues.push(`Line item ${lineNumber} description is missing`);
    }

    if (isMissing(lineItem.quantity)) {
      issues.push(`Line item ${lineNumber} quantity is missing`);
    }

    if (isMissing(lineItem.unitPrice)) {
      issues.push(`Line item ${lineNumber} unit price is missing`);
    }

    if (isMissing(lineItem.amount)) {
      issues.push(`Line item ${lineNumber} amount is missing`);
    }
  });

  const lineItemsTotal = data.lineItems?.every(
    (lineItem) => typeof lineItem.amount === 'number' && Number.isFinite(lineItem.amount),
  )
    ? data.lineItems.reduce((sum, lineItem) => sum + lineItem.amount, 0)
    : null;

  if (lineItemsTotal !== null && typeof data.total === 'number') {
    if (Math.abs(lineItemsTotal - data.total) > 0.01) {
      issues.push(
        `Line items sum (${lineItemsTotal.toFixed(2)}) does not match total (${data.total.toFixed(2)})`,
      );
    }
  }

  if (data.invoiceNumber) {
    const duplicateQuery = {
      user: userId,
      'extractedData.invoiceNumber': {
        $regex: `^${escapeRegex(data.invoiceNumber.trim())}$`,
        $options: 'i',
      },
    };

    if (documentId) {
      duplicateQuery._id = { $ne: documentId };
    }

    const duplicate = await Document.exists(duplicateQuery);

    if (duplicate) {
      issues.push(`Invoice number ${data.invoiceNumber} is already used by another document`);
    }
  }

  const dueDate = parseDateOnly(data.dueDate);
  const today = new Date();
  const todayDateOnly = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  if (dueDate && dueDate < todayDateOnly) {
    issues.push(`Invoice due date ${data.dueDate} is overdue`);
  }

  const confidence =
    typeof aiConfidence === 'number'
      ? Math.max(0, Math.min(1, aiConfidence - issues.length * 0.05))
      : calculateFallbackConfidence(data, issues.length);

  return { issues, confidence };
};
