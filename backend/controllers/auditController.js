// Controlador de auditoría
// Registra acciones de usuarios

const Audit = require('../models/Audit');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/responseHandler');

// Obtener logs de auditoría
  try {n
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const filter = {};

    if (req.query.entidad) {
      filter.entidad = req.query.entidad;
    }

    if (req.query.entidadId) {
      filter.entidadId = req.query.entidadId;
    }

    if (req.query.accion) {
      filter.accion = req.query.accion;
    }

    if (req.query.usuarioId) {
      filter.usuarioId = req.query.usuarioId;
    }

    if (req.query.fechaInicio || req.query.fechaFin) {
      filter.timestamp = {};
      
      if (req.query.fechaInicio) {
        filter.timestamp.$gte = new Date(req.query.fechaInicio);
      }
      
      if (req.query.fechaFin) {
        filter.timestamp.$lte = new Date(req.query.fechaFin);
      }
    }
    

    const logs = await Audit.find(filter)
      .sort({ timestamp: -1 }) 
      .skip(startIndex)
      .limit(limit)
      .populate('usuarioId', 'nombreCompleto tipoUsuario');

    const total = await Audit.countDocuments(filter);

    const pagination = {
      total,
      limit,
      page,
      pages: Math.ceil(total / limit)
    };
    
    return success(res, { 
      logs, 
      pagination 
    }, 'Registros de auditoría obtenidos correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc   
 * @route   
 * @access 
 */
exports.getEntityAuditLogs = async (req, res, next) => {
  try {
    const { entidad, entidadId } = req.params;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const logs = await Audit.find({
      entidad,
      entidadId
    })
      .sort({ timestamp: -1 }) // Más recientes primero
      .skip(startIndex)
      .limit(limit)
      .populate('usuarioId', 'nombreCompleto tipoUsuario');
    const total = await Audit.countDocuments({
      entidad,
      entidadId
    });

    const pagination = {
      total,
      limit,
      page,
      pages: Math.ceil(total / limit)
    };
    
    return success(res, { 
      logs, 
      pagination 
    }, `Historial de auditoría para ${entidad} ${entidadId}`);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    
 * @route  
 * @access 
 */
exports.getAuditLogById = async (req, res, next) => {
  try {
    const log = await Audit.findById(req.params.id)
      .populate('usuarioId', 'nombreCompleto tipoUsuario correoElectronico');
    
    if (!log) {
      return next(ApiError.notFound('Registro de auditoría'));
    }
    
    return success(res, { log }, 'Detalle de registro de auditoría');
  } catch (err) {
    next(err);
  }
};