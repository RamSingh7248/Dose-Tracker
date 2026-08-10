/**
 * csrfMiddleware.js
 * ─────────────────────────────────────────────────────────────
 * Double-Submit Cookie CSRF Protection Middleware.
 * Generates an encrypted XSRF-TOKEN cookie and validates matching
 * 'X-XSRF-TOKEN' or 'x-csrf-token' header on state-changing requests.
 */

const crypto = require('crypto');

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

const attachCsrfToken = (req, res, next) => {
  let token = req.cookies?.['XSRF-TOKEN'];
  if (!token) {
    token = generateCsrfToken();
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be readable by frontend Axios/Fetch to send in header
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }
  req.csrfToken = token;
  next();
};

const verifyCsrfToken = (req, res, next) => {
  // Safe HTTP methods bypass CSRF verification
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // If request is authenticated via Authorization Bearer header (non-browser API client), bypass CSRF check
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // Check if request carries cookie-based auth
  const cookieToken = req.cookies?.['accessToken'] || req.cookies?.['refreshToken'];
  if (!cookieToken) {
    // Non-cookie requests don't require CSRF checks
    return next();
  }

  const expectedToken = req.cookies?.['XSRF-TOKEN'];
  const providedToken =
    req.headers['x-xsrf-token'] ||
    req.headers['x-csrf-token'] ||
    req.body?._csrf;

  if (!expectedToken || !providedToken || expectedToken !== providedToken) {
    const { logAuditAction } = require('./securityMiddleware');
    logAuditAction({ req, action: 'CSRF_VALIDATION_FAILED', status: 'DENIED', details: { method: req.method, url: req.originalUrl } });
    return res.status(403).json({
      success: false,
      message: 'CSRF protection security alert: Invalid or missing CSRF token',
    });
  }

  next();
};

module.exports = { attachCsrfToken, verifyCsrfToken, generateCsrfToken };
