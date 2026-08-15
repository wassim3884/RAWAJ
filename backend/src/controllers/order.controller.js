const { nanoid } = require('nanoid');
const db = require('../config/db');
const { createNotification } = require('./notification.controller');
const { formatDZD } = require('../utils/currency');

/**
 * POST /api/orders  (affiliate submits a lead — a buyer they found off-platform)
 * body: {
 *   productId, buyerName, buyerPhone, wilayaId,
 *   deliveryType: 'home' | 'office', notes?
 * }
 *
 * The final price shown to the buyer = product price + affiliate commission + delivery fee.
 * Nothing is charged online — this simply records the lead so the admin can call
 * the buyer and confirm before anything ships (COD model).
 */
async function createOrder(req, res) {
  const { productId, buyerName, buyerPhone, wilayaId, deliveryType = 'home', notes, commissionAmount } = req.body;

  if (!productId || !buyerName || !buyerPhone || !wilayaId || commissionAmount === undefined) {
    return res.status(400).json({ error: 'productId, buyerName, buyerPhone, wilayaId and commissionAmount are required.' });
  }
  const commission = Number(commissionAmount);
  if (Number.isNaN(commission) || commission < 0) {
    return res.status(400).json({ error: 'commissionAmount must be a non-negative number.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const productResult = await client.query(
      `SELECT * FROM products WHERE id = $1 AND status = 'active' FOR UPDATE`,
      [productId]
    );
    const product = productResult.rows[0];
    if (!product) throw new Error('This product is not available.');
    if (product.stock_quantity < 1) throw new Error('This product is out of stock.');

    const wilayaResult = await client.query('SELECT * FROM wilayas WHERE id = $1 AND is_active = TRUE', [wilayaId]);
    const wilaya = wilayaResult.rows[0];
    if (!wilaya) throw new Error('Invalid wilaya.');

    // Approval-before-selling was retired platform-wide (product decision) —
    // affiliates can submit a lead for any active product immediately.
    // affiliate_product_requests / requires_approval remain in the schema
    // (admin's product form still has the toggle) but are no longer
    // enforced here, so no code path silently depends on that data.

    const deliveryFee = deliveryType === 'office' ? Number(wilaya.delivery_fee_office) : Number(wilaya.delivery_fee_home);
    // The affiliate sets their own commission amount per order — the admin's
    // product price is treated purely as their cost, and doesn't dictate what
    // the affiliate charges on top.
    const commissionAmount_ = Math.round(commission * 100) / 100;
    const finalTotal = Number(product.price) + commissionAmount_ + deliveryFee;

    const orderNumber = 'SGL-' + nanoid(10).toUpperCase();

    const orderResult = await client.query(
      `INSERT INTO orders
        (order_number, affiliate_id, buyer_name, buyer_phone, wilaya_id, delivery_type, notes,
         product_price, commission_amount, delivery_fee, final_total, order_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')
       RETURNING *`,
      [orderNumber, req.user.id, buyerName, buyerPhone, wilayaId, deliveryType, notes || null,
        product.price, commissionAmount_, deliveryFee, finalTotal]
    );
    const order = orderResult.rows[0];

    const effectivePercent = Number(product.price) > 0 ? (commissionAmount_ / Number(product.price)) * 100 : 0;

    await client.query(
      `INSERT INTO order_items
        (order_id, product_id, affiliate_id, quantity, unit_price,
         commission_percent, commission_amount, line_total)
       VALUES ($1,$2,$3,1,$4,$5,$6,$7)`,
      [order.id, product.id, req.user.id, product.price,
        effectivePercent, commissionAmount_, product.price]
    );

    // Commission starts pending — confirmed only once the order is delivered
    await client.query(
      `INSERT INTO commissions (order_item_id, affiliate_id, amount, status)
       VALUES ((SELECT id FROM order_items WHERE order_id = $1), $2, $3, 'pending')`,
      [order.id, req.user.id, commissionAmount_]
    );

    await client.query(
      'UPDATE affiliate_profiles SET pending_balance = pending_balance + $1 WHERE user_id = $2',
      [commissionAmount_, req.user.id]
    );

    await client.query('COMMIT');

    // Notify every admin that a new lead needs a confirmation call
    db.query(`SELECT id FROM users WHERE role = 'admin'`).then(({ rows }) => {
      rows.forEach((admin) => {
        createNotification(
          admin.id,
          'طلب جديد بانتظار التأكيد',
          `وصل طلب جديد رقم ${orderNumber} من المسوّق يحتاج مكالمة تأكيد مع الزبون ${buyerName}.`
        ).catch(() => {});
      });
    }).catch(() => {});

    return res.status(201).json({
      order,
      message: 'Lead submitted. Our team will call the buyer to confirm the order.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(400).json({ error: err.message || 'Failed to submit the order.' });
  } finally {
    client.release();
  }
}

/**
 * PUT /api/orders/:id/status  (admin only — after calling the buyer)
 * body: { status, adminCallStatus?, trackingNumber?, failureReason? }
 *
 * failureReason is required in spirit (though not enforced) whenever status is
 * 'no_answer', 'cancelled', or 'refunded' — it's what the affiliate sees explaining
 * why the sale didn't go through.
 *
 * When status becomes 'delivered', the pending commission for this order is
 * confirmed and moved into the affiliate's spendable balance.
 * When 'cancelled', 'no_answer', or 'refunded', the pending commission is cancelled
 * and the stock is restored if it had already been decremented.
 */
const STATUS_LABELS_AR = {
  pending: 'بانتظار الاتصال بالزبون',
  confirmed: 'تم الاتصال وتأكيد الطلب',
  no_answer: 'تعذّر الوصول للزبون',
  processing: 'قيد التحضير',
  shipped: 'في التوصيل',
  delivered: 'تم التوصيل',
  cancelled: 'تم إلغاء الطلب',
  refunded: 'تم استرجاع الطلب',
};

async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status, adminCallStatus, trackingNumber, failureReason } = req.body;
  const validStatuses = Object.keys(STATUS_LABELS_AR);
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `UPDATE orders SET order_status = $1, admin_call_status = COALESCE($2, admin_call_status),
         tracking_number = COALESCE($3, tracking_number),
         failure_reason = CASE WHEN $1 IN ('no_answer','cancelled','refunded') THEN COALESCE($5, failure_reason) ELSE failure_reason END,
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, adminCallStatus || null, trackingNumber || null, id, failureReason || null]
    );
    if (!orderResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found.' });
    }
    const order = orderResult.rows[0];

    // Decrement stock only once the order is actually confirmed (avoids reserving
    // stock for leads that never get answered)
    if (status === 'confirmed') {
      await client.query(
        `UPDATE products SET stock_quantity = stock_quantity - oi.quantity, sales_count = sales_count + oi.quantity
         FROM order_items oi WHERE oi.order_id = $1 AND products.id = oi.product_id`,
        [id]
      );
      // Never delete a product when it sells out — mark it out_of_stock so affiliates
      // can still see it and subscribe to a restock alert.
      await client.query(
        `UPDATE products SET status = 'out_of_stock' WHERE id IN (
           SELECT product_id FROM order_items WHERE order_id = $1
         ) AND stock_quantity <= 0 AND status = 'active'`,
        [id]
      );
    }

    if (status === 'delivered') {
      const commissionsResult = await client.query(
        `SELECT c.* FROM commissions c
         JOIN order_items oi ON oi.id = c.order_item_id
         WHERE oi.order_id = $1 AND c.status = 'pending'`,
        [id]
      );
      for (const comm of commissionsResult.rows) {
        await client.query(`UPDATE commissions SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1`, [comm.id]);
        await client.query(
          `UPDATE affiliate_profiles
           SET pending_balance = pending_balance - $1, balance = balance + $1, total_earnings = total_earnings + $1
           WHERE user_id = $2`,
          [comm.amount, comm.affiliate_id]
        );
        createNotification(
          comm.affiliate_id,
          'تم احتساب عمولتك',
          `تم تسليم طلب "${order.order_number}" بنجاح وتم احتساب عمولة قدرها ${formatDZD(comm.amount)} وإضافتها لرصيدك القابل للسحب.`
        ).catch(() => {});
      }
      await client.query(`UPDATE orders SET payment_status = 'paid' WHERE id = $1`, [id]);
    } else if (['cancelled', 'no_answer', 'refunded'].includes(status)) {
      const commissionsResult = await client.query(
        `SELECT c.* FROM commissions c
         JOIN order_items oi ON oi.id = c.order_item_id
         WHERE oi.order_id = $1 AND c.status = 'pending'`,
        [id]
      );
      for (const comm of commissionsResult.rows) {
        await client.query(`UPDATE commissions SET status = 'cancelled' WHERE id = $1`, [comm.id]);
        await client.query(
          'UPDATE affiliate_profiles SET pending_balance = pending_balance - $1 WHERE user_id = $2',
          [comm.amount, comm.affiliate_id]
        );
      }
      // Restore stock if it had been reserved (order was previously confirmed)
      if (status === 'refunded') {
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity + oi.quantity
           FROM order_items oi WHERE oi.order_id = $1 AND products.id = oi.product_id`,
          [id]
        );
      }
    }

    // Notify the affiliate of every status change in plain Arabic, so they always
    // know exactly where their order stands (contacted / in delivery / delivered / failed & why).
    const orderItemResult = await client.query('SELECT affiliate_id FROM order_items WHERE order_id = $1 LIMIT 1', [id]);
    const affiliateId = orderItemResult.rows[0]?.affiliate_id;
    if (affiliateId) {
      const label = STATUS_LABELS_AR[status] || status;
      const reasonSuffix = failureReason && ['no_answer', 'cancelled', 'refunded'].includes(status)
        ? ` — السبب: ${failureReason}`
        : '';
      createNotification(
        affiliateId,
        `تحديث حالة الطلب ${order.order_number}`,
        `${label}${reasonSuffix}`
      ).catch(() => {});
    }

    await client.query('COMMIT');
    return res.json({ order: orderResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Failed to update order status.' });
  } finally {
    client.release();
  }
}

