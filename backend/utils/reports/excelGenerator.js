/**
 * IN OUT MANAGER - GENERADOR DE REPORTES EXCEL
 * @version 1.0.0
 * @description Utilidad para generar reportes en formato Excel
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const config = require('../../config/config');

// Asegurarse de que exista el directorio de descargas
const downloadsDir = path.join(__dirname, '../../', config.paths.downloads);
const reportsDir = path.join(__dirname, '../../', config.paths.reports);

// Crear directorios si no existen
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

/**
 * Genera un reporte Excel de asistencia para un usuario
 * @param {Object} options - Opciones para generar el reporte
 * @param {string} options.userId - ID del usuario
 * @param {Object} options.userData - Datos del usuario
 * @param {Array} options.attendanceData - Registros de asistencia
 * @param {string} options.startDate - Fecha de inicio (opcional)
 * @param {string} options.endDate - Fecha de fin (opcional)
 * @returns {Promise<string>} - Ruta del archivo generado
 */
async function generateAttendanceReport(options) {
  try {
    // Extraer opciones
    const { userId, userData, attendanceData, startDate, endDate } = options;
    
    // Crear workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IN OUT MANAGER';
    workbook.lastModifiedBy = 'Sistema';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Añadir hoja de registros de asistencia
    const worksheet = workbook.addWorksheet('Registros de Asistencia', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    // Añadir encabezado con logo y título
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE ASISTENCIA - IN OUT MANAGER';
    titleCell.font = { size: 16, bold: true, color: { argb: '004488' } };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30;
    
    // Información del usuario
    worksheet.mergeCells('A3:B3');
    worksheet.getCell('A3').value = 'Nombre:';
    worksheet.getCell('A3').font = { bold: true };
    
    worksheet.mergeCells('C3:E3');
    worksheet.getCell('C3').value = userData.nombreCompleto;
    
    worksheet.mergeCells('A4:B4');
    worksheet.getCell('A4').value = 'Documento:';
    worksheet.getCell('A4').font = { bold: true };
    
    worksheet.mergeCells('C4:E4');
    worksheet.getCell('C4').value = userData.numeroDocumento;
    
    worksheet.mergeCells('A5:B5');
    worksheet.getCell('A5').value = 'Cargo:';
    worksheet.getCell('A5').font = { bold: true };
    
    worksheet.mergeCells('C5:E5');
    worksheet.getCell('C5').value = userData.cargo || 'No especificado';
    
    // Período del reporte
    worksheet.mergeCells('F3:G3');
    worksheet.getCell('F3').value = 'Período del reporte:';
    worksheet.getCell('F3').font = { bold: true };
    
    worksheet.mergeCells('F4:H4');
    worksheet.getCell('F4').value = startDate && endDate ? 
      `Del ${new Date(startDate).toLocaleDateString('es-ES')} al ${new Date(endDate).toLocaleDateString('es-ES')}` : 
      'Todos los registros';
    
    // Fecha de generación
    worksheet.mergeCells('F5:G5');
    worksheet.getCell('F5').value = 'Fecha de generación:';
    worksheet.getCell('F5').font = { bold: true };
    
    worksheet.mergeCells('H5:H5');
    worksheet.getCell('H5').value = new Date().toLocaleDateString('es-ES');
    
    // Añadir un espacio antes de la tabla
    worksheet.addRow([]);
    
    // Definir encabezados de tabla
    const headerRow = worksheet.addRow([
      'ID', 'Fecha', 'Hora', 'Tipo', 'Fecha Registro', 'Hora Registro', 'Observaciones'
    ]);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0E0E0' }
    };
    
    // Aplicar bordes a los encabezados
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Añadir datos de asistencia
    attendanceData.forEach((record, index) => {
      const timestamp = new Date(record.timestamp);
      const row = worksheet.addRow([
        record._id.toString(),
        record.date,
        record.time,
        record.type === 'entrada' ? 'Entrada' : 'Salida',
        timestamp.toLocaleDateString('es-ES'),
        timestamp.toLocaleTimeString('es-ES'),
        record.observaciones || ''
      ]);
      
      // Alternar colores de filas
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F9F9F9' }
        };
      }
      
      // Aplicar bordes
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Ajustar anchos de columnas
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Añadir hoja de resumen
    const summarySheet = workbook.addWorksheet('Resumen', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });
    
    // Título del resumen
    summarySheet.mergeCells('A1:D1');
    summarySheet.getCell('A1').value = 'RESUMEN DE ASISTENCIA';
    summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: '004488' } };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };
    summarySheet.getRow(1).height = 30;
    
    // Información del empleado
    summarySheet.mergeCells('A3:B3');
    summarySheet.getCell('A3').value = 'Empleado:';
    summarySheet.getCell('A3').font = { bold: true };
    
    summarySheet.mergeCells('C3:D3');
    summarySheet.getCell('C3').value = userData.nombreCompleto;
    
    // Calcular estadísticas
    const entriesCount = attendanceData.filter(record => record.type === 'entrada').length;
    const exitsCount = attendanceData.filter(record => record.type === 'salida').length;
    
    // Mostrar estadísticas
    summarySheet.mergeCells('A5:B5');
    summarySheet.getCell('A5').value = 'Total registros:';
    summarySheet.getCell('A5').font = { bold: true };
    
    summarySheet.getCell('C5').value = attendanceData.length;
    
    summarySheet.mergeCells('A6:B6');
    summarySheet.getCell('A6').value = 'Registros de entrada:';
    summarySheet.getCell('A6').font = { bold: true };
    
    summarySheet.getCell('C6').value = entriesCount;
    
    summarySheet.mergeCells('A7:B7');
    summarySheet.getCell('A7').value = 'Registros de salida:';
    summarySheet.getCell('A7').font = { bold: true };
    
    summarySheet.getCell('C7').value = exitsCount;
    
    // Generar nombre de archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `asistencia_${userData.nombreCompleto.replace(/\s/g, '_')}_${timestamp}.xlsx`;
    const filePath = path.join(reportsDir, fileName);
    
    // Guardar el workbook
    await workbook.xlsx.writeFile(filePath);
    
    return {
      fileName,
      filePath,
      downloadPath: `downloads/reports/${fileName}`
    };
  } catch (error) {
    console.error('Error generando reporte Excel:', error);
    throw error;
  }
}

