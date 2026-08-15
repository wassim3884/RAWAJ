const express = require('express');
const router = express.Router();
const { requireAuth, requireVerified } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/order.controller');

router.post('/', requireAuth, requireVerified, requireRole('affiliate'), ctrl.createOrder);
router.get('/mine', requireAuth, requireRole('affiliate'), ctrl.listMyOrders);
router.get('/', requireAuth, requireRole('admin'), ctrl.listAllOrders);
router.get('/:orderNumber/track', ctrl.trackOrder);
router.put('/:id/status', requireAuth, requireRole('admin'), ctrl.updateOrderStatus);

module.exports = router;
