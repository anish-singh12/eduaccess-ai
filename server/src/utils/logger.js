/**
 * Safe logger that prevents accidental logging of passwords, tokens, or sensitive API keys
 */

const SENSITIVE_KEYS = ['password', 'passwordHash', 'token', 'jwt', 'secret', 'apiKey', 'authorization'];

function redactSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = redactSensitiveData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info: (message, meta) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.log(`[INFO] [${timestamp}] ${message}`, redactSensitiveData(meta));
    } else {
      console.log(`[INFO] [${timestamp}] ${message}`);
    }
  },
  warn: (message, meta) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.warn(`[WARN] [${timestamp}] ${message}`, redactSensitiveData(meta));
    } else {
      console.warn(`[WARN] [${timestamp}] ${message}`);
    }
  },
  error: (message, meta) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.error(`[ERROR] [${timestamp}] ${message}`, redactSensitiveData(meta));
    } else {
      console.error(`[ERROR] [${timestamp}] ${message}`);
    }
  }
};
