import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { cleanupTempFile } from '../middleware/upload.js';
import { logger } from '../utils/logger.js';

/**
 * Extracts plain text from an uploaded PDF file using modern pdfjs-dist.
 * Recovers safely from imperfect cross-reference tables (stopAtErrors: false)
 * and detects scanned / empty / encrypted documents.
 */
async function extractTextFromPdfBuffer(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const uint8Data = new Uint8Array(dataBuffer);

  let doc;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      stopAtErrors: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    doc = await loadingTask.promise;
  } catch (err) {
    if (err.name === 'PasswordException' || err.message?.toLowerCase().includes('password') || err.message?.toLowerCase().includes('encrypt')) {
      const encErr = new Error('The uploaded PDF is password-protected or encrypted. Please upload an unprotected PDF.');
      encErr.code = 'ENCRYPTED_PDF';
      throw encErr;
    }
    const parseErr = new Error(`PDF parsing failed: ${err.message || 'Corrupted or unreadable PDF structure.'}`);
    parseErr.code = 'PDF_PARSE_ERROR';
    throw parseErr;
  }

  const numPages = doc.numPages || 1;
  const maxPages = Math.min(numPages, 50); // Process up to 50 pages for safety
  const textChunks = [];

  for (let i = 1; i <= maxPages; i++) {
    try {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .filter(Boolean);

      if (pageStrings.length > 0) {
        textChunks.push(pageStrings.join(' '));
      }
    } catch (pageErr) {
      logger.warn(`Could not extract page ${i}: ${pageErr.message}`);
    }
  }

  const combinedText = textChunks.join('\n\n').trim();

  // Clean up whitespace while preserving paragraphs
  const cleanedText = combinedText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (!cleanedText || cleanedText.length < 20) {
    const scanErr = new Error('This PDF appears to be a scanned image or contains no extractable text. Please upload a text-based PDF or document that has undergone OCR.');
    scanErr.code = 'SCANNED_OR_EMPTY_PDF';
    throw scanErr;
  }

  return {
    text: cleanedText,
    numPages,
    charCount: cleanedText.length
  };
}

/**
 * Extracts plain text from an uploaded DOCX file using mammoth.
 * Preserves paragraphs and heading separations.
 */
async function extractTextFromDocxBuffer(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const rawText = result.value ? result.value.trim() : '';

    if (!rawText || rawText.length < 20) {
      const emptyErr = new Error('The uploaded Word document contains no readable text.');
      emptyErr.code = 'EMPTY_DOCX';
      throw emptyErr;
    }

    const cleanedText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return {
      text: cleanedText,
      numPages: Math.max(1, Math.ceil(cleanedText.length / 2500)),
      charCount: cleanedText.length
    };
  } catch (err) {
    if (err.code === 'EMPTY_DOCX') throw err;
    const docxErr = new Error(`Word document parsing failed: ${err.message || 'Corrupted or unreadable DOCX structure.'}`);
    docxErr.code = 'DOCX_PARSE_ERROR';
    throw docxErr;
  }
}

/**
 * Derives a clean suggested topic name from filename or first sentence of text.
 */
function deriveTopic(originalFilename, extractedText) {
  if (originalFilename) {
    const base = path.basename(originalFilename).replace(/\.[^/.]+$/, '');
    const clean = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length > 2 && clean.length <= 80 && !/^(upload|document|file|notes|scan)\b/i.test(clean)) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }

  if (extractedText) {
    const firstLine = extractedText.split('\n')[0].trim().slice(0, 60);
    if (firstLine.length > 3 && !firstLine.includes('http')) {
      return firstLine.replace(/[#*_-]/g, '').trim();
    }
  }

  return 'General Subject';
}

/**
 * Unified document parser supporting both PDF and DOCX documents.
 * Guarantees temp file cleanup in all situations.
 */
export async function parseUploadedDocument(file) {
  if (!file || !file.path) {
    throw new Error('NO_FILE_PROVIDED: No file was provided for extraction.');
  }

  const filePath = file.path;
  const originalFilename = file.originalname || '';
  const ext = path.extname(originalFilename).toLowerCase();
  const mime = file.mimetype || '';

  try {
    if (ext === '.doc' || mime === 'application/msword') {
      const err = new Error('Legacy .doc format is not supported. Please save or export your document as .docx or .pdf.');
      err.code = 'LEGACY_DOC_UNSUPPORTED';
      throw err;
    }

    let parsedResult;
    let detectedType = 'pdf';

    if (ext === '.docx' || mime.includes('wordprocessingml')) {
      detectedType = 'docx';
      parsedResult = await extractTextFromDocxBuffer(filePath);
    } else if (ext === '.pdf' || mime === 'application/pdf') {
      detectedType = 'pdf';
      parsedResult = await extractTextFromPdfBuffer(filePath);
    } else {
      const unsupportedErr = new Error(`Unsupported file type (${ext || mime}). Please upload a .pdf or .docx document.`);
      unsupportedErr.code = 'UNSUPPORTED_FILE_TYPE';
      throw unsupportedErr;
    }

    const topic = deriveTopic(originalFilename, parsedResult.text);

    return {
      text: parsedResult.text,
      extractedText: parsedResult.text,
      numPages: parsedResult.numPages,
      charCount: parsedResult.charCount,
      fileType: detectedType,
      originalFilename,
      topic
    };
  } finally {
    // ALWAYS clean up temporary file
    await cleanupTempFile(filePath);
  }
}

// Keep backward compatibility export for existing callers
export async function extractTextFromPdf(filePath) {
  return parseUploadedDocument({ path: filePath, originalname: 'document.pdf', mimetype: 'application/pdf' });
}
