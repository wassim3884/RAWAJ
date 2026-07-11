const db = require('../config/db');

/** GET /api/push/vapid-public-key  (frontend needs this to subscribe) */
async function getPublicKey(req, res) {
  return res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}

/** POST /api/push/subscribe  body: { endpoint, keys: { p256dh, auth } } */
async function subscribe(req, res) {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys) return res.status(400).json({ error: 'endpoint and keys are required.' });
  try {
    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, keys) VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, keys = $3`,
      [req.user.id, endpoint, keys]
    );
    return res.status(201).json({ message: 'Subscribed to push notifications.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to subscribe.' });
  }
}

/** POST /api/push/unsubscribe  body: { endpoint } */
async function unsubscribe(req, res) {
  const { endpoint } = req.body;
  try {
    await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2', [endpoint, req.user.id]);
    return res.json({ message: 'Unsubscribed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to unsubscribe.' });
  }
}

module.exports = { getPublicKey, subscribe, unsubscribe };
