const express = require('express');
const router = express.Router();
const { requireAuth, requireVerified } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/wishlist.controller');

router.get('/', requireAuth, requireRole('affiliate'), ctrl.listMyWishlist);
router.post('/:productId', requireAuth, requireVerified, requireRole('affiliate'), ctrl.addToWishlist);
router.delete('/:productId', requireAuth, requireRole('affiliate'), ctrl.removeFromWishlist);

module.exports = router;
