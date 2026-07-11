const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/wholesale.controller');

// IMPORTANT: /mine must come before the public GET / to avoid route ambiguity
router.get('/mine', requireAuth, requireRole('admin'), ctrl.listWholesaleProductsAdmin);
router.post('/', requireAuth, requireRole('admin'), ctrl.createWholesaleProduct);
router.put('/:id', requireAuth, requireRole('admin'), ctrl.updateWholesaleProduct);
router.delete('/:id', requireAuth, requireRole('admin'), ctrl.deleteWholesaleProduct);

router.get('/telegram-url', ctrl.getTelegramUrl); // public
router.get('/', ctrl.listWholesaleProducts); // public search

module.exports = router;
