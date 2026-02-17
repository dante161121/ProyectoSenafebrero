/**
 * IN OUT MANAGER - CONFIGURACIÓN GENERAL
 * @version 1.0.0
 * @description Archivo de configuración general para el backend
 */

// Cargar variables de entorno
require('dotenv').config();

module.exports = {
  // Configuración de servidor
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'inoutmanager_secret',
    jwtExpire: process.env.JWT_EXPIRE || '24h'
  },
  
  // Configuración de MongoDB
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/inoutmanager'
  },
  
  // Configuración de CORS
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN || '*'
  },
  
  // Configuración de paths de la aplicación
  paths: {
    uploads: './uploads',
    downloads: './downloads',
    reports: './downloads/reports'
  },
  
  // Configuración de reportes
  reports: {
    attendanceHeaders: [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Usuario', key: 'userName', width: 25 },
      { header: 'Tipo', key: 'type', width: 15 },
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Hora', key: 'time', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 20 }
    ]
  }
};