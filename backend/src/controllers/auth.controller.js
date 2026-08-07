const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { nanoid } = require('nanoid');

const db = require('../config/db');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');


// ============================================================
// REGISTER
// POST /api/auth/register
// ============================================================

async function register(req, res) {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({
      error: 'fullName, email, password and phone are required.',
    });
  }

  // Algerian mobile number validation
  if (!/^0[567]\d{8}$/.test(phone)) {
    return res.status(400).json({
      error:
        'رقم الهاتف يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكوّن من 10 أرقام.',
    });
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Check if email already exists
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existing.rows.length) {
      await client.query('ROLLBACK');

      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    /*
     * ========================================================
     * TEMPORARY DEVELOPMENT MODE
     * ========================================================
     *
     * Email verification is temporarily disabled.
     * The account will be created as verified.
     *
     * When Rawaj is ready for production, we will restore
     * Resend email verification.
     */

    const emailVerifyToken = null;

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (
        full_name,
        email,
        password_hash,
        role,
        phone,
        email_verify_token,
        is_email_verified
      )
      VALUES ($1, $2, $3, 'affiliate', $4, $5, TRUE)
      RETURNING
        id,
        full_name,
        email,
        role,
        is_email_verified,
        created_at`,
      [
        fullName,
        email.toLowerCase(),
        passwordHash,
        phone,
        emailVerifyToken,
      ]
    );

    const user = userResult.rows[0];

    // Create affiliate profile
    const referralCode = 'AFF-' + nanoid(8).toUpperCase();

    await client.query(
      `INSERT INTO affiliate_profiles (
        user_id,
        referral_code
      )
      VALUES ($1, $2)`,
      [user.id, referralCode]
    );

    await client.query('COMMIT');

    /*
     * No email is sent here during development.
     */

    // Create tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      user,
      accessToken,
      refreshToken,
    });

  } catch (err) {
    await client.query('ROLLBACK');

    console.error('Registration error:', err);

    return res.status(500).json({
      error: 'Registration failed.',
    });

  } finally {
    client.release();
  }
}


// ============================================================
// LOGIN
// POST /api/auth/login
// ============================================================

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.',
    });
  }

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({
        error: 'Invalid credentials.',
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials.',
      });
    }

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_email_verified: user.is_email_verified,
      avatar_url: user.avatar_url,
    };

    const accessToken = signAccessToken(safeUser);
    const refreshToken = signRefreshToken(safeUser);

    return res.json({
      user: safeUser,
      accessToken,
      refreshToken,
    });

  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      error: 'Login failed.',
    });
  }
}


// ============================================================
// VERIFY EMAIL
// GET /api/auth/verify-email?token=...
// ============================================================

async function verifyEmail(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      error: 'Token is required.',
    });
  }

  try {
    const result = await db.query(
      `UPDATE users
       SET
         is_email_verified = TRUE,
         email_verify_token = NULL
       WHERE email_verify_token = $1
       RETURNING id, email`,
      [token]
    );

    if (!result.rows.length) {
      return res.status(400).json({
        error: 'Invalid or expired verification token.',
      });
    }

    return res.json({
      message: 'Email verified successfully.',
    });

  } catch (err) {
    console.error('Email verification error:', err);

    return res.status(500).json({
      error: 'Verification failed.',
    });
  }
}


// ============================================================
// REFRESH TOKEN
// POST /api/auth/refresh
// ============================================================

async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: 'refreshToken is required.',
    });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    const result = await db.query(
      `SELECT
        id,
        full_name,
        email,
        role,
        avatar_url,
        is_email_verified
       FROM users
       WHERE id = $1`,
      [payload.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: 'User not found.',
      });
    }

    const accessToken = signAccessToken(user);

    return res.json({
      accessToken,
    });

  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired refresh token.',
    });
  }
}


// ============================================================
// GET CURRENT USER
// GET /api/auth/me
// ============================================================

async function me(req, res) {
  try {
    const result = await db.query(
      `SELECT
        id,
        full_name,
        email,
        role,
        avatar_url,
        language,
        is_email_verified,
        created_at
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'User not found.',
      });
    }

    return res.json({
      user: result.rows[0],
    });

  } catch (err) {
    console.error('Profile error:', err);

    return res.status(500).json({
      error: 'Failed to fetch profile.',
    });
  }
}


// ============================================================
// RESEND VERIFICATION
// POST /api/auth/resend-verification
// ============================================================

async function resendVerification(req, res) {
  /*
   * Email verification is temporarily disabled during development.
   */

  try {
    const result = await db.query(
      `SELECT
        id,
        full_name,
        email,
        is_email_verified
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: 'User not found.',
      });
    }

    /*
     * Since accounts are automatically verified during development,
     * there is no email to resend.
     */

    if (user.is_email_verified) {
      return res.json({
        message: 'Your email is already verified.',
      });
    }

    return res.json({
      message: 'Email verification is temporarily disabled during development.',
    });

  } catch (err) {
    console.error('Resend verification error:', err);

    return res.status(500).json({
      error: 'Failed to resend verification email.',
    });
  }
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  register,
  login,
  verifyEmail,
  refresh,
  me,
  resendVerification,
};
