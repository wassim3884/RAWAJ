const { nanoid } = require('nanoid');
const db = require('../config/db');
const { notifyOnStatusChange } = require('./interest.controller');

/**
 * POST /api/products  (seller)
 * body: { title, description, price, commissionPercent, stockQuantity, categoryId,
 *         sku, shippingInfo, images: [url,...], requiresApproval }
 */
async function createProduct(req, res) {
  const {
    title, description, price, stockQuantity = 0,
    categoryId, sku, shippingInfo = {}, requiresApproval = true, vipPrice,
    status = 'active',
    catalogImages = [], realImages = [], landingImages = [], videoUrls = [],
  } = req.body;

  if (!title || price === undefined) {
    return res.status(400).json({ error: 'title and price are required.' });
  }
  if (!['active', 'coming_soon', 'draft'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + nanoid(6);

    // No commission_percent is collected from the admin anymore — the affiliate
    // sets their own markup per order (see order.controller.js). The column is
    // kept for schema compatibility and defaults to 0 here.
    const productResult = await client.query(
      `INSERT INTO products
        (seller_id, category_id, title, slug, description, price, commission_percent,
         stock_quantity, sku, shipping_info, requires_approval, vip_price, status)
       VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.user.id, categoryId || null, title, slug, description, price,
        stockQuantity, sku, shippingInfo, requiresApproval, vipPrice || null, status]
    );
    const product = productResult.rows[0];

    const imageGroups = [
      { category: 'catalog', urls: catalogImages },
      { category: 'real', urls: realImages },
      { category: 'landing', urls: landingImages },
    ];
    for (const group of imageGroups) {
      for (let i = 0; i < group.urls.length; i++) {
        await client.query(
          `INSERT INTO product_images (product_id, image_url, category, sort_order, is_primary)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, group.urls[i], group.category, i, group.category === 'catalog' && i === 0]
        );
      }
    }

    if (videoUrls.length) {
      await client.query(
        `INSERT INTO product_marketing_assets (product_id, video_urls)
         VALUES ($1, $2)
         ON CONFLICT (product_id) DO UPDATE SET video_urls = $2, updated_at = NOW()`,
        [product.id, JSON.stringify(videoUrls)]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ product });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Failed to create product.' });
  } finally {
    client.release();
  }
}

