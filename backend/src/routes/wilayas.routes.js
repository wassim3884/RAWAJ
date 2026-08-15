const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/wilaya.controller');

router.get('/all', requireAuth, requireRole('admin'), ctrl.listAllWilayasAdmin);
router.get('/', ctrl.listWilayas); // public + affiliate — needed to quote delivery fees to buyers
router.post('/', requireAuth, requireRole('admin'), ctrl.createWilaya);
router.put('/:id', requireAuth, requireRole('admin'), ctrl.updateWilaya);

module.exports = router;
