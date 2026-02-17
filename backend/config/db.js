/**
 * @version 1.0.0
 * @description 
 */

const mongoose = require('mongoose');

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true 
};

/**
 * @returns {Promise} 
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    
    console.log(` MongoDB conectado: ${conn.connection.host}`);
    console.log(` Base de datos: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(` Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};


const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log(' Conexión a MongoDB cerrada correctamente');
  } catch (error) {
    console.error(` Error al cerrar la conexión: ${error.message}`);
  }
};

/**
 * @returns {Boolean} 
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1; 
};

module.exports = {
  connectDB,
  closeConnection,
  isConnected
};