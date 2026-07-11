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
router.post('/refresh', ctrl.refresh);
router.get('/me', requireAuth, ctrl.me);
router.post('/resend-verification', requireAuth, ctrl.resendVerification);

module.exports = router;
