const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/withdrawal.controller');

router.post('/', requireAuth, requireRole('affiliate'), ctrl.requestWithdrawal);
router.get('/mine', requireAuth, requireRole('affiliate'), ctrl.listMyWithdrawals);
router.get('/', requireAuth, requireRole('admin'), ctrl.listAllWithdrawals);
router.put('/:id/decision', requireAuth, requireRole('admin'), ctrl.decideWithdrawal);

module.exports = router;
