/**
 * @version 1.0.0
 * @description 
 */

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  recoverPassword,
  verifyCode,
  resetPassword,
  getMe
} = require('../controllers/authController');

const { protect } = require('../middlewares/auth');
const { 
  registerRules, 
  loginRules, 
  recoverPasswordRules, 
  verifyCodeRules,
  resetPasswordRules,
  validate 
} = require('../middlewares/validation');
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/recover-password', recoverPasswordRules, validate, recoverPassword);
router.post('/verify-code', verifyCodeRules, validate, verifyCode);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;