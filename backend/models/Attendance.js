// Modelo de asistencia - registra entradas y salidas

const mongoose = require('mongoose');

// Definir el esquema de asistencia
const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Se requiere ID de usuario']
  },
  type: {
    type: String,
    enum: {
      values: ['entrada', 'salida'],
      message: '{VALUE} no es un tipo de registro válido'
    },
    required: [true, 'El tipo de registro es requerido']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  observaciones: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

attendanceSchema.index({ userId: 1, timestamp: 1 });
attendanceSchema.index({ userId: 1, type: 1, date: 1 });

attendanceSchema.pre('save', function(next) {
  if (this.isModified('timestamp') || !this.date || !this.time) {
    const datetime = new Date(this.timestamp);

    this.date = datetime.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    this.time = datetime.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  next();
});


attendanceSchema.statics.existsForUserAndDate = async function(userId, type, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingRecord = await this.findOne({
    userId,
    type,
    timestamp: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  return existingRecord !== null;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;