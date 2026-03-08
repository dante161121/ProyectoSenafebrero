// Controlador de autenticación
// Autor: Aprendiz SENA

const User = require('../models/User');
const crypto = require('crypto');
const config = require('../config/config');

const recoveryCodes = {};

// Registro de nuevos usuarios
exports.register = async (req, res) => {
  try {
    console.log(' === INICIO REGISTRO ===');
    console.log(' Body recibido:', JSON.stringify(req.body, null, 2));
    
    const { 
      nombreCompleto, 
      numeroDocumento, 
      correoElectronico, 
      password,
      tipoUsuario,
      codigoAdmin,
      edad,
      cargo,
      horarioAsignado,
      telefono,
      direccion,
      fechaIngreso,
      departamento
    } = req.body;

    console.log(' Datos extraídos:', {
      nombreCompleto,
      numeroDocumento,
      correoElectronico,
      password: password ? '***' : undefined,
      tipoUsuario,
      edad,
      cargo,
      horarioAsignado,
      telefono,
      direccion,
      fechaIngreso,
      departamento,
      codigoAdmin
    });

  
    console.log(' Verificando si existe usuario...');
    let user = await User.findOne({ 
      $or: [
        { numeroDocumento },
        { correoElectronico }
      ]
    });

    if (user) {
      console.log(' Usuario ya existe:', user.correoElectronico);
      return res.status(400).json({
        success: false,
        message: 'Ya existe un usuario con ese documento o correo electrónico'
      });
    }

    console.log(' Usuario no existe, procediendo a crear...');

    const userData = {
      nombreCompleto,
      numeroDocumento,
      correoElectronico,
      password,
      tipoUsuario: tipoUsuario || 'empleado',
      edad,
      cargo,
      horarioAsignado,
      telefono,
      direccion,
      fechaIngreso,
      departamento
    };

    console.log('📋 userData preparado:', { ...userData, password: '***' });

    if (tipoUsuario === 'administrador' && codigoAdmin) {
      userData.codigoAdmin = codigoAdmin;
      console.log('👤 Usuario administrador, código incluido');
    }

    console.log(' Creando documento User...');
    user = new User(userData);

    console.log(' Guardando usuario en MongoDB...');
    await user.save();
    console.log(' Usuario guardado exitosamente:', user._id);

    console.log(' Generando token JWT...');
    const token = user.getSignedJwtToken();

    const responseUserData = {
      id: user._id,
      nombreCompleto: user.nombreCompleto,
      correoElectronico: user.correoElectronico,
      tipoUsuario: user.tipoUsuario,
      numeroDocumento: user.numeroDocumento,
      cargo: user.cargo || null,
      horarioAsignado: user.horarioAsignado || null
    };

    if (user.tipoUsuario === 'administrador') {
      responseUserData.codigoAdmin = user.codigoAdmin;
    }

    console.log(' Registro completado exitosamente');
    console.log(' === FIN REGISTRO ===');

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      token,
      user: responseUserData
    });
  } catch (error) {
    console.error(' ERROR EN REGISTRO:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

/**
 * @desc   
 * @route   
 * @access 
 */
exports.login = async (req, res) => {
  try {
    console.log('[auth/login] body:', req.body); // log temporal; quitar al finalizar depuración
    const rawEmail = (req.body.correoElectronico || '').toString();
    const correoElectronico = rawEmail.trim().toLowerCase();
    const password = req.body.password;
    const codigoAdmin = req.body.codigoAdmin;

    // Logs temporales de diagnóstico (no exponen password)
    console.log(' Login intento -> correoNormalizado:', correoElectronico);
    console.log(' Mongo URI (host/db):', (process.env.MONGODB_URI || '').replace(/^(mongodb(?:\+srv)?:\/\/)(.*?)(\@)?(.*)$/i, (m, p1, p2, p3, p4) => {
      // Muestra solo host y db sin credenciales
      const rest = p3 ? p4 : p2;
      return p1 + rest;
    }));

    if (!correoElectronico || !password) {
      console.log(' Login fallido: Datos incompletos');
      return res.status(400).json({
        success: false,
        message: 'Error en los datos de entrada',
        errors: [{ field: 'correoElectronico', message: 'El correo electrónico y la contraseña son obligatorios' }]
      });
    }

    const user = await User.findOne({ correoElectronico }).select('+password');
    console.log(' Usuario encontrado:', user ? `Sí (${user.tipoUsuario})` : 'No');
    if (user) {
      console.log(' Estado usuario:', { activo: user.activo, id: user._id });
      const pwdType = typeof user.password;
      const pwdLen = typeof user.password === 'string' ? user.password.length : null;
      const bcryptPrefix = typeof user.password === 'string' ? user.password.slice(0, 4) : null;
      console.log(' Password meta -> type/len/prefix:', { pwdType, pwdLen, bcryptPrefix });
    }

    if (!user) {
      console.log(' Usuario no encontrado en la base de datos');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        errors: [{ field: 'credenciales', message: 'Usuario o contraseña inválidos' }]
      });
    }

    const isAdmin = user.tipoUsuario === 'administrador';

    // Validación condicional de código admin solo si el usuario es admin
    if (isAdmin) {
      if (!codigoAdmin) {
        console.log(' Código de administrador faltante para usuario admin');
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
          errors: [{ field: 'codigoAdmin', message: 'Código de administrador requerido' }]
        });
      }

      const adminCodeRegex = /^\d{4}$/;
      if (!adminCodeRegex.test(String(codigoAdmin))) {
        console.log(' Código de administrador con formato inválido');
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
          errors: [{ field: 'codigoAdmin', message: 'El código de administrador debe ser un número de máximo 4 dígitos' }]
        });
      }

      if (user.codigoAdmin !== String(codigoAdmin)) {
        console.log(' Código de administrador no coincide');
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
          errors: [{ field: 'codigoAdmin', message: 'Código de administrador incorrecto' }]
        });
      }
    }

    console.log(' Verificando contraseña...');
    const isMatch = await user.matchPassword(password);
    console.log(' Contraseña coincide (bcrypt.compare):', isMatch);

    if (!isMatch) {
      console.log(' Credenciales incorrectas (password)');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        errors: [{ field: 'credenciales', message: 'Usuario o contraseña inválidos' }]
      });
    }

    console.log(' Autenticación exitosa, generando token...');
    const token = user.getSignedJwtToken();

    const userData = {
      id: user._id,
      nombreCompleto: user.nombreCompleto,
      correoElectronico: user.correoElectronico,
      tipoUsuario: user.tipoUsuario,
      numeroDocumento: user.numeroDocumento,
      cargo: user.cargo || null,
      horarioAsignado: user.horarioAsignado || null
    };

    if (user.tipoUsuario === 'administrador') {
      userData.codigoAdmin = user.codigoAdmin;
    }

    console.log(' Enviando respuesta de login exitoso');
    res.status(200).json({
      success: true,
      token,
      user: userData
    });
  } catch (error) {
    console.error(' Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * @desc    
 * @route   
 * @access 
 */
exports.recoverPassword = async (req, res) => {
  try {
    const { correoElectronico, numeroDocumento } = req.body;

    const user = await User.findOne({ 
      correoElectronico, 
      numeroDocumento 
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si los datos proporcionados son correctos, recibirá un código de verificación.'
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    

    recoveryCodes[correoElectronico] = {
      code: verificationCode,
      userId: user._id,
      expires: Date.now() + (15 * 60 * 1000) 
    };

    console.log(`Código de verificación para ${correoElectronico}: ${verificationCode}`);

    res.status(200).json({
      success: true,
      message: 'Código de verificación enviado al correo electrónico',
      debugCode: config.server.env === 'development' ? verificationCode : undefined
    });
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      error: error.message
    });
  }
};

/**
 * @desc    
 * @route   
 * @access  
 */
exports.verifyCode = async (req, res) => {
  try {
    const { correoElectronico, codigoVerificacion } = req.body;
    const recoveryData = recoveryCodes[correoElectronico];
    
    if (!recoveryData) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificación inválido o expirado'
      });
    }

    if (Date.now() > recoveryData.expires) {
      delete recoveryCodes[correoElectronico];
      
      return res.status(400).json({
        success: false,
        message: 'El código de verificación ha expirado'
      });
    }
    if (recoveryData.code !== codigoVerificacion) {
      return res.status(400).json({
        success: false,
        message: 'Código de verificación incorrecto'
      });
    }

    recoveryCodes[correoElectronico].verified = true;

    res.status(200).json({
      success: true,
      message: 'Código verificado correctamente'
    });
  } catch (error) {
    console.error('Error en verificación de código:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el código',
      error: error.message
    });
  }
};