/** GET /api/orders/mine  (affiliate — leads they've submitted) */
async function listMyOrders(req, res) {
  try {
    const result = await db.query(
      `SELECT o.*, w.name_ar AS wilaya_name_ar, w.name_fr AS wilaya_name_fr,
              oi.product_id, p.title AS product_title
       FROM orders o
       JOIN wilayas w ON w.id = o.wilaya_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       WHERE o.affiliate_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    return res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch your orders.' });
  }
}

/** GET /api/orders  (admin — all leads, optionally filtered by status) */
async function listAllOrders(req, res) {
  const { status } = req.query;
  try {
    const conditions = status ? 'WHERE o.order_status = $1' : '';
    const result = await db.query(
      `SELECT o.*, w.name_ar AS wilaya_name_ar, w.name_fr AS wilaya_name_fr,
              u.full_name AS affiliate_name, u.email AS affiliate_email, u.phone AS affiliate_phone,
              oi.product_id, p.title AS product_title
       FROM orders o
       JOIN wilayas w ON w.id = o.wilaya_id
       JOIN users u ON u.id = o.affiliate_id
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
       ${conditions}
       ORDER BY o.created_at DESC`,
      status ? [status] : []
    );
    return res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch orders.' });
  }
}

/** GET /api/orders/:orderNumber/track  (public order tracking) */
async function trackOrder(req, res) {
  const { orderNumber } = req.params;
  try {
    const result = await db.query(
      'SELECT order_number, order_status, tracking_number, created_at, updated_at FROM orders WHERE order_number = $1',
      [orderNumber]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found.' });
    return res.json({ order: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch order.' });
  }
}

module.exports = { createOrder, updateOrderStatus, listMyOrders, listAllOrders, trackOrder };
