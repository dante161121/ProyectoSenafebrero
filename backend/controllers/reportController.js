// Controlador de reportes

const path = require('path');
const fs = require('fs');
const ExcelGenerator = require('../utils/reports/excelGenerator');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const config = require('../config/config');

/**
 
 * @param {Request} req 
 * @param {Response} res 
 */
async function generateUserReport(req, res) {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Usuario no encontrado' 
      });
    }

    const query = { userId: userId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendanceRecords = await Attendance.find(query).sort({ date: 1, time: 1 });
    
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ 
        success: false, 
        msg: 'No hay registros de asistencia para el período especificado' 
      });
    }

    const userData = {
      nombreCompleto: user.nombreCompleto,
      numeroDocumento: user.numeroDocumento,
      cargo: user.cargo
    };

    const reportInfo = await ExcelGenerator.generateAttendanceReport({
      userId: userId,
      userData: userData,
      attendanceData: attendanceRecords,
      startDate,
      endDate
    });

    res.status(200).json({
      success: true,
      msg: 'Reporte generado exitosamente',
      data: {
        reportUrl: `/api/${reportInfo.downloadPath}`,
        fileName: reportInfo.fileName
      }
    });
  } catch (error) {
    console.error('Error generando reporte de usuario:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al generar el reporte',
      error: error.message
    });
  }
}

/**

 * @param {Request} req 
 * @param {Response} res 
 */
async function generateGeneralReport(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    // Obtener registros de asistencia populados con datos de usuario
    const attendanceRecords = await Attendance.find(query)
                                             .populate('userId', 'nombreCompleto numeroDocumento cargo')
                                             .sort({ date: 1, time: 1 });
    
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ 
        success: false, 
        msg: 'No hay registros de asistencia para el período especificado' 
      });
    }
    
    // Generar reporte de excel
    const reportInfo = await ExcelGenerator.generateGeneralAttendanceReport({
      attendanceData: attendanceRecords,
      startDate,
      endDate
    });
    
    res.status(200).json({
      success: true,
      msg: 'Reporte general generado exitosamente',
      data: {
        reportUrl: `/api/${reportInfo.downloadPath}`,
        fileName: reportInfo.fileName
      }
    });
  } catch (error) {
    console.error('Error generando reporte general:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al generar el reporte general',
      error: error.message
    });
  }
}

/**
 * @param {Request} req 
 * @param {Response} res 
 */
function downloadReport(req, res) {
  try {
    const { fileName } = req.params;

    if (!fileName || !fileName.endsWith('.xlsx')) {
      return res.status(400).json({
        success: false,
        msg: 'Nombre de archivo inválido'
      });
    }
    
    // Ruta al archivo
    const filePath = path.join(__dirname, '../', config.paths.reports, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        msg: 'Archivo no encontrado'
      });
    }

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        res.status(500).json({
          success: false,
          msg: 'Error al descargar el archivo',
          error: err.message
        });
      }
    });
  } catch (error) {
    console.error('Error en descarga de reporte:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Error al procesar la descarga',
      error: error.message
    });
  }
}

module.exports = {
  generateUserReport,
  generateGeneralReport,
  downloadReport
};