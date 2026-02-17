/**
 * @version 1.0.0
 * @description 
 */

const mongoose = require('mongoose');
const config = require('../config/config');
mongoose.set('strictQuery', false);
const User = require('../models/User');
const WorkSession = require('../models/WorkSession');
const DailyStats = require('../models/DailyStats');
const Attendance = require('../models/Attendance');
const Audit = require('../models/Audit');

/**
 * Función para verificar el estado de la base de datos
 */
async function verifyDatabase() {
  try {
    console.log('Conectando a MongoDB...');
    
    //  onectar a la base de datos
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conectado a MongoDB exitosamente');
    console.log('');

    // Obtener estadísticas de las colecciones
    const userCount = await User.countDocuments();
    const workSessionCount = await WorkSession.countDocuments();
    const dailyStatsCount = await DailyStats.countDocuments();
    const attendanceCount = await Attendance.countDocuments();
    const auditCount = await Audit.countDocuments();

    console.log('ESTADO ACTUAL DE LA BASE DE DATOS:');
    console.log('=====================================');
    console.log(`Usuarios: ${userCount}`);
    console.log(`Sesiones de trabajo: ${workSessionCount}`);
    console.log(`Estadísticas diarias: ${dailyStatsCount}`);
    console.log(`Asistencias: ${attendanceCount}`);
    console.log(`Auditorías: ${auditCount}`);
    console.log('');

    const totalRecords = userCount + workSessionCount + dailyStatsCount + attendanceCount + auditCount;

    if (totalRecords === 0) {
      console.log('🎉 ¡BASE DE DATOS COMPLETAMENTE LIMPIA!');
      console.log('   No hay datos almacenados en ninguna colección');
    } else {
      console.log(`Total de registros en la base de datos: ${totalRecords}`);
      
      if (userCount > 0) {
        console.log('');
        console.log(' USUARIOS ENCONTRADOS:');
        const users = await User.find({}, 'nombreCompleto numeroDocumento correoElectronico').limit(10);
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.nombreCompleto} (${user.numeroDocumento}) - ${user.correoElectronico}`);
        });
        if (userCount > 10) {
          console.log(`   ... y ${userCount - 10} usuarios más`);
        }
      }
    }

  } catch (error) {
    console.error('Error durante la verificación de la base de datos:', error);
    process.exit(1);
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('');
    console.log('Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar verificación
verifyDatabase();