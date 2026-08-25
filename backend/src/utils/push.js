const webpush = require('web-push');
const db = require('../config/db');

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@rawaj.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    configured = true;
  }
}

/**
 * Sends a web push notification to every device a user has subscribed
 * (they may have multiple — phone + laptop, etc). Silently does nothing
 * if VAPID keys aren't configured or the user has no subscriptions —
 * dashboard notifications (see notification.controller.js) always work
 * regardless, so push is purely additive.
 */
async function sendPushToUser(userId, { title, body, url }) {
  ensureConfigured();
  if (!configured) return;

  try {
    const subscriptions = await db.query('SELECT * FROM push_subscriptions WHERE user_id = $1', [userId]);
    const payload = JSON.stringify({ title, body, url: url || '/' });

    await Promise.all(subscriptions.rows.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        );
      } catch (err) {
        // 410/404 means the subscription is no longer valid — clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]).catch(() => {});
        }
      }
    }));
  } catch (err) {
    console.error('sendPushToUser failed:', err.message);
  }
}

module.exports = { sendPushToUser };
