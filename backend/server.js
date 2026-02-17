// Servidor principal - Proyecto Final SENA
require('dotenv').config();

// Importaciones
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');
const statsRoutes = require('./routes/stats');

// Crear aplicación Express
const app = express();

// Configuración básica
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet()); 
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined')); 

const corsEnabled = process.env.CORS_ENABLED === 'true';
if (corsEnabled) {
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  };
  app.use(cors(corsOptions));
  console.log(` CORS habilitado para: ${corsOptions.origin}`);
}

// Ruta de verificación
app.get('/', (req, res) => {
  res.json({
    message: 'API de IN OUT MANAGER',
    status: 'online',
    environment: NODE_ENV,
    timestamp: new Date()
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/stats', statsRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
app.use(notFoundHandler);
app.use(errorHandler);
mongoose.set('strictQuery', false); 

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log(' Conexión establecida con MongoDB');

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`Ambiente: ${NODE_ENV}`);
  });
})
.catch(err => {
  console.error('Error al conectar con MongoDB:', err.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Conexión con MongoDB cerrada por terminación del servidor');
    process.exit(0);
  });
});