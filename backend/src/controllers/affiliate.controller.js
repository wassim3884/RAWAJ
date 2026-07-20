const db = require('../config/db');

/**
 * POST /api/affiliate/requests   (affiliate requests approval to promote a product)
 * body: { productId }
 */
async function requestProductApproval(req, res) {
  const { productId } = req.body;
  try {
    const product = await db.query('SELECT id, requires_approval FROM products WHERE id = $1', [productId]);
    if (!product.rows.length) return res.status(404).json({ error: 'Product not found.' });

    // If approval isn't required, auto-approve
    const status = product.rows[0].requires_approval ? 'pending' : 'approved';

    const result = await db.query(
      `INSERT INTO affiliate_product_requests (affiliate_id, product_id, status, decided_at)
       VALUES ($1, $2, $3, CASE WHEN $3 = 'approved' THEN NOW() ELSE NULL END)
       ON CONFLICT (affiliate_id, product_id) DO UPDATE SET status = affiliate_product_requests.status
       RETURNING *`,
      [req.user.id, productId, status]
    );

    return res.status(201).json({ request: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to submit approval request.' });
  }
}

/** PUT /api/affiliate/requests/:id/decision  (admin approves or rejects) — body: { decision: 'approved'|'rejected' } */
async function decideProductRequest(req, res) {
  const { id } = req.params;
  const { decision } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approved or rejected.' });
  }
  try {
    const result = await db.query(
      `UPDATE affiliate_product_requests SET status = $1, decided_at = NOW()
       WHERE id = $2 RETURNING *`,
      [decision, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Request not found.' });
    return res.json({ request: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update request.' });
  }
}

/** GET /api/affiliate/stats  (dashboard summary: commissions + delivered order count) */
async function getStats(req, res) {
  try {
    const [profile, deliveredCount, commissionStats] = await Promise.all([
      db.query('SELECT * FROM affiliate_profiles WHERE user_id = $1', [req.user.id]),
      db.query(`SELECT COUNT(*) AS count FROM orders WHERE affiliate_id = $1 AND order_status = 'delivered'`, [req.user.id]),
      db.query(
        `SELECT status, COALESCE(SUM(amount),0) AS total
         FROM commissions WHERE affiliate_id = $1 GROUP BY status`,
        [req.user.id]
      ),
    ]);

    const commissionsByStatus = { pending: 0, confirmed: 0, paid: 0, cancelled: 0 };
    commissionStats.rows.forEach((row) => { commissionsByStatus[row.status] = Number(row.total); });

    return res.json({
      profile: profile.rows[0] || null,
      deliveredOrders: Number(deliveredCount.rows[0].count),
      commissions: commissionsByStatus,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
}

/** GET /api/affiliate/products  (browse approved + approvable products with request status) */
async function browseProducts(req, res) {
  const { category, q } = req.query;
  const conditions = [`p.status = 'active'`];
  const values = [req.user.id];
  let idx = 2;

  if (category) { conditions.push(`c.slug = $${idx++}`); values.push(category); }
  if (q) { conditions.push(`p.title ILIKE $${idx++}`); values.push(`%${q}%`); }

  try {
    const result = await db.query(
      `SELECT p.*, c.name AS category_name,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND category = 'catalog' AND is_primary LIMIT 1) AS primary_image,
              apr.status AS request_status
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN affiliate_product_requests apr ON apr.product_id = p.id AND apr.affiliate_id = $1
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.created_at DESC`,
      values
    );
    return res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

module.exports = {
  requestProductApproval, decideProductRequest, getStats, browseProducts,
};
