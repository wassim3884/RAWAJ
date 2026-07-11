const db = require('../config/db');

/** GET /api/wilayas — public/affiliate: list all active wilayas with delivery fees */
async function listWilayas(req, res) {
  try {
    const result = await db.query(
      `SELECT id, code, name_ar, name_fr, delivery_fee_home, delivery_fee_office
       FROM wilayas WHERE is_active = TRUE ORDER BY code`
    );
    return res.json({ wilayas: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch wilayas.' });
  }
}

/** POST /api/wilayas — admin: add a wilaya */
async function createWilaya(req, res) {
  const { code, nameAr, nameFr, deliveryFeeHome, deliveryFeeOffice } = req.body;
  if (!nameAr || !nameFr) return res.status(400).json({ error: 'nameAr and nameFr are required.' });
  try {
    const result = await db.query(
      `INSERT INTO wilayas (code, name_ar, name_fr, delivery_fee_home, delivery_fee_office)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [code || null, nameAr, nameFr, deliveryFeeHome || 0, deliveryFeeOffice || 0]
    );
    return res.status(201).json({ wilaya: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create wilaya.' });
  }
}

/** PUT /api/wilayas/:id — admin: update delivery fees for a wilaya */
async function updateWilaya(req, res) {
  const { id } = req.params;
  const { deliveryFeeHome, deliveryFeeOffice, isActive } = req.body;
  try {
    const result = await db.query(
      `UPDATE wilayas SET
         delivery_fee_home = COALESCE($1, delivery_fee_home),
         delivery_fee_office = COALESCE($2, delivery_fee_office),
         is_active = COALESCE($3, is_active)
       WHERE id = $4 RETURNING *`,
      [deliveryFeeHome, deliveryFeeOffice, isActive, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Wilaya not found.' });
    return res.json({ wilaya: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update wilaya.' });
  }
}

module.exports = { listWilayas, createWilaya, updateWilaya };
