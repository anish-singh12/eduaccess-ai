import express from 'express';
import {
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  uploadPdfAndExtract
} from '../controllers/documentController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { uploadSingleDocument } from '../middleware/upload.js';
import {
  createDocumentSchema,
  updateDocumentSchema
} from '../validators/documentValidator.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listDocuments);
router.get('/:id', getDocumentById);
router.post('/', validate(createDocumentSchema), createDocument);
router.put('/:id', validate(updateDocumentSchema), updateDocument);
router.delete('/:id', deleteDocument);

router.post('/upload-pdf', uploadLimiter, uploadSingleDocument, uploadPdfAndExtract);
router.post('/upload', uploadLimiter, uploadSingleDocument, uploadPdfAndExtract);

export default router;
