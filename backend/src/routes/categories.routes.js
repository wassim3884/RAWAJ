const express = require('express');
const router = express.Router();
const { requireAuth, requireVerified } = require('../middleware/auth');
const admin = require('../controllers/admin.controller');

// Categories are part of the gated product catalog — requires a verified login.
router.get('/', requireAuth, requireVerified, admin.listCategories);

module.exports = router;
