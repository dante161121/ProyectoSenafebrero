/**
 * @version 1.0.0
 * @description 
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
// Permite procesar formularios form-data sin archivos (ej. Postman form-data)
const parseFormData = multer().none();

// Parsers combinados para aceptar JSON, x-www-form-urlencoded y form-data
const bodyParsers = [
  express.json(),
  express.urlencoded({ extended: true }),
  parseFormData,
  // Intenta parsear texto plano que contenga JSON
  (req, _res, next) => {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch (_e) {
        // si no es JSON, se deja tal cual
      }
    }
    next();
  }
];

// Normaliza campos comunes que llegan con nombres distintos (email/correo, nombre, documento)
const normalizeAuthFields = (req, _res, next) => {
  if (req.body) {
    // Email
    if (!req.body.correoElectronico) {
      req.body.correoElectronico = req.body.email || req.body.correo || req.body.user || req.body.username;
    }
    // Password
    if (!req.body.password && req.body.pass) {
      req.body.password = req.body.pass;
    }
    // Nombre completo
    if (!req.body.nombreCompleto) {
      req.body.nombreCompleto = req.body.nombre || req.body.fullName || req.body.nombre_usuario;
    }
    // Documento
    if (!req.body.numeroDocumento) {
      req.body.numeroDocumento = req.body.documento || req.body.doc || req.body.cc;
    }
  }
  next();
};

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
router.post('/register', bodyParsers, normalizeAuthFields, registerRules, validate, register);
router.post('/login', bodyParsers, normalizeAuthFields, loginRules, validate, login);
router.post('/recover-password', bodyParsers, normalizeAuthFields, recoverPasswordRules, validate, recoverPassword);
router.post('/verify-code', bodyParsers, normalizeAuthFields, verifyCodeRules, validate, verifyCode);
router.post('/reset-password', bodyParsers, normalizeAuthFields, resetPasswordRules, validate, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;