const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/push.controller');

router.get('/vapid-public-key', ctrl.getPublicKey);
router.post('/subscribe', requireAuth, ctrl.subscribe);
router.post('/unsubscribe', requireAuth, ctrl.unsubscribe);

module.exports = router;
