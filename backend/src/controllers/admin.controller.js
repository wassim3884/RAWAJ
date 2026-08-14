const db = require('../config/db');

/** GET /api/admin/users?role=&q= */
async function listUsers(req, res) {
  const { role, q } = req.query;
  const conditions = [];
  const values = [];
  let idx = 1;

  if (role) { conditions.push(`role = $${idx++}`); values.push(role); }
  if (q) { conditions.push(`(full_name ILIKE $${idx} OR email ILIKE $${idx})`); values.push(`%${q}%`); idx++; }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const result = await db.query(
      `SELECT id, full_name, email, role, is_active, is_email_verified, created_at
       FROM users ${where} ORDER BY created_at DESC`,
      values
    );
    return res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
}

/** PUT /api/admin/users/:id/status  — body: { isActive } (ban/unban) */
async function setUserStatus(req, res) {
  const { id } = req.params;
  const { isActive } = req.body;
  try {
    const result = await db.query('UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, is_active', [isActive, id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
}

/** GET /api/admin/products?status=pending  — moderation queue */
async function listProductsForModeration(req, res) {
  const { status = 'pending' } = req.query;
  try {
    const result = await db.query(
      `SELECT p.*, s.store_name FROM products p
       JOIN seller_profiles s ON s.user_id = p.seller_id
       WHERE p.status = $1 ORDER BY p.created_at ASC`,
      [status]
    );
    return res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

/** PUT /api/admin/products/:id/status — body: { status } */
async function setProductStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await db.query('UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found.' });
    return res.json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update product status.' });
  }
}

/** GET /api/admin/analytics  — platform-wide dashboard numbers */
async function getAnalytics(req, res) {
  try {
    const [users, products, orders, revenue, commissions] = await Promise.all([
      db.query(`SELECT role, COUNT(*) FROM users GROUP BY role`),
      db.query(`SELECT status, COUNT(*) FROM products GROUP BY status`),
      db.query(`SELECT order_status, COUNT(*) FROM orders GROUP BY order_status`),
      db.query(`SELECT COALESCE(SUM(final_total),0) AS total FROM orders WHERE order_status = 'delivered'`),
      db.query(`SELECT status, COALESCE(SUM(amount),0) AS total FROM commissions GROUP BY status`),
    ]);
    return res.json({
      usersByRole: users.rows,
      productsByStatus: products.rows,
      ordersByStatus: orders.rows,
      totalRevenue: Number(revenue.rows[0].total),
      commissionsByStatus: commissions.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
}

/** Category CRUD */
async function createCategory(req, res) {
  const { name, slug, parentId, iconUrl } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO categories (name, slug, parent_id, icon_url) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, slug, parentId || null, iconUrl || null]
    );
    return res.status(201).json({ category: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create category.' });
  }
}

async function listCategories(req, res) {
  try {
    const result = await db.query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY name');
    return res.json({ categories: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

/** Site settings (homepage content, banners) — simple key/value store */
async function updateSiteSetting(req, res) {
  const { key } = req.params;
  const { value } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO site_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2 RETURNING *`,
      [key, value]
    );
    return res.json({ setting: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update setting.' });
  }
}

async function getSiteSetting(req, res) {
  const { key } = req.params;
  try {
    const result = await db.query('SELECT * FROM site_settings WHERE key = $1', [key]);
    return res.json({ setting: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch setting.' });
  }
}

/** DELETE /api/admin/users/:id — permanent delete, affiliates only.
 *  The `orders` and `commissions` tables reference users(id) WITHOUT
 *  ON DELETE CASCADE (see schema.sql), so Postgres itself blocks deleting
 *  an affiliate who has any order/commission history — this rejects with a
 *  foreign_key_violation (Postgres code 23503), which we turn into a clear
 *  message instead of a raw DB error. That protection is intentional and
 *  is not bypassed here: an affiliate with real business history can't be
 *  hard-deleted, only banned via setUserStatus.
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query(
      `DELETE FROM users WHERE id = $1 AND role = 'affiliate' RETURNING id`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Affiliate not found.' });
    }
    return res.json({ success: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'لا يمكن حذف هذا المسوّق نهائيًا لأن لديه طلبات أو عمولات سابقة. استخدم "حظر" بدلًا من ذلك للحفاظ على السجل المالي.',
      });
    }
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete affiliate.' });
  }
}

module.exports = {
  listUsers, setUserStatus, listProductsForModeration, setProductStatus,
  getAnalytics, createCategory, listCategories, updateSiteSetting, getSiteSetting,
  deleteUser,
};
