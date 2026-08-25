const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Only these keys are safe to expose without admin auth — used by the homepage
// and the public informational/legal pages linked from the footer.
const PUBLIC_KEYS = [
  'homepage_hero',
  'about_content',
  'blog_content',
  'contact_content',
  'faq_content',
  'privacy_policy_content',
  'terms_of_service_content',
];

/** GET /api/settings/:key  (public read of a safe-listed setting) */
router.get('/:key', async (req, res) => {
  if (!PUBLIC_KEYS.includes(req.params.key)) {
    return res.status(404).json({ error: 'Not found.' });
  }
  try {
    const result = await db.query('SELECT value FROM site_settings WHERE key = $1', [req.params.key]);
    return res.json({ value: result.rows[0]?.value || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch setting.' });
  }
});

module.exports = router;
