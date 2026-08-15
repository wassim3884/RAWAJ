const db = require('../config/db');
const { createNotification } = require('./notification.controller');

/** POST /api/products/:id/interest  (affiliate marks "مهتم" on a coming-soon product) */
async function markInterest(req, res) {
  const { id } = req.params;
  try {
    await db.query(
      `INSERT INTO product_interests (product_id, affiliate_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, req.user.id]
    );
    return res.status(201).json({ message: 'تم تسجيل اهتمامك بهذا المنتج.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to register interest.' });
  }
}

/** DELETE /api/products/:id/interest */
async function unmarkInterest(req, res) {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM product_interests WHERE product_id = $1 AND affiliate_id = $2', [id, req.user.id]);
    return res.json({ message: 'Removed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to remove interest.' });
  }
}

/** POST /api/products/:id/notify-restock  (affiliate subscribes to a back-in-stock alert) */
async function subscribeRestock(req, res) {
  const { id } = req.params;
  try {
    await db.query(
      `INSERT INTO stock_notifications (product_id, affiliate_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, req.user.id]
    );
    return res.status(201).json({ message: 'سنُعلمك عند توفر هذا المنتج مجددًا.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to subscribe to restock alert.' });
  }
}

/**
 * Internal helper — called from product.controller.js's updateProduct whenever
 * a product's status changes. Notifies the right audience and clears the
 * relevant subscription list so people aren't notified twice.
 */
async function notifyOnStatusChange(productId, previousStatus, newStatus, productTitle) {
  try {
    if (previousStatus === 'coming_soon' && newStatus === 'active') {
      const interested = await db.query('SELECT affiliate_id FROM product_interests WHERE product_id = $1', [productId]);
      for (const row of interested.rows) {
        await createNotification(
          row.affiliate_id,
          'منتج أصبح متوفرًا الآن',
          `المنتج "${productTitle}" الذي أبديت اهتمامك به أصبح متوفرًا الآن ويمكنك تقديم طلبات عليه. هذا التنبيه يصلك لأنك ضغطت "مهتم" مسبقًا — الهدف منه إعلامك أولاً بالمنتجات الرائجة قبل غيرك.`
        );
      }
      await db.query('DELETE FROM product_interests WHERE product_id = $1', [productId]);
    }

    if (previousStatus === 'out_of_stock' && newStatus === 'active') {
      const subscribers = await db.query('SELECT affiliate_id FROM stock_notifications WHERE product_id = $1', [productId]);
      for (const row of subscribers.rows) {
        await createNotification(
          row.affiliate_id,
          'المنتج متوفر الآن',
          `المنتج "${productTitle}" الذي طلبت تنبيهك عند توفره أصبح متوفرًا في المخزون الآن.`
        );
      }
      await db.query('DELETE FROM stock_notifications WHERE product_id = $1', [productId]);
    }
  } catch (err) {
    console.error('notifyOnStatusChange failed:', err.message);
  }
}

module.exports = { markInterest, unmarkInterest, subscribeRestock, notifyOnStatusChange };
