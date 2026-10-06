import { Router } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { basename, extname } from 'node:path';

import Document from '../models/Document.js';
import { protect } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { extractDocumentData } from '../services/aiService.js';
import {
  documentUpdateSchema,
  normalizeEditableData,
  normalizeExtraction,
} from '../schemas/documentSchemas.js';
import { validateDocumentData } from '../utils/documentValidation.js';

const router = Router();

const allowedFileTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();

    if (!allowedFileTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return callback(
        new AppError('Only PDF, JPG, JPEG, and PNG files are allowed', 400),
      );
    }

    return callback(null, true);
  },
});

const serializeDocument = (document) => {
  const value = document.toObject ? document.toObject() : document;

  return {
    ...value,
    id: value._id?.toString(),
    user: value.user?.toString(),
    _id: undefined,
    __v: undefined,
  };
};

const getOwnedDocument = async (req) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid document ID', 400);
  }

  const document = await Document.findOne({
    _id: req.params.id,
    user: req.user.userId,
  });

  if (!document) {
    throw new AppError('Document not found', 404);
  }

  return document;
};

router.post('/upload', protect, upload.single('file'), async (req, res, next) => {
  let document;

  try {
    if (!req.file) {
      throw new AppError('A PDF, JPG, JPEG, or PNG file is required', 400);
    }

    document = await Document.create({
      user: req.user.userId,
      originalName: basename(req.file.originalname),
      fileType: req.file.mimetype,
      status: 'processing',
    });

    const extraction = await extractDocumentData(req.file);
    const normalizedExtraction = normalizeExtraction(extraction);
    const validation = await validateDocumentData({
      data: normalizedExtraction.extractedData,
      userId: req.user.userId,
      documentId: document._id,
      aiConfidence: normalizedExtraction.aiConfidence,
    });

    document.docType = normalizedExtraction.docType;
    document.status = 'completed';
    document.extractedData = {
      ...normalizedExtraction.extractedData,
      validation,
    };
    await document.save();

    return res.status(201).json({
      message: 'Document uploaded and extracted successfully',
      document: serializeDocument(document),
    });
  } catch (error) {
    if (document) {
      try {
        document.status = 'failed';
        document.extractedData.validation = {
          issues: ['Document extraction failed'],
          confidence: 0,
        };
        await document.save();
      } catch {
        // Preserve the original extraction error without exposing provider details.
      }
    }

    return next(error);
  }
});

router.get('/', protect, async (req, res, next) => {
  try {
    const documents = await Document.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      documents: documents.map(serializeDocument),
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const document = await getOwnedDocument(req);
    return res.status(200).json({ document: serializeDocument(document) });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const input = documentUpdateSchema.parse(req.body);
    const document = await getOwnedDocument(req);

    if (input.docType !== undefined) {
      document.docType = input.docType;
    }

    if (input.extractedData) {
      const currentData = document.extractedData.toObject();
      const normalizedEdit = normalizeEditableData(input.extractedData);
      const mergedData = { ...currentData };

      for (const [field, value] of Object.entries(normalizedEdit)) {
        if (value !== undefined) {
          mergedData[field] = value;
        }
      }

      const validation = await validateDocumentData({
        data: mergedData,
        userId: req.user.userId,
        documentId: document._id,
        aiConfidence: currentData.validation?.confidence,
      });

      document.extractedData = {
        ...mergedData,
        validation,
      };

      if (input.status === undefined) {
        document.status = 'completed';
      }
    }

    if (input.status !== undefined) {
      document.status = input.status;
    }

    await document.save();

    return res.status(200).json({
      message: document.status === 'approved' ? 'Document approved' : 'Document updated',
      document: serializeDocument(document),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const document = await getOwnedDocument(req);
    await document.deleteOne();

    return res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    return next(error);
  }
});

export default router;
