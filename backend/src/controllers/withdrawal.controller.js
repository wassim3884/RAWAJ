const db = require('../config/db');
const { createNotification } = require('./notification.controller');

const profileTable = (role) => (role === 'seller' ? 'seller_profiles' : 'affiliate_profiles');

const STATUS_LABELS_AR = {
  pending: 'في الانتظار',
  under_review: 'يتم التحقق',
  approved: 'مؤكدة — سيتم الدفع خلال 48 ساعة',
  rejected: 'تم رفض الطلب',
  paid: 'تم الدفع',
};

/** POST /api/withdrawals  (affiliate requests a payout) */
async function requestWithdrawal(req, res) {
  const { amount, method, payoutDetails = {} } = req.body;
  const role = req.user.role;
  if (role !== 'affiliate') {
    return res.status(403).json({ error: 'Only affiliates can request withdrawals.' });
  }
  if (!amount || amount <= 0 || !method) {
    return res.status(400).json({ error: 'A valid amount and method are required.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const table = profileTable(role);

    const profileResult = await client.query(`SELECT balance FROM ${table} WHERE user_id = $1 FOR UPDATE`, [req.user.id]);
    const balance = Number(profileResult.rows[0]?.balance || 0);
    if (amount > balance) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Requested amount exceeds available balance.' });
    }

    await client.query(`UPDATE ${table} SET balance = balance - $1 WHERE user_id = $2`, [amount, req.user.id]);

    const result = await client.query(
      `INSERT INTO withdrawal_requests (user_id, amount, method, payout_details, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [req.user.id, amount, method, payoutDetails]
    );

    await client.query('COMMIT');
    return res.status(201).json({ withdrawal: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Failed to submit withdrawal request.' });
  } finally {
    client.release();
  }
}

/** GET /api/withdrawals/mine */
async function listMyWithdrawals(req, res) {
  try {
    const result = await db.query('SELECT * FROM withdrawal_requests WHERE user_id = $1 ORDER BY requested_at DESC', [req.user.id]);
    return res.json({ withdrawals: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch withdrawals.' });
  }
}

/** GET /api/withdrawals  (admin — all requests, optionally filtered by status) */
async function listAllWithdrawals(req, res) {
  const { status } = req.query;
  try {
    const query = status
      ? 'SELECT w.*, u.full_name, u.email, u.role FROM withdrawal_requests w JOIN users u ON u.id = w.user_id WHERE w.status = $1 ORDER BY requested_at DESC'
      : 'SELECT w.*, u.full_name, u.email, u.role FROM withdrawal_requests w JOIN users u ON u.id = w.user_id ORDER BY requested_at DESC';
    const result = await db.query(query, status ? [status] : []);
    return res.json({ withdrawals: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch withdrawals.' });
  }
}

/**
 * PUT /api/withdrawals/:id/decision  (admin)
 * body: { decision: 'under_review'|'approved'|'rejected'|'paid', adminNote? }
 * Once 'approved', payment is expected within 48 hours (tracked via approved_at).
 */
async function decideWithdrawal(req, res) {
  const { id } = req.params;
  const { decision, adminNote } = req.body;
  if (!['under_review', 'approved', 'rejected', 'paid'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const withdrawalResult = await client.query('SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE', [id]);
    const withdrawal = withdrawalResult.rows[0];
    if (!withdrawal) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Withdrawal request not found.' });
    }

    // If rejected, refund the balance
    if (decision === 'rejected') {
      const userResult = await client.query('SELECT role FROM users WHERE id = $1', [withdrawal.user_id]);
      const table = profileTable(userResult.rows[0].role);
      await client.query(`UPDATE ${table} SET balance = balance + $1 WHERE user_id = $2`, [withdrawal.amount, withdrawal.user_id]);
    }

    const result = await client.query(
      `UPDATE withdrawal_requests SET
         status = $1, admin_note = $2,
         approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
         processed_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE processed_at END
       WHERE id = $3 RETURNING *`,
      [decision, adminNote || null, id]
    );

    const label = STATUS_LABELS_AR[decision] || decision;
    createNotification(
      withdrawal.user_id,
      'تحديث حالة السحب',
      `طلب سحب $${Number(withdrawal.amount).toFixed(2)}: ${label}${adminNote ? ` — ${adminNote}` : ''}`
    ).catch(() => {});

    await client.query('COMMIT');
    return res.json({ withdrawal: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Failed to update withdrawal.' });
  } finally {
    client.release();
  }
}

module.exports = { requestWithdrawal, listMyWithdrawals, listAllWithdrawals, decideWithdrawal };
