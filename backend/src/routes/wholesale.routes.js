const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/wholesale.controller');

// IMPORTANT: /mine and /search-requests must come before the generic /:id routes below
router.get('/mine', requireAuth, requireRole('admin'), ctrl.listWholesaleProductsAdmin);
router.post('/search-requests', ctrl.createSearchRequest); // public — merchant submits a request
router.get('/search-requests', requireAuth, requireRole('admin'), ctrl.listSearchRequests);
router.put('/search-requests/:id', requireAuth, requireRole('admin'), ctrl.updateSearchRequest);

router.post('/', requireAuth, requireRole('admin'), ctrl.createWholesaleProduct);
router.put('/:id', requireAuth, requireRole('admin'), ctrl.updateWholesaleProduct);
router.delete('/:id', requireAuth, requireRole('admin'), ctrl.deleteWholesaleProduct);

router.get('/telegram-url', ctrl.getTelegramUrl); // public
router.get('/', ctrl.listWholesaleProducts); // public search

module.exports = router;
