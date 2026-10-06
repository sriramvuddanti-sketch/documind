import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: null, trim: true },
    quantity: { type: Number, default: null },
    unitPrice: { type: Number, default: null },
    amount: { type: Number, default: null },
  },
  { _id: false },
);

const validationSchema = new mongoose.Schema(
  {
    issues: { type: [String], default: [] },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
  },
  { _id: false },
);

const extractedDataSchema = new mongoose.Schema(
  {
    vendor: { type: String, default: null, trim: true },
    invoiceNumber: { type: String, default: null, trim: true },
    date: { type: String, default: null, trim: true },
    dueDate: { type: String, default: null, trim: true },
    lineItems: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: null },
    tax: { type: Number, default: null },
    total: { type: Number, default: null },
    currency: { type: String, default: null, trim: true, uppercase: true },
    validation: { type: validationSchema, default: () => ({}) },
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed', 'approved'],
      default: 'processing',
    },
    docType: {
      type: String,
      default: 'unknown',
      trim: true,
      maxlength: 50,
    },
    extractedData: {
      type: extractedDataSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

documentSchema.index({ user: 1, 'extractedData.invoiceNumber': 1 });

const Document =
  mongoose.models.Document || mongoose.model('Document', documentSchema);

export default Document;