/** PUT /api/products/:id  (admin only in this single-vendor model) */
async function updateProduct(req, res) {
  const { id } = req.params;
  const allowedFields = [
    'title', 'description', 'price', 'commission_percent', 'stock_quantity',
    'category_id', 'sku', 'shipping_info', 'requires_approval', 'status',
    'is_featured', 'featured_order', 'vip_price',
  ];
  const updates = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(req.body)) {
    const column = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
    if (allowedFields.includes(column)) {
      updates.push(`${column} = $${idx++}`);
      values.push(value);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'No valid fields to update.' });

  values.push(id);

  try {
    const previousResult = await db.query('SELECT status FROM products WHERE id = $1', [id]);
    if (!previousResult.rows.length) return res.status(404).json({ error: 'Product not found.' });
    const previousStatus = previousResult.rows[0].status;

    const query = `UPDATE products SET ${updates.join(', ')}, updated_at = NOW()
                    WHERE id = $${idx} RETURNING *`;
    const result = await db.query(query, values);

    if (!result.rows.length) return res.status(404).json({ error: 'Product not found or access denied.' });
    const product = result.rows[0];

    if (product.status !== previousStatus) {
      notifyOnStatusChange(product.id, previousStatus, product.status, product.title).catch(() => {});
    }

    return res.json({ product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
}

/** DELETE /api/products/:id */
async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found or access denied.' });
    return res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
}

/**
 * GET /api/products  (public — browse/search/filter)
 * query: { q, category, minPrice, maxPrice, sort, page, limit }
 */
async function listProducts(req, res) {
  const { q, category, minPrice, maxPrice, sort = 'newest', page = 1, limit = 20, featured } = req.query;
  const conditions = [`p.status = 'active'`];
  const values = [];
  let idx = 1;

  if (q) {
    conditions.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx})`);
    values.push(`%${q}%`); idx++;
  }
  if (category) {
    conditions.push(`c.slug = $${idx}`);
    values.push(category); idx++;
  }
  if (minPrice) {
    conditions.push(`p.price >= $${idx}`);
    values.push(minPrice); idx++;
  }
  if (maxPrice) {
    conditions.push(`p.price <= $${idx}`);
    values.push(maxPrice); idx++;
  }
  if (featured === 'true') {
    conditions.push(`p.is_featured = TRUE`);
  }

  const sortMap = {
    newest: 'p.created_at DESC',
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    best_selling: 'p.sales_count DESC',
    top_rated: 'p.avg_rating DESC',
  };
  const orderBy = featured === 'true' ? 'p.featured_order ASC, p.created_at DESC' : (sortMap[sort] || sortMap.newest);
  const offset = (Number(page) - 1) * Number(limit);

  values.push(limit, offset);

  try {
    const query = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND category = 'catalog' AND is_primary LIMIT 1) AS primary_image
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}`;
    const result = await db.query(query, values);
    return res.json({ products: result.rows, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

/** GET /api/products/:slug  (public product detail page) */
async function getProductBySlug(req, res) {
  const { slug } = req.params;
  try {
    const productResult = await db.query(
      `SELECT p.*, c.name AS category_name,
              apr.status AS request_status
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN affiliate_product_requests apr ON apr.product_id = p.id AND apr.affiliate_id = $2
       WHERE p.slug = $1`,
      [slug, req.user?.id || null]
    );
    if (!productResult.rows.length) return res.status(404).json({ error: 'Product not found.' });
    const product = productResult.rows[0];

    const [images, reviews] = await Promise.all([
      db.query('SELECT image_url, category, is_primary FROM product_images WHERE product_id = $1 ORDER BY sort_order', [product.id]),
      db.query(
        `SELECT r.rating, r.comment, r.created_at, u.full_name
         FROM product_reviews r JOIN users u ON u.id = r.customer_id
         WHERE r.product_id = $1 ORDER BY r.created_at DESC LIMIT 20`,
        [product.id]
      ),
    ]);

    db.query('UPDATE products SET views_count = views_count + 1 WHERE id = $1', [product.id]).catch(() => {});

    const groupedImages = {
      catalog: images.rows.filter((i) => i.category === 'catalog'),
      real: images.rows.filter((i) => i.category === 'real'),
      landing: images.rows.filter((i) => i.category === 'landing'),
    };

    return res.json({ product, images: groupedImages, reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch product.' });
  }
}

/** GET /api/products/seller/mine  (admin's own product list, with upcoming-product interest counts) */
async function listMyProducts(req, res) {
  try {
    const result = await db.query(
      `SELECT p.*, (SELECT image_url FROM product_images WHERE product_id = p.id AND category = 'catalog' AND is_primary LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM product_interests pi WHERE pi.product_id = p.id) AS interest_count,
              (SELECT COUNT(*) FROM stock_notifications sn WHERE sn.product_id = p.id) AS restock_subscriber_count
       FROM products p WHERE seller_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch your products.' });
  }
}

/** GET /api/products/upcoming  (affiliate — browse "coming soon" products) */
async function listUpcomingProducts(req, res) {
  try {
    const result = await db.query(
      `SELECT p.*, c.name AS category_name,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND category = 'catalog' AND is_primary LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM product_interests pi WHERE pi.product_id = p.id) AS interest_count,
              EXISTS(SELECT 1 FROM product_interests pi WHERE pi.product_id = p.id AND pi.affiliate_id = $1) AS is_interested
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.status = 'coming_soon'
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    return res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch upcoming products.' });
  }
}

/** PUT /api/products/:id/marketing  (admin — set up the ready-made marketing kit) */
async function upsertMarketingAssets(req, res) {
  const { id } = req.params;
  const { adTitles = [], videoUrls = [], imageUrls = [], adCopyVariants = [], facebookPost, instagramPost, tiktokPost } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO product_marketing_assets
        (product_id, ad_titles, video_urls, image_urls, ad_copy_variants, facebook_post, instagram_post, tiktok_post)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (product_id) DO UPDATE SET
         ad_titles = $2, video_urls = $3, image_urls = $4, ad_copy_variants = $5,
         facebook_post = $6, instagram_post = $7, tiktok_post = $8, updated_at = NOW()
       RETURNING *`,
      [id, JSON.stringify(adTitles), JSON.stringify(videoUrls), JSON.stringify(imageUrls),
        JSON.stringify(adCopyVariants), facebookPost || null, instagramPost || null, tiktokPost || null]
    );
    return res.json({ marketingAssets: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to save marketing kit.' });
  }
}

/** GET /api/products/:id/marketing  (verified affiliate — view the ready-made marketing kit) */
async function getMarketingAssets(req, res) {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM product_marketing_assets WHERE product_id = $1', [id]);
    return res.json({ marketingAssets: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch marketing kit.' });
  }
}

module.exports = {
  createProduct, updateProduct, deleteProduct, listProducts, getProductBySlug, listMyProducts,
  listUpcomingProducts, upsertMarketingAssets, getMarketingAssets,
};
