const db = require('../config/db');

const VIP_ELIGIBILITY_THRESHOLD = 30; // delivered orders required to unlock VIP eligibility

/** GET /api/vip/eligibility  (affiliate — their own progress toward VIP) */
async function getEligibility(req, res) {
  try {
    const [deliveredResult, profileResult] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM orders WHERE affiliate_id = $1 AND order_status = 'delivered'`, [req.user.id]),
      db.query('SELECT is_vip, vip_since FROM affiliate_profiles WHERE user_id = $1', [req.user.id]),
    ]);
    const deliveredOrders = Number(deliveredResult.rows[0].count);
    return res.json({
      deliveredOrders,
      threshold: VIP_ELIGIBILITY_THRESHOLD,
      isEligible: deliveredOrders >= VIP_ELIGIBILITY_THRESHOLD,
      isVip: profileResult.rows[0]?.is_vip || false,
      vipSince: profileResult.rows[0]?.vip_since || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to check VIP eligibility.' });
  }
}

/** GET /api/vip/store  (affiliate — fetch their own VIP store config, if any) */
async function getMyStore(req, res) {
  try {
    const result = await db.query('SELECT * FROM vip_stores WHERE affiliate_id = $1', [req.user.id]);
    return res.json({ store: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch your store.' });
  }
}

/**
 * PUT /api/vip/store  (affiliate — create/update their own VIP storefront; VIP only)
 * body: { storeSlug, headline, subheadline, bannerUrl, contactPhone, contactTelegram, productIds: [1,2,3] }
 */
async function upsertMyStore(req, res) {
  const profileResult = await db.query('SELECT is_vip FROM affiliate_profiles WHERE user_id = $1', [req.user.id]);
  if (!profileResult.rows[0]?.is_vip) {
    return res.status(403).json({ error: 'VIP status is required to create a store.' });
  }

  const { storeSlug, headline, subheadline, bannerUrl, contactPhone, contactTelegram, productIds = [] } = req.body;
  if (!storeSlug) return res.status(400).json({ error: 'storeSlug is required.' });

  try {
    const result = await db.query(
      `INSERT INTO vip_stores (affiliate_id, store_slug, headline, subheadline, banner_url, contact_phone, contact_telegram, product_ids)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (affiliate_id) DO UPDATE SET
         store_slug = $2, headline = COALESCE($3, vip_stores.headline), subheadline = $4,
         banner_url = $5, contact_phone = $6, contact_telegram = $7, product_ids = $8, updated_at = NOW()
       RETURNING *`,
      [req.user.id, storeSlug, headline || 'متجري الإلكتروني', subheadline || null, bannerUrl || null,
        contactPhone || null, contactTelegram || null, JSON.stringify(productIds)]
    );
    return res.json({ store: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'This store URL is already taken — choose another.' });
    console.error(err);
    return res.status(500).json({ error: 'Failed to save your store.' });
  }
}

/** GET /api/vip/resources  (affiliate — best sellers / marketing tips / landing images, VIP only) */
async function getResources(req, res) {
  try {
    const profileResult = await db.query('SELECT is_vip FROM affiliate_profiles WHERE user_id = $1', [req.user.id]);
    if (!profileResult.rows[0]?.is_vip) {
      return res.status(403).json({ error: 'VIP status is required to view resources.' });
    }
    const result = await db.query(`SELECT value FROM site_settings WHERE key = 'vip_resources'`);
    return res.json({ resources: result.rows[0]?.value || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch VIP resources.' });
  }
}

/** GET /api/admin/vip/eligible  (admin — affiliates who qualify, with current VIP status) */
async function listEligibleAffiliates(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, ap.is_vip, ap.vip_since,
              COUNT(o.id) FILTER (WHERE o.order_status = 'delivered') AS delivered_orders
       FROM users u
       JOIN affiliate_profiles ap ON ap.user_id = u.id
       LEFT JOIN orders o ON o.affiliate_id = u.id
       WHERE u.role = 'affiliate'
       GROUP BY u.id, ap.is_vip, ap.vip_since
       HAVING COUNT(o.id) FILTER (WHERE o.order_status = 'delivered') >= $1 OR ap.is_vip = TRUE
       ORDER BY delivered_orders DESC`,
      [VIP_ELIGIBILITY_THRESHOLD]
    );
    return res.json({ affiliates: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch eligible affiliates.' });
  }
}

/** PUT /api/admin/vip/:affiliateId  (admin — grant or revoke VIP) body: { isVip } */
async function setVipStatus(req, res) {
  const { affiliateId } = req.params;
  const { isVip } = req.body;
  try {
    const result = await db.query(
      `UPDATE affiliate_profiles SET is_vip = $1, vip_since = CASE WHEN $1 THEN NOW() ELSE NULL END
       WHERE user_id = $2 RETURNING *`,
      [isVip, affiliateId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Affiliate not found.' });
    return res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update VIP status.' });
  }
}

/** PUT /api/admin/vip/resources  (admin — edit VIP resources content) */
async function updateResources(req, res) {
  const { value } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO site_settings (key, value) VALUES ('vip_resources', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1 RETURNING *`,
      [value]
    );
    return res.json({ setting: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update VIP resources.' });
  }
}

module.exports = {
  getEligibility, getMyStore, upsertMyStore, getResources,
  listEligibleAffiliates, setVipStatus, updateResources,
};
