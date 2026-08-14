const db = require('../config/db');

/** GET /api/wishlist  (affiliate — their saved products) */
async function listMyWishlist(req, res) {
  try {
    const result = await db.query(
      `SELECT p.*, c.name AS category_name,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND category = 'catalog' AND is_primary LIMIT 1) AS primary_image,
              w.added_at
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [req.user.id]
    );
    return res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch your saved products.' });
  }
}

/** POST /api/wishlist/:productId */
async function addToWishlist(req, res) {
  const { productId } = req.params;
  try {
    await db.query(
      `INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.user.id, productId]
    );
    return res.status(201).json({ message: 'تمت الإضافة لقائمة الحفظ.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save product.' });
  }
}

/** DELETE /api/wishlist/:productId */
async function removeFromWishlist(req, res) {
  const { productId } = req.params;
  try {
    await db.query('DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2', [req.user.id, productId]);
    return res.json({ message: 'Removed.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to remove product.' });
  }
}

module.exports = { listMyWishlist, addToWishlist, removeFromWishlist };
