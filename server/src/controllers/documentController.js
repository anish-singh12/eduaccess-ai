import { Document } from '../models/Document.js';
import { parseUploadedDocument } from '../services/documentParserService.js';
import { isValidObjectId } from '../utils/sanitize.js';
import { isDatabaseConnected } from '../config/db.js';

/**
 * List all documents owned by the authenticated student
 */
export async function listDocuments(req, res, next) {
  try {
    const userId = req.user._id;
    const { search, sort = 'updatedAt', order = 'desc' } = req.query;

    if (!isDatabaseConnected()) {
      return res.status(200).json({
        success: true,
        data: { documents: [], total: 0 }
      });
    }

    const query = { userId };
    if (search && typeof search === 'string' && search.trim().length > 0) {
      // Safe regex search with escaped special characters
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: escaped, $options: 'i' };
    }

    const sortOption = {};
    const sortField = ['createdAt', 'updatedAt', 'title'].includes(sort) ? sort : 'updatedAt';
    sortOption[sortField] = order === 'asc' ? 1 : -1;

    const documents = await Document.find(query)
      .select('title simplifiedText sourceText keyPoints definitions createdAt updatedAt')
      .sort(sortOption)
      .lean();

    res.status(200).json({
      success: true,
      documents,
      data: {
        documents,
        total: documents.length
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get a single document by ID (Strict ownership verified)
 */
export async function getDocumentById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid document ID format' }
      });
    }

    const document = await Document.findOne({ _id: id, userId }).lean();
    if (!document) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' }
      });
    }

    res.status(200).json({
      success: true,
      document,
      data: { document }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new document
 */
export async function createDocument(req, res, next) {
  try {
    const userId = req.user._id;
    const { title, sourceText, simplifiedText, keyPoints, definitions } = req.body;

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is not connected.' }
      });
    }

    const doc = await Document.create({
      userId,
      title,
      sourceText,
      simplifiedText: simplifiedText || '',
      keyPoints: Array.isArray(keyPoints) ? keyPoints : [],
      definitions: Array.isArray(definitions) ? definitions : []
    });

    res.status(201).json({
      success: true,
      message: 'Document saved successfully',
      document: doc,
      data: { document: doc }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing document (Strict ownership check & allowlist)
 */
export async function updateDocument(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid document ID' }
      });
    }

    const allowlist = ['title', 'sourceText', 'simplifiedText', 'keyPoints', 'definitions'];
    const updatePayload = {};
    for (const key of allowlist) {
      if (req.body[key] !== undefined) {
        updatePayload[key] = req.body[key];
      }
    }

    const updatedDoc = await Document.findOneAndUpdate(
      { _id: id, userId },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      document: updatedDoc,
      data: { document: updatedDoc }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a document (Strict ownership check)
 */
export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid document ID' }
      });
    }

    const deleted = await Document.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Upload document (PDF or DOCX) and extract text
 */
export async function uploadPdfAndExtract(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE_UPLOADED', message: 'Please select a valid PDF (.pdf) or Word (.docx) document to upload.' }
      });
    }

    const result = await parseUploadedDocument(req.file);

    res.status(200).json({
      success: true,
      message: `Extracted ${result.charCount} characters across ${result.numPages} page(s).`,
      extractedText: result.text,
      text: result.text,
      topic: result.topic,
      data: {
        text: result.text,
        extractedText: result.text,
        numPages: result.numPages,
        charCount: result.charCount,
        fileType: result.fileType,
        originalFilename: result.originalFilename,
        topic: result.topic
      }
    });
  } catch (err) {
    if (err.code) {
      return res.status(400).json({
        success: false,
        error: { code: err.code, message: err.message }
      });
    }
    next(err);
  }
}
