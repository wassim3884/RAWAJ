const express = require('express');
const router = express.Router();
const { requireAuth, requireVerified } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/affiliate.controller');

router.get('/products', requireAuth, requireVerified, requireRole('affiliate'), ctrl.browseProducts);
router.post('/requests', requireAuth, requireVerified, requireRole('affiliate'), ctrl.requestProductApproval);
router.put('/requests/:id/decision', requireAuth, requireRole('admin'), ctrl.decideProductRequest);
router.get('/stats', requireAuth, requireRole('affiliate'), ctrl.getStats);

module.exports = router;
