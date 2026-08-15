const express = require('express');
const router = express.Router();
const { requireAuth, requireVerified } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/product.controller');
const interestCtrl = require('../controllers/interest.controller');

// Admin only — this is a single-vendor store; only the platform owner adds products.
// IMPORTANT: /mine must be registered BEFORE the /:slug wildcard route below,
// otherwise Express would match "mine" as a product slug.
router.get('/mine', requireAuth, requireRole('admin'), ctrl.listMyProducts);
router.post('/', requireAuth, requireRole('admin'), ctrl.createProduct);
router.put('/:id', requireAuth, requireRole('admin'), ctrl.updateProduct);
router.delete('/:id', requireAuth, requireRole('admin'), ctrl.deleteProduct);

router.put('/:id/marketing', requireAuth, requireRole('admin'), ctrl.upsertMarketingAssets);
router.get('/:id/marketing', requireAuth, requireVerified, ctrl.getMarketingAssets);

router.post('/:id/interest', requireAuth, requireVerified, requireRole('affiliate'), interestCtrl.markInterest);
router.delete('/:id/interest', requireAuth, requireRole('affiliate'), interestCtrl.unmarkInterest);
router.post('/:id/notify-restock', requireAuth, requireVerified, requireRole('affiliate'), interestCtrl.subscribeRestock);

router.get('/upcoming', requireAuth, requireVerified, requireRole('affiliate'), ctrl.listUpcomingProducts);

// Product browsing requires a logged-in, verified account — no public catalog access.
router.get('/', requireAuth, requireVerified, ctrl.listProducts);
router.get('/:slug', requireAuth, requireVerified, ctrl.getProductBySlug);

module.exports = router;
