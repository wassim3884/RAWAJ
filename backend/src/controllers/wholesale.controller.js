const db = require('../config/db');

/** GET /api/wholesale  (public — search/browse wholesale catalog) */
async function listWholesaleProducts(req, res) {
  const { q, category } = req.query;
  const conditions = ['w.is_active = TRUE'];
  const values = [];
  let idx = 1;

  if (q) { conditions.push(`w.title ILIKE $${idx++}`); values.push(`%${q}%`); }
  if (category) { conditions.push(`c.slug = $${idx++}`); values.push(category); }

  try {
    const result = await db.query(
      `SELECT w.id, w.title, w.description, w.image_url, w.wholesale_price, w.min_order_quantity,
              c.name AS category_name, c.slug AS category_slug
       FROM wholesale_products w
       LEFT JOIN categories c ON c.id = w.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY w.created_at DESC`,
      values
    );
    return res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch wholesale products.' });
  }
}

/** POST /api/wholesale  (admin) */
async function createWholesaleProduct(req, res) {
  const { title, description, imageUrl, wholesalePrice, minOrderQuantity = 1, categoryId, sourceNotes } = req.body;
  if (!title || wholesalePrice === undefined) {
    return res.status(400).json({ error: 'title and wholesalePrice are required.' });
  }
  try {
    const result = await db.query(
      `INSERT INTO wholesale_products (title, description, image_url, wholesale_price, min_order_quantity, category_id, source_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description || null, imageUrl || null, wholesalePrice, minOrderQuantity, categoryId || null, sourceNotes || null]
    );
    return res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create wholesale product.' });
  }
}

/** GET /api/wholesale/mine  (admin — includes private source notes + inactive items) */
async function listWholesaleProductsAdmin(req, res) {
  const { q } = req.query;
  const conditions = [];
  const values = [];
  if (q) { conditions.push(`title ILIKE $1`); values.push(`%${q}%`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const result = await db.query(`SELECT * FROM wholesale_products ${where} ORDER BY created_at DESC`, values);
    return res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch wholesale products.' });
  }
}

/** PUT /api/wholesale/:id  (admin) */
async function updateWholesaleProduct(req, res) {
  const { id } = req.params;
  const { title, description, imageUrl, wholesalePrice, minOrderQuantity, categoryId, sourceNotes, isActive } = req.body;
  try {
    const result = await db.query(
      `UPDATE wholesale_products SET
         title = COALESCE($1, title), description = COALESCE($2, description),
         image_url = COALESCE($3, image_url), wholesale_price = COALESCE($4, wholesale_price),
         min_order_quantity = COALESCE($5, min_order_quantity), category_id = COALESCE($6, category_id),
         source_notes = COALESCE($7, source_notes), is_active = COALESCE($8, is_active)
       WHERE id = $9 RETURNING *`,
      [title, description, imageUrl, wholesalePrice, minOrderQuantity, categoryId, sourceNotes, isActive, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Wholesale product not found.' });
    return res.json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update wholesale product.' });
  }
}

/** DELETE /api/wholesale/:id  (admin) */
async function deleteWholesaleProduct(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM wholesale_products WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Wholesale product not found.' });
    return res.json({ message: 'Deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete wholesale product.' });
  }
}

/** GET /api/wholesale/telegram-url  (public) */
async function getTelegramUrl(req, res) {
  try {
    const result = await db.query(`SELECT value FROM site_settings WHERE key = 'wholesale_telegram_url'`);
    return res.json({ telegramUrl: result.rows[0]?.value || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch Telegram link.' });
  }
}

/** POST /api/wholesale/search-requests  (public — merchant describes what they want) */
async function createSearchRequest(req, res) {
  const { description, imageUrls = [], whatsappNumber } = req.body;
  if (!description || !whatsappNumber) {
    return res.status(400).json({ error: 'description and whatsappNumber are required.' });
  }
  try {
    const result = await db.query(
      `INSERT INTO product_search_requests (description, image_urls, whatsapp_number)
       VALUES ($1, $2, $3) RETURNING *`,
      [description, JSON.stringify(imageUrls), whatsappNumber]
    );
    return res.status(201).json({ request: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to submit request.' });
  }
}

/** GET /api/wholesale/search-requests  (admin) */
async function listSearchRequests(req, res) {
  const { status } = req.query;
  try {
    const query = status
      ? 'SELECT * FROM product_search_requests WHERE status = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM product_search_requests ORDER BY created_at DESC';
    const result = await db.query(query, status ? [status] : []);
    return res.json({ requests: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch requests.' });
  }
}

/** PUT /api/wholesale/search-requests/:id  (admin) */
async function updateSearchRequest(req, res) {
  const { id } = req.params;
  const { status, adminNote } = req.body;
  try {
    const result = await db.query(
      `UPDATE product_search_requests SET
         status = COALESCE($1, status), admin_note = COALESCE($2, admin_note)
       WHERE id = $3 RETURNING *`,
      [status, adminNote, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Request not found.' });
    return res.json({ request: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update request.' });
  }
}

module.exports = {
  listWholesaleProducts, createWholesaleProduct, listWholesaleProductsAdmin,
  updateWholesaleProduct, deleteWholesaleProduct, getTelegramUrl,
  createSearchRequest, listSearchRequests, updateSearchRequest,
};
