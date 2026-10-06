import { z } from 'zod';

const nullableText = z.string().trim().max(500).nullable().optional().default(null);
const nullableNumber = z.number().finite().nullable().optional().default(null);

const lineItemSchema = z
  .object({
    description: nullableText,
    quantity: nullableNumber,
    unitPrice: nullableNumber,
    amount: nullableNumber,
  })
  .strict();

export const aiExtractionSchema = z
  .object({
    docType: z.string().trim().min(1).max(50).optional().default('unknown'),
    vendor: nullableText,
    invoiceNumber: nullableText,
    date: nullableText,
    dueDate: nullableText,
    lineItems: z.array(lineItemSchema).max(100).optional().default([]),
    subtotal: nullableNumber,
    tax: nullableNumber,
    total: nullableNumber,
    currency: z.string().trim().max(10).nullable().optional().default(null),
    confidence: z.number().finite().min(0).max(1).nullable().optional().default(null),
  })
  .strict();

const editableExtractedDataSchema = z
  .object({
    vendor: z.string().trim().max(500).nullable().optional(),
    invoiceNumber: z.string().trim().max(200).nullable().optional(),
    date: z.string().trim().max(100).nullable().optional(),
    dueDate: z.string().trim().max(100).nullable().optional(),
    lineItems: z.array(lineItemSchema).max(100).optional(),
    subtotal: z.number().finite().nullable().optional(),
    tax: z.number().finite().nullable().optional(),
    total: z.number().finite().nullable().optional(),
    currency: z.string().trim().max(10).nullable().optional(),
  })
  .strict();

export const documentUpdateSchema = z
  .object({
    status: z.enum(['completed', 'approved']).optional(),
    docType: z.string().trim().min(1).max(50).optional(),
    extractedData: editableExtractedDataSchema.optional(),
  })
  .strict();

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value.trim();
  }

  return parsedDate.toISOString().slice(0, 10);
};

export const normalizeExtraction = (extraction) => ({
  docType: extraction.docType?.trim() || 'unknown',
  extractedData: {
    vendor: extraction.vendor?.trim() || null,
    invoiceNumber: extraction.invoiceNumber?.trim() || null,
    date: normalizeDate(extraction.date),
    dueDate: normalizeDate(extraction.dueDate),
    lineItems: extraction.lineItems.map((lineItem) => ({
      description: lineItem.description?.trim() || null,
      quantity: lineItem.quantity,
      unitPrice: lineItem.unitPrice,
      amount: lineItem.amount,
    })),
    subtotal: extraction.subtotal,
    tax: extraction.tax,
    total: extraction.total,
    currency: extraction.currency?.trim().toUpperCase() || null,
  },
  aiConfidence: extraction.confidence,
});

export const normalizeEditableData = (data) => ({
  ...data,
  vendor: data.vendor === undefined ? undefined : data.vendor?.trim() || null,
  invoiceNumber:
    data.invoiceNumber === undefined ? undefined : data.invoiceNumber?.trim() || null,
  date: data.date === undefined ? undefined : normalizeDate(data.date),
  dueDate: data.dueDate === undefined ? undefined : normalizeDate(data.dueDate),
  currency:
    data.currency === undefined ? undefined : data.currency?.trim().toUpperCase() || null,
  lineItems:
    data.lineItems?.map((lineItem) => ({
      description: lineItem.description?.trim() || null,
      quantity: lineItem.quantity,
      unitPrice: lineItem.unitPrice,
      amount: lineItem.amount,
    })),
});
