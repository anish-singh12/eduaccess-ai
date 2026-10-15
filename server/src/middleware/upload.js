import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/temp');

// Ensure temp directory exists
try {
  await fs.mkdir(TEMP_UPLOAD_DIR, { recursive: true });
} catch {
  // directory exists or created
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.pdf', '.docx', '.doc'].includes(ext) ? ext : '.tmp';
    const randomHex = crypto.randomBytes(16).toString('hex');
    cb(null, `upload_${Date.now()}_${randomHex}${safeExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (ext === '.doc' || mime === 'application/msword') {
    return cb(new Error('LEGACY_DOC_UNSUPPORTED: Legacy .doc format is not supported. Please save or export your document as .docx or .pdf.'), false);
  }

  const isPdf = ext === '.pdf' || mime === 'application/pdf';
  const isDocx = ext === '.docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/x-zip-compressed';

  if (isPdf || isDocx) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE: Only text-based PDF (.pdf) and Word (.docx) documents are supported.'), false);
  }
};

export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: Math.max(env.MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024), // At least 10MB
    files: 1
  },
  fileFilter
});

export const uploadSingleDocument = uploadDocument.single('file');
export const uploadPdf = uploadDocument;
export const uploadSinglePdf = uploadSingleDocument;

/**
 * Safely removes a temporary file from disk
 */
export async function cleanupTempFile(filePath) {
  if (!filePath) return;
  try {
    const resolved = path.resolve(filePath);
    if (resolved.startsWith(TEMP_UPLOAD_DIR)) {
      await fs.unlink(resolved);
    }
  } catch {
    // Ignore error if file was already removed
  }
}
