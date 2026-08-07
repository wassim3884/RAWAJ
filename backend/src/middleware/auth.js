const { verifyAccessToken } = require('../utils/jwt');
const db = require('../config/db');

/**
 * Requires a valid JWT in the Authorization header:
 * Bearer <token>
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required.'
    });
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token.'
    });
  }
}

/**
 * Optional authentication.
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : null;

  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch (err) {
      // Ignore invalid token
    }
  }

  next();
}

/**
 * Requires the user's email to be verified.
 *
 * IMPORTANT:
 * We check the database directly instead of relying on
 * is_email_verified stored inside the JWT.
 */
async function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required.'
    });
  }

  try {
    const result = await db.query(
      `SELECT is_email_verified
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        error: 'User not found.'
      });
    }

    const isVerified = result.rows[0].is_email_verified;

    if (!isVerified) {
      return res.status(403).json({
        error: 'Please verify your email address to continue.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Keep the current request user in sync with the database.
    req.user.is_email_verified = true;

    return next();
  } catch (err) {
    console.error('Email verification check failed:', err);

    return res.status(500).json({
      error: 'Failed to verify account status.'
    });
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireVerified
};
