const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { nanoid } = require('nanoid');
const db = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendEmail } = require('../utils/email');
// مؤقتًا أثناء التطوير: نعتبر البريد متحققًا منه
// عند إطلاق الموقع سنعيد تفعيل التحقق عبر Resend.
const emailVerifyToken = null;
/**
 * POST /api/auth/register
 * Public registration is affiliate-only in this single-vendor model — the
 * admin account is created via the seed script, not through this endpoint.
 * body: { fullName, email, password, phone? }
 */
async function register(req, res) {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({ error: 'fullName, email, password and phone are required.' });
  }

  // Algerian mobile numbers: start with 05, 06, or 07, followed by 8 more digits (10 digits total).
  if (!/^0[567]\d{8}$/.test(phone)) {
    return res.status(400).json({ error: 'رقم الهاتف يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكوّن من 10 أرقام.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone, email_verify_token)
       VALUES ($1, $2, $3, 'affiliate', $4, $5)
       RETURNING id, full_name, email, role, is_email_verified, created_at`,
      [fullName, email.toLowerCase(), passwordHash, phone || null, emailVerifyToken]
    );
    const user = userResult.rows[0];

    const referralCode = 'AFF-' + nanoid(8).toUpperCase();
    await client.query(
      `INSERT INTO affiliate_profiles (user_id, referral_code) VALUES ($1, $2)`,
      [user.id, referralCode]
    );

    await client.query('COMMIT');

    // Fire-and-forget verification email
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${emailVerifyToken}`;
    sendEmail({
      to: user.email,
      subject: 'Verify your Rawaj account',
      html: `<p>Hi ${fullName},</p><p>Please verify your email by clicking the link below:</p><a href="${verifyUrl}">${verifyUrl}</a>`,
    }).catch((e) => console.error('Email send failed:', e.message));

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(201).json({
      message: 'Account created. Please check your email to verify your account.',
      user,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Registration failed.' });
  } finally {
    client.release();
  }
}

/**
 * POST /api/auth/login
 * body: { email, password }
 */
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
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

    return res.json({ user: safeUser, accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed.' });
  }
}

/**
 * GET /api/auth/verify-email?token=...
 */
async function verifyEmail(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token is required.' });

  try {
    const result = await db.query(
      `UPDATE users SET is_email_verified = TRUE, email_verify_token = NULL
       WHERE email_verify_token = $1 RETURNING id, email`,
      [token]
    );
    if (!result.rows.length) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }
    return res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Verification failed.' });
  }
}

/**
 * POST /api/auth/refresh
 * body: { refreshToken }
 */
async function refresh(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required.' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const result = await db.query('SELECT id, full_name, email, role, avatar_url, is_email_verified FROM users WHERE id = $1', [payload.id]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const accessToken = signAccessToken(user);
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
}

/** GET /api/auth/me */
async function me(req, res) {
  try {
    const result = await db.query(
      `SELECT id, full_name, email, role, avatar_url, language, is_email_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
}

/** POST /api/auth/resend-verification  (authenticated — regenerates and resends the verification email) */
async function resendVerification(req, res) {
  try {
    const result = await db.query(
      'SELECT id, full_name, email, is_email_verified FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      message: 'Email verification is disabled during development.'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: 'Failed to resend verification email.'
    });
  }
}
module.exports = { register, login, verifyEmail, refresh, me, resendVerification };
