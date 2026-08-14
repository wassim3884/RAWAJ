const express = require('express');
const router = express.Router();
const db = require('../config/db');

/** GET /api/store/:slug  (public — VIP affiliate's independent landing-page store) */
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const storeResult = await db.query(
      `SELECT vs.*, u.full_name AS affiliate_name
       FROM vip_stores vs JOIN users u ON u.id = vs.affiliate_id
       WHERE vs.store_slug = $1 AND vs.is_active = TRUE`,
      [slug]
    );
    if (!storeResult.rows.length) return res.status(404).json({ error: 'Store not found.' });
    const store = storeResult.rows[0];

    const productIds = Array.isArray(store.product_ids) ? store.product_ids : JSON.parse(store.product_ids || '[]');
    let products = [];
    if (productIds.length) {
      const productsResult = await db.query(
        `SELECT p.id, p.title, p.slug, p.price, p.vip_price, p.description,
                (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary LIMIT 1) AS primary_image
         FROM products p WHERE p.id = ANY($1::bigint[]) AND p.status = 'active'`,
        [productIds]
      );
      products = productsResult.rows;
    }

    return res.json({ store, products });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch store.' });
  }
});

module.exports = router;
