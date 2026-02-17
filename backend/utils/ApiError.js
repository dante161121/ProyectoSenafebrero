/**
 * @version 1.0.0
 * @description 
 */

class ApiError extends Error {
  /**
   * Constructor para error personalizado
   * @param {string} message 
   * @param {number} statusCode 
   */
  constructor(message, statusCode) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Crear error de validación
   * @param {string} message 
   * @returns {ApiError} 
   */
  static validationError(message = 'Error de validación') {
    return new ApiError(message, 400);
  }
  
  /**
   * Crear error de autenticación
   * @param {string} message 
   * @returns {ApiError} 
   */
  static authError(message = 'No autorizado') {
    return new ApiError(message, 401);
  }
  
  /**
   * Crear error de permisos
   * @param {string} message 
   * @returns {ApiError} 
   */
  static forbidden(message = 'Acceso denegado') {
    return new ApiError(message, 403);
  }
  
  /**
   * Crear error de recurso no encontrado
   * @param {string} entity 
   * @returns {ApiError} 
   */
  static notFound(entity = 'Recurso') {
    return new ApiError(`${entity} no encontrado`, 404);
  }
  
  /**
   * Crear error de servidor
   * @param {string} message 
   * @returns {ApiError} 
   */
  static serverError(message = 'Error interno del servidor') {
    return new ApiError(message, 500);
  }
}

module.exports = ApiError;