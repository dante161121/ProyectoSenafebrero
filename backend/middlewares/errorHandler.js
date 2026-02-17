// Manejo centralizado de errores

const { error } = require('../utils/responseHandler');
const mongoose = require('mongoose');

const errorHandler = (err, req, res, next) => {
  console.error('ERROR:', err);

  let statusCode = 500;
  let message = 'Error interno del servidor';
  let errorDetails = {};

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
    errorDetails = Object.values(err.errors).map(e => e.message);
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Error de duplicación';
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    errorDetails = `Ya existe un registro con el campo ${field}: ${value}`;
  } else if (err.name === 'JsonWebTokenError') {

    statusCode = 401;
    message = 'Token de autenticación inválido';
  } else if (err.name === 'TokenExpiredError') {

    statusCode = 401;
    message = 'Token de autenticación expirado';
  } else if (err instanceof mongoose.Error.CastError) {

    statusCode = 400;
    message = 'ID inválido';
    errorDetails = `${err.path}: ${err.value} no es un ID válido`;
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  return error(res, message, errorDetails, statusCode);
};

// Handler para rutas no encontradas
const notFoundHandler = (req, res, next) => {
  return error(res, 'Ruta no encontrada', { url: req.originalUrl }, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler
};