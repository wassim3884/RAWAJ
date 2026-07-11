const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/vip.controller');

router.get('/eligibility', requireAuth, requireRole('affiliate'), ctrl.getEligibility);
router.get('/store', requireAuth, requireRole('affiliate'), ctrl.getMyStore);
router.put('/store', requireAuth, requireRole('affiliate'), ctrl.upsertMyStore);
router.get('/resources', requireAuth, requireRole('affiliate'), ctrl.getResources);

module.exports = router;
