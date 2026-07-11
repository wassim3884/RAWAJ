const { verifyAccessToken } = require('../utils/jwt');

/**
 * Requires a valid JWT in the Authorization header: `Bearer <token>`
 * Attaches { id, role, email } to req.user
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Optional auth — attaches req.user if a valid token is present,
 * but does not block the request otherwise. Useful for public
 * product pages that behave slightly differently for logged-in users.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch (err) {
      /* ignore invalid token for optional auth */
    }
  }
  next();
}

/**
 * Requires the authenticated user's email to be verified.
 * Must run after requireAuth. Used to gate product browsing and
 * order submission behind a confirmed registration.
 */
function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!req.user.is_email_verified) {
    return res.status(403).json({ error: 'Please verify your email address to continue.', code: 'EMAIL_NOT_VERIFIED' });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requireVerified };
