// Modelo de auditoría del sistema

const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombreUsuario: {
    type: String,
    required: true
  },
  tipoUsuario: {
    type: String,
    enum: ['empleado', 'administrador'],
    required: true
  },
  entidad: {
    type: String,
    required: true
  },
  entidadId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  accion: {
    type: String,
    enum: ['crear', 'actualizar', 'eliminar', 'restaurar', 'cambiar_contraseña', 'cambiar_estado'],
    required: true
  },
  detalles: {
    type: Object,
    default: {}
  },
  // Dirección IP desde donde se realizó la acción
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

auditSchema.index({ usuarioId: 1, timestamp: -1 });
auditSchema.index({ entidad: 1, entidadId: 1 });
auditSchema.index({ accion: 1 });
auditSchema.index({ timestamp: -1 });

const Audit = mongoose.model('Audit', auditSchema);
module.exports = Audit;