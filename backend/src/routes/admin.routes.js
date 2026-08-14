const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const ctrl = require('../controllers/admin.controller');
const vipCtrl = require('../controllers/vip.controller');

router.use(requireAuth, requireRole('admin'));

router.get('/users', ctrl.listUsers);
router.put('/users/:id/status', ctrl.setUserStatus);

router.get('/products', ctrl.listProductsForModeration);
router.put('/products/:id/status', ctrl.setProductStatus);

router.get('/analytics', ctrl.getAnalytics);

router.post('/categories', ctrl.createCategory);
router.get('/categories', ctrl.listCategories);

router.get('/settings/:key', ctrl.getSiteSetting);
router.put('/settings/:key', ctrl.updateSiteSetting);

router.get('/vip/eligible', vipCtrl.listEligibleAffiliates);
router.put('/vip/resources', vipCtrl.updateResources);
router.put('/vip/:affiliateId', vipCtrl.setVipStatus);

module.exports = router;
