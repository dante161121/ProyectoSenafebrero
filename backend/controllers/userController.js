// Controlador de usuarios
// Autor: Desarrollo SENA

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { success, error, notFound, validationError } = require('../utils/responseHandler');
const AuditService = require('../services/auditService');

// Obtener todos los usuarios
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const filter = {};

    if (req.query.mostrarInactivos === 'true') {
    } else if (req.query.mostrarInactivos === 'false') {
      filter.activo = true;
    } else {
      filter.activo = true;
    }
    
    if (req.query.tipoUsuario) {
      filter.tipoUsuario = req.query.tipoUsuario;
    }
    
    if (req.query.search) {
      filter.$or = [
        { nombreCompleto: { $regex: req.query.search, $options: 'i' } },
        { correoElectronico: { $regex: req.query.search, $options: 'i' } },
        { numeroDocumento: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    const users = await User.find(filter)
      .select('-password')
      .limit(limit)
      .skip(startIndex)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    const pagination = {
      total,
      limit,
      page,
      pages: Math.ceil(total / limit)
    };

    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      data: users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * @desc   
 * @route   
 * @access  
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido',
        error: 'ID no válido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * @desc   
 * @route   
 * @access 
 */
exports.updateUser = async (req, res, next) => {
  try {
    const allowedUpdates = [
      'nombreCompleto', 
      'edad', 
      'cargo', 
      'horarioAsignado'
    ];

    if (req.user.tipoUsuario === 'administrador') {
      allowedUpdates.push('tipoUsuario');
    }

    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const userAnterior = await User.findById(req.params.id).select('-password');
    
    if (!userAnterior) {
      return next(ApiError.notFound('Usuario'));
    }
r
    const userNuevo = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    const AuditService = require('../services/auditService');
    await AuditService.registrarCambios(
      req.user, 
      'usuario', 
      userNuevo._id, 
      userAnterior.toObject(), 
      userNuevo.toObject(), 
      req
    );

    return success(res, { user: userNuevo }, 'Usuario actualizado correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc   
 * @route  
 * @access 
 */
exports.updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha subido ninguna imagen'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const fotoPerfil = `profiles/${req.file.filename}`;
    user.fotoPerfil = fotoPerfil;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Foto de perfil actualizada correctamente',
      data: {
        fotoPerfil
      }
    });
  } catch (error) {
    console.error('Error al actualizar foto de perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar foto de perfil',
      error: error.message
    });
  }
};

/**
 * @desc   
 * @route  
 * @access  
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(ApiError.notFound('Usuario'));
    }

    if (!user.activo) {
      return next(ApiError.validationError('El usuario ya se encuentra desactivado'));
    }

    user.activo = false;
    user.fechaDesactivacion = new Date();
    await user.save();

    await AuditService.registrarAccion(
      req.user,
      'usuario',
      user._id,
      'cambiar_estado',
      {
        estadoAnterior: true,
        estadoNuevo: false,
        fechaDesactivacion: user.fechaDesactivacion
      },
      req
    );

    return success(res, null, 'Usuario desactivado correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    
 * @route   
 * @access  
 */
exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(ApiError.notFound('Usuario'));
    }
    
    if (user.activo) {
      return next(ApiError.validationError('El usuario ya se encuentra activo'));
    }
 
    user.activo = true;
    user.fechaDesactivacion = null;
    await user.save();

    await AuditService.registrarAccion(
      req.user,
      'usuario',
      user._id,
      'cambiar_estado',
      {
        estadoAnterior: false,
        estadoNuevo: true,
        fechaReactivacion: new Date()
      },
      req
    );

    return success(res, null, 'Usuario activado correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    
 * @route  
 * @access 
 */
exports.getCurrentUser = async (req, res, next) => {
  try {

    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return next(ApiError.notFound('Usuario'));
    }

    return success(res, { user }, 'Perfil de usuario obtenido correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    
 * @route   
 * @access 
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere contraseña actual y nueva'
      });
    }

    const user = await User.findById(req.params.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (req.user.tipoUsuario !== 'administrador') {
      const isMatch = await user.matchPassword(currentPassword);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};