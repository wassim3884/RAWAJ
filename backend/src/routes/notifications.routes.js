const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');

router.get('/', requireAuth, ctrl.listMyNotifications);
router.put('/:id/read', requireAuth, ctrl.markAsRead);

module.exports = router;
