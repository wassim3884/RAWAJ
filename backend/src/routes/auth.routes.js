const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').matches(/^0[567]\d{8}$/).withMessage('رقم الهاتف يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكوّن من 10 أرقام.'),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  ctrl.login
);

router.get('/verify-email', ctrl.verifyEmail);
router.post('/resend-verification', requireAuth, ctrl.resendVerification);
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  ctrl.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  ctrl.resetPassword
);
router.post('/refresh', ctrl.refresh);
router.get('/me', requireAuth, ctrl.me);

router.put(
  '/me',
  requireAuth,
  [
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().matches(/^0[567]\d{8}$/).withMessage('رقم الهاتف يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكوّن من 10 أرقام.'),
  ],
  validate,
  ctrl.updateProfile
);

router.put(
  '/me/password',
  requireAuth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  ctrl.changePassword
);

router.delete(
  '/me',
  requireAuth,
  [body('password').notEmpty().withMessage('Password confirmation is required')],
  validate,
  ctrl.deleteOwnAccount
);

module.exports = router;
