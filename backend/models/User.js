// Modelo de usuario para el sistema

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const userSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: [true, 'El nombre completo es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  numeroDocumento: {
    type: String,
    required: [true, 'El número de documento es requerido'],
    unique: true,
    trim: true,
    match: [/^[0-9]{6,12}$/, 'El número de documento debe tener entre 6 y 12 dígitos']
  },
  correoElectronico: {
    type: String,
    required: [true, 'El correo electrónico es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El formato del correo electrónico no es válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false 
  },
  tipoUsuario: {
    type: String,
    enum: {
      values: ['empleado', 'administrador'],
      message: '{VALUE} no es un tipo de usuario válido'
    },
    default: 'empleado'
  },
  codigoAdmin: {
    type: String,
    trim: true,
    match: [/^[0-9]{1,4}$/, 'El código de administrador debe ser un número de máximo 4 dígitos'],
    required: function() {
      return this.tipoUsuario === 'administrador';
    }
  },
  edad: {
    type: Number,
    min: [18, 'La edad mínima es 18 años'],
    max: [100, 'La edad máxima es 100 años']
  },
  cargo: {
    type: String,
    trim: true
  },
  horarioAsignado: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Formato de teléfono inválido']
  },
  direccion: {
    type: String,
    trim: true,
    maxlength: [100, 'La dirección no puede exceder 100 caracteres']
  },
  fechaIngreso: {
    type: Date,
    default: null
  },
  departamento: {
    type: String,
    trim: true,
    maxlength: [50, 'El departamento no puede exceder 50 caracteres']
  },
  fotoPerfil: {
    type: String,
    default: 'default-profile.png'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaDesactivacion: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, 
  versionKey: false 
});

userSchema.index({ numeroDocumento: 1 });
userSchema.index({ correoElectronico: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  try {

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isLegacyPassword = function(hash, password) {
  try {
    return atob(hash) === password;
  } catch (e) {
    return false;
  }
};

userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      tipoUsuario: this.tipoUsuario 
    },
    config.server.jwtSecret,
    {
      expiresIn: config.server.jwtExpire
    }
  );
};

userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;