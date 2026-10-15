import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { cleanupTempFile } from '../middleware/upload.js';
import { logger } from '../utils/logger.js';

/**
 * Extracts plain text from an uploaded text-based PDF file.
 * Handles encrypted, empty, and malformed files safely and ensures temp file cleanup.
 */
export async function extractTextFromPdf(filePath) {
  try {
    const dataBuffer = await fs.readFile(filePath);

    // Parse PDF
    const data = await pdfParse(dataBuffer, {
      max: 30 // Process up to first 30 pages to prevent memory exhaustion
    });

    const rawText = data.text ? data.text.trim() : '';

    if (!rawText || rawText.length < 15) {
      throw new Error('NO_TEXT_EXTRACTED: The uploaded PDF contains no readable text. It may be a scanned image or empty. Please use a text-based PDF or paste text directly.');
    }

    // Clean up excessive whitespace while preserving paragraphs
    const cleanedText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    return {
      text: cleanedText,
      numPages: data.numpages || 1,
      charCount: cleanedText.length
    };
  } catch (err) {
    logger.warn(`PDF parsing issue for ${filePath}: ${err.message}`);
    if (err.message.includes('password') || err.message.includes('encrypted')) {
      throw new Error('ENCRYPTED_PDF: The uploaded PDF is password-protected or encrypted. Please upload an unprotected PDF.');
    }
    throw err;
  } finally {
    // ALWAYS clean up the temporary upload file
    await cleanupTempFile(filePath);
  }
}
