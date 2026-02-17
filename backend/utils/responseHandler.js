/**
 * @version 1.0.0
 * @description 
 */

/**
 * Envía una respuesta exitosa
 * @param {Object} res 
 * @param {Object} data 
 * @param {string} message 
 * @param {number} statusCode 
 */
exports.success = (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Envía una respuesta de error
 * @param {Object} res 
 * @param {string} message 
 * @param {Object} error 
 * @param {number} statusCode 
 */
exports.error = (res, message = 'Error en la operación', error = {}, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? {} : error
  });
};

/**
 * Respuesta para recurso no encontrado
 * @param {Object} res
 * @param {string} entity 
 */
exports.notFound = (res, entity = 'Recurso') => {
  return res.status(404).json({
    success: false,
    message: `${entity} no encontrado`
  });
};

/**
 * Respuesta para errores de validación
 * @param {Object} res 
 * @param {Array} errors 
 */
exports.validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Error de validación',
    errors
  });
};

/**
 * Respuesta para errores de autenticación
 * @param {Object} res 
 * @param {string} message 
 */
exports.authError = (res, message = 'No autorizado') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Respuesta para errores de permisos
 * @param {Object} res 
 * @param {string} message 
 */
exports.forbidden = (res, message = 'Acceso denegado') => {
  return res.status(403).json({
    success: false,
    message
  });
};