/**
 * Genera un reporte Excel de asistencia general (múltiples usuarios)
 * @param {Object} options - Opciones para generar el reporte
 * @param {Array} options.attendanceData - Registros de asistencia con usuario populado
 * @param {string} options.startDate - Fecha de inicio (opcional)
 * @param {string} options.endDate - Fecha de fin (opcional)
 * @returns {Promise<string>} - Ruta del archivo generado
 */
async function generateGeneralAttendanceReport(options) {
  try {
    // Extraer opciones
    const { attendanceData, startDate, endDate } = options;
    
    // Crear workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IN OUT MANAGER';
    workbook.lastModifiedBy = 'Sistema';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Añadir hoja principal
    const worksheet = workbook.addWorksheet('Registros Generales', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    // Añadir encabezado con título
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE GENERAL DE ASISTENCIA - IN OUT MANAGER';
    titleCell.font = { size: 16, bold: true, color: { argb: '004488' } };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30;
    
    // Período del reporte
    worksheet.mergeCells('A3:B3');
    worksheet.getCell('A3').value = 'Período del reporte:';
    worksheet.getCell('A3').font = { bold: true };
    
    worksheet.mergeCells('C3:E3');
    worksheet.getCell('C3').value = startDate && endDate ? 
      `Del ${new Date(startDate).toLocaleDateString('es-ES')} al ${new Date(endDate).toLocaleDateString('es-ES')}` : 
      'Todos los registros';
    
    // Fecha de generación
    worksheet.mergeCells('F3:G3');
    worksheet.getCell('F3').value = 'Fecha de generación:';
    worksheet.getCell('F3').font = { bold: true };
    
    worksheet.getCell('H3').value = new Date().toLocaleDateString('es-ES');
    
    // Total de registros
    worksheet.mergeCells('A4:B4');
    worksheet.getCell('A4').value = 'Total de registros:';
    worksheet.getCell('A4').font = { bold: true };
    
    worksheet.getCell('C4').value = attendanceData.length;
    
    // Añadir un espacio antes de la tabla
    worksheet.addRow([]);
    
    // Definir encabezados de tabla
    const headerRow = worksheet.addRow([
      'ID', 'Empleado', 'Documento', 'Fecha', 'Hora', 'Tipo', 'Observaciones'
    ]);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0E0E0' }
    };
    
    // Aplicar bordes a los encabezados
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Añadir datos de asistencia
    attendanceData.forEach((record, index) => {
      // Obtener datos de usuario (asumiendo que está populado)
      const user = record.userId;
      const nombreEmpleado = user.nombreCompleto || 'Desconocido';
      const documentoEmpleado = user.numeroDocumento || 'N/A';
      
      const row = worksheet.addRow([
        record._id.toString(),
        nombreEmpleado,
        documentoEmpleado,
        record.date,
        record.time,
        record.type === 'entrada' ? 'Entrada' : 'Salida',
        record.observaciones || ''
      ]);
      
      // Alternar colores de filas
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F9F9F9' }
        };
      }
      
      // Aplicar bordes
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });
    
    // Ajustar anchos de columnas
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Generar nombre de archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `reporte_general_asistencia_${timestamp}.xlsx`;
    const filePath = path.join(reportsDir, fileName);
    
    // Guardar el workbook
    await workbook.xlsx.writeFile(filePath);
    
    return {
      fileName,
      filePath,
      downloadPath: `downloads/reports/${fileName}`
    };
  } catch (error) {
    console.error('Error generando reporte Excel general:', error);
    throw error;
  }
}

module.exports = {
  generateAttendanceReport,
  generateGeneralAttendanceReport
};