/**
 * @desc    
 * @route   
 * @access  
 */
exports.resetPassword = async (req, res) => {
  try {
    const { correoElectronico, codigoVerificacion, newPassword } = req.body;
    const recoveryData = recoveryCodes[correoElectronico];
    
    if (!recoveryData || !recoveryData.verified || recoveryData.code !== codigoVerificacion) {
      return res.status(400).json({
        success: false,
        message: 'No autorizado para cambiar la contraseña'
      });
    }
    if (Date.now() > recoveryData.expires) {
      delete recoveryCodes[correoElectronico];
      
      return res.status(400).json({
        success: false,
        message: 'La sesión de recuperación ha expirado'
      });
    }
    const user = await User.findOne({ correoElectronico });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    user.password = newPassword;
    await user.save();

    delete recoveryCodes[correoElectronico];

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña',
      error: error.message
    });
  }
};

/**
 * @desc    
 * @route   
 * @access  
 */
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        nombreCompleto: req.user.nombreCompleto,
        correoElectronico: req.user.correoElectronico,
        tipoUsuario: req.user.tipoUsuario,
        numeroDocumento: req.user.numeroDocumento,
        cargo: req.user.cargo || null,
        horarioAsignado: req.user.horarioAsignado || null
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario',
      error: error.message
    });
  }
};