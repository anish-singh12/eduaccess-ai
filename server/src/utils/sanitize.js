import mongoose from 'mongoose';

/**
 * Validates whether a given string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

/**
 * Deep sanitization of objects to prevent NoSQL query operator injection ($where, $gt, etc.)
 */
export function sanitizeQueryInput(input) {
  if (input === null || typeof input !== 'object') {
    return typeof input === 'string' ? input.trim() : input;
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeQueryInput);
  }

  const clean = {};
  for (const [key, value] of Object.entries(input)) {
    // Strip keys starting with $ or containing dots to prevent MongoDB operator injection
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    const sanitizedVal = sanitizeQueryInput(value);
    // If an object had keys but all were stripped (e.g. { $gt: '' }), omit it
    if (
      sanitizedVal &&
      typeof sanitizedVal === 'object' &&
      !Array.isArray(sanitizedVal) &&
      Object.keys(sanitizedVal).length === 0 &&
      Object.keys(value).length > 0
    ) {
      continue;
    }
    clean[key] = sanitizedVal;
  }
  return clean;
}

/**
 * Basic text sanitization for plain text inputs (removes null bytes, excessive control characters)
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\0/g, '') // remove null bytes
    .trim();
}
