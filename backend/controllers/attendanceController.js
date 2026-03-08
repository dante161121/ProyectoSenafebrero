// Controlador de asistencia
// Proyecto Final SENA

const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Registrar entrada/salida
exports.registerAttendance = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user._id;
    if (!['entrada', 'salida'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de registro inválido. Debe ser "entrada" o "salida"'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const existingRecord = await Attendance.findOne({
      userId,
      type,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: `Ya ha registrado su ${type} de hoy`
      });
    }

    const attendance = new Attendance({
      userId,
      type,
      timestamp: new Date(),
      date: today.toLocaleDateString('es-ES'),
      time: new Date().toLocaleTimeString('es-ES')
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: `Registro de ${type} exitoso`,
      data: attendance
    });
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar asistencia',
      error: error.message
    });
  }
};

/**
 * @desc    
 * @route   
 * @access  
 */
exports.getUserAttendance = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30; 
    const startIndex = (page - 1) * limit;

    let dateFilter = {};
    
    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999); // Fin del día
      
      dateFilter = {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      };
    } else if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      dateFilter = {
        timestamp: {
          $gte: startDate
        }
      };
    } else if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999); // Fin del día
      
      dateFilter = {
        timestamp: {
          $lte: endDate
        }
      };
    }

    const typeFilter = req.query.type ? { type: req.query.type } : {};

    const filter = {
      userId,
      ...dateFilter,
      ...typeFilter
    };

    const attendanceRecords = await Attendance.find(filter)
      .sort({ timestamp: -1 }) 
      .limit(limit)
      .skip(startIndex);

    const total = await Attendance.countDocuments(filter);

    const pagination = {
      total,
      limit,
      page,
      pages: Math.ceil(total / limit)
    };

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      pagination,
      data: attendanceRecords
    });
  } catch (error) {
    console.error('Error al obtener registros de asistencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros de asistencia',
      error: error.message
    });
  }
};

/**
 * @desc   
 * @route   
 * @access  
 */
exports.getWeeklyStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const attendanceRecords = await Attendance.find({
      userId,
      timestamp: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    }).sort({ timestamp: 1 });

    const stats = processWeeklyStats(attendanceRecords);
    
    res.status(200).json({
      success: true,
      data: stats,
      meta: {
        startOfWeek: startOfWeek.toISOString(),
        endOfWeek: endOfWeek.toISOString()
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas semanales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas semanales',
      error: error.message
    });
  }
};

/**
 * @desc    
 * @route   
 * @access 
 */
exports.getMonthlyStats = async (req, res) => {
  try {
    const userId = req.params.userId;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      userId,
      timestamp: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).sort({ timestamp: 1 });

    const stats = processMonthlyStats(attendanceRecords, today.getMonth(), today.getFullYear());
    
    res.status(200).json({
      success: true,
      data: stats,
      meta: {
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString(),
        month: today.getMonth() + 1,
        year: today.getFullYear()
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas mensuales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas mensuales',
      error: error.message
    });
  }
};

/**
 * @desc   
 * @route   
 * @access  
 */
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Registro de asistencia no encontrado'
      });
    }

    await attendance.remove();

    res.status(200).json({
      success: true,
      message: 'Registro de asistencia eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar registro de asistencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar registro de asistencia',
      error: error.message
    });
  }
};

/**
 * @desc   
 * @route   
 * @access  
 */
exports.getAllAttendance = async (req, res) => {
  try {

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const startIndex = (page - 1) * limit;

    let filter = {};

    if (req.query.userId) {
      filter.userId = req.query.userId;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      filter.timestamp = {
        $gte: startDate,
        $lte: endDate
      };
    } else if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      filter.timestamp = { $gte: startDate };
    } else if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.timestamp = { $lte: endDate };
    }

    const attendanceRecords = await Attendance.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(startIndex)
      .populate('userId', 'nombreCompleto numeroDocumento'); // Traer datos del usuario

    const total = await Attendance.countDocuments(filter);

    const pagination = {
      total,
      limit,
      page,
      pages: Math.ceil(total / limit)
    };

    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      pagination,
      data: attendanceRecords
    });
  } catch (error) {
    console.error('Error al obtener registros de asistencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros de asistencia',
      error: error.message
    });
  }
};



/**
 * @param {Array} records 
 */
function processWeeklyStats(records) {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const entriesData = Array(7).fill(0);
  const exitsData = Array(7).fill(0);
  const workHoursData = Array(7).fill(0);

  const recordsByDay = {};
  
  records.forEach(record => {
    const date = new Date(record.timestamp);
    const dayOfWeek = date.getDay(); 
    
    if (!recordsByDay[dayOfWeek]) {
      recordsByDay[dayOfWeek] = { entries: [], exits: [] };
    }
    
    if (record.type === 'entrada') {
      recordsByDay[dayOfWeek].entries.push(record);
    } else {
      recordsByDay[dayOfWeek].exits.push(record);
    }
  });
  
  for (let i = 0; i < 7; i++) {
    if (recordsByDay[i]) {
      entriesData[i] = recordsByDay[i].entries.length;
      exitsData[i] = recordsByDay[i].exits.length;
      workHoursData[i] = Math.min(entriesData[i], exitsData[i]) * 8;
    }
  }
  
  return {
    labels: dayNames,
    datasets: {
      entries: entriesData,
      exits: exitsData,
      workHours: workHoursData
    }
  };
}

/**

 * @param {Array} records 
 * @param {Number} month 
 * @param {Number} year - Año
 */
function processMonthlyStats(records, month, year) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1); // [1, 2, ..., 30/31]
  const entriesData = Array(daysInMonth).fill(0);
  const exitsData = Array(daysInMonth).fill(0);
  const workHoursData = Array(daysInMonth).fill(0);

  const recordsByDay = {};
  
  records.forEach(record => {
    const date = new Date(record.timestamp);
    const dayOfMonth = date.getDate(); // 1-31
    
    if (!recordsByDay[dayOfMonth]) {
      recordsByDay[dayOfMonth] = { entries: [], exits: [] };
    }
    
    if (record.type === 'entrada') {
      recordsByDay[dayOfMonth].entries.push(record);
    } else {
      recordsByDay[dayOfMonth].exits.push(record);
    }
  });

  for (let i = 1; i <= daysInMonth; i++) {
    if (recordsByDay[i]) {
      entriesData[i - 1] = recordsByDay[i].entries.length;
      exitsData[i - 1] = recordsByDay[i].exits.length;

      workHoursData[i - 1] = Math.min(entriesData[i - 1], exitsData[i - 1]) * 8;
    }
  }
  
  return {
    labels,
    datasets: {
      entries: entriesData,
      exits: exitsData,
      workHours: workHoursData
    }
  };
}