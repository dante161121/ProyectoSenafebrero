// Middleware de autenticación JWT
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');


exports.protect = async (req, res, next) => {
  let token;

  // Logs mínimos de depuración (pueden deshabilitarse en producción)
  console.log('[auth] Header Authorization:', req.headers.authorization || 'N/A');

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.split(' ')[1];
  }
 
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado para acceder a esta ruta',
      error: 'No se proporcionó token de acceso'
    });
  }

  try {
    const decoded = jwt.verify(token.trim(), config.server.jwtSecret);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para acceder a esta ruta',
        error: 'Usuario no encontrado'
      });
    }

    next();
  } catch (error) {
    console.error('[auth] Error verificando token:', error.message);
    return res.status(401).json({
      success: false,
      message: 'No autorizado para acceder a esta ruta',
      error: error.message
    });
  }
};

// Autoriza según roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado para acceder a esta ruta',
        error: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.tipoUsuario)) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a esta ruta',
        error: `Usuario con rol ${req.user.tipoUsuario} no tiene permiso para esta acción`
      });
    }
    
    next();
  };
};

exports.checkUserOwnership = (req, res, next) => {

  if (req.user.tipoUsuario === 'administrador') {
    return next();
  }
  
  const userId = req.params.id || req.params.userId || req.body.userId;

  if (userId && userId !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'No autorizado para acceder a estos datos',
      error: 'Solo puede acceder a sus propios datos'
    });
  }
  
  next();
};