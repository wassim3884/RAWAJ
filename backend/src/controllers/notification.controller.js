const db = require('../config/db');
const { sendPushToUser } = require('../utils/push');

/** GET /api/notifications  (current user's dashboard notifications) */
async function listMyNotifications(req, res) {
  try {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    return res.json({ notifications: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

/** PUT /api/notifications/:id/read */
async function markAsRead(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Notification not found.' });
    return res.json({ notification: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
}

/**
 * Internal helper used by other controllers to push a dashboard notification.
 * Also fires a real push notification to any devices the user has subscribed
 * from the PWA — non-blocking, and safe even if push isn't configured.
 */
async function createNotification(userId, title, message, channel = 'dashboard') {
  const result = await db.query(
    `INSERT INTO notifications (user_id, title, message, channel) VALUES ($1,$2,$3,$4) RETURNING *`,
    [userId, title, message, channel]
  );
  sendPushToUser(userId, { title, body: message }).catch(() => {});
  return result;
}

module.exports = { listMyNotifications, markAsRead, createNotification };
