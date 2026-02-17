// Middleware de control de roles
// FIXME: Revisar lógica de roles con tipoUsuario

// Verifica si es admin
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        msg: 'No autorizado'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        msg: 'Acceso denegado. Se requiere rol de administrador'
      });
    }

    next();
  } catch (error) {
    console.error('Error en verificación de rol admin:', error);
    res.status(500).json({
      success: false,
      msg: 'Error al verificar permisos',
      error: error.message
    });
  }
};

// Middleware para verificar roles específicos
const hasRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          msg: 'No autorizado'
        });
      }
      
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          msg: 'Acceso denegado. No tiene los permisos necesarios'
        });
      }

      next();
    } catch (error) {
      console.error('Error en verificación de roles:', error);
      res.status(500).json({
        success: false,
        msg: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

/**

 * @param {Function} getResourceUserId 
 * @returns {Function} 
 */
const isOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          msg: 'No autorizado'
        });
      }

      if (req.user.role === 'admin') {
        return next();
      }
      const resourceUserId = await getResourceUserId(req);
      if (!resourceUserId) {
        return res.status(403).json({
          success: false,
          msg: 'Acceso denegado. Recurso no encontrado o sin propietario'
        });
      }

      if (resourceUserId.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          success: false,
          msg: 'Acceso denegado. No es propietario del recurso'
        });
      }

      next();
    } catch (error) {
      console.error('Error en verificación de propietario:', error);
      res.status(500).json({
        success: false,
        msg: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

module.exports = {
  isAdmin,
  hasRole,
  isOwnerOrAdmin
};