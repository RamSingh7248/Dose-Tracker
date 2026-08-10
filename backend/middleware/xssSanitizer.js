/**
 * xssSanitizer.js
 * ─────────────────────────────────────────────────────────────
 * Enterprise XSS Input Sanitization Middleware.
 * Recursively cleans text attributes across req.body, req.query,
 * and req.params to neutralize cross-site scripting attacks.
 */

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // Replace HTML tag brackets and dangerous script patterns
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
}

function recursiveSanitize(obj) {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => recursiveSanitize(item));
  }

  const cleaned = {};
  for (const key of Object.keys(obj)) {
    cleaned[key] = recursiveSanitize(obj[key]);
  }
  return cleaned;
}

const xssSanitizer = (req, res, next) => {
  if (req.body) {
    req.body = recursiveSanitize(req.body);
  }
  if (req.query) {
    req.query = recursiveSanitize(req.query);
  }
  if (req.params) {
    req.params = recursiveSanitize(req.params);
  }
  next();
};

module.exports = xssSanitizer;
