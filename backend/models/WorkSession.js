// Modelo de sesión de trabajo

const mongoose = require('mongoose');


const workSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Se requiere ID de usuario']
  },
  fecha: {
    type: String,
    required: [true, 'La fecha es requerida'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)']
  },

  horaEntrada: {
    type: String,
    required: [true, 'La hora de entrada es requerida'],
    match: [/^\d{2}:\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM:SS)']
  },
  timestampEntrada: {
    type: Date,
    required: [true, 'El timestamp de entrada es requerido']
  },

  horaSalida: {
    type: String,
    match: [/^\d{2}:\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM:SS)'],
    default: null
  },
  timestampSalida: {
    type: Date,
    default: null
  },

  tiempoLaboradoMinutos: {
    type: Number,
    default: null,
    min: [0, 'El tiempo laborado no puede ser negativo']
  },
  tiempoLaboradoHoras: {
    type: String,
    default: null
  },

  estado: {
    type: String,
    enum: {
      values: ['activa', 'completada', 'incompleta'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'activa'
  },

  tiempoJornadaOrdinariaDiurna: {
    type: Number,
    default: 0,
    min: 0
  },
  tiempoJornadaOrdinariaNoturna: {
    type: Number,
    default: 0,
    min: 0
  },
  tiempoHorasExtrasDiurnas: {
    type: Number,
    default: 0,
    min: 0
  },
  tiempoHorasExtrasNocturnas: {
    type: Number,
    default: 0,
    min: 0
  },
  tiempoHorasExtrasDominicales: {
    type: Number,
    default: 0,
    min: 0
  },

  recargos: {
    recargoNocturno: {
      type: Number,
      default: 0,
      min: 0
    },
    recargoHorasExtrasDiurnas: {
      type: Number,
      default: 0,
      min: 0
    },
    recargoHorasExtrasNocturnas: {
      type: Number,
      default: 0,
      min: 0
    },
    recargoDominicalesFestivos: {
      type: Number,
      default: 0,
      min: 0
    },
    recargoTotal: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  observaciones: {
    type: String,
    trim: true,
    maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres']
  },

  esFinDeSemana: {
    type: Boolean,
    default: false
  },
  esFestivo: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  versionKey: false
});

workSessionSchema.index({ userId: 1, fecha: 1 });
workSessionSchema.index({ userId: 1, timestampEntrada: 1 });
workSessionSchema.index({ estado: 1 });
workSessionSchema.pre('save', function(next) {

  if (this.horaSalida && this.timestampSalida) {
    this.calcularTiemposYRecargos();
    this.estado = 'completada';
  }
  next();
});


workSessionSchema.methods.calcularTiemposYRecargos = function() {
  if (!this.timestampEntrada || !this.timestampSalida) {
    return;
  }

  const tiempoTotalMs = this.timestampSalida - this.timestampEntrada;
  this.tiempoLaboradoMinutos = Math.floor(tiempoTotalMs / (1000 * 60));
  // tiempo en HH:MM
  const horas = Math.floor(this.tiempoLaboradoMinutos / 60);
  const minutos = this.tiempoLaboradoMinutos % 60;
  this.tiempoLaboradoHoras = `${horas}:${minutos.toString().padStart(2, '0')}`;
  // Determinar si es fin de semana o festivo
  const fecha = new Date(this.timestampEntrada);
  this.esFinDeSemana = fecha.getDay() === 0; // Domingo
  // Calcular distribución de tiempo según horarios
  this.calcularDistribucionTiempo();
  // Calcular recargos
  this.calcularRecargos();
};
// Método para calcular distribución de tiempo según jornadas
workSessionSchema.methods.calcularDistribucionTiempo = function() {
  const entrada = new Date(this.timestampEntrada);
  const salida = new Date(this.timestampSalida);
  // Resetear contadores
  this.tiempoJornadaOrdinariaDiurna = 0;
  this.tiempoJornadaOrdinariaNoturna = 0;
  this.tiempoHorasExtrasDiurnas = 0;
  this.tiempoHorasExtrasNocturnas = 0;
  this.tiempoHorasExtrasDominicales = 0;

  // Definir límites horarios
  const JORNADA_DIURNA_INICIO = 6;  // 6:00 AM
  const JORNADA_DIURNA_FIN = 21;    // 9:00 PM
  const JORNADA_NOCTURNA_INICIO = 21; // 9:00 PM
  const JORNADA_NOCTURNA_FIN = 6;   // 6:00 AM siguiente día
  const MAX_HORAS_DIARIAS = 8;      // Máximo 8 horas jornada ordinaria
  const MAX_HORAS_EXTRAS_DIARIAS = 2; // Máximo 2 horas extras diarias

  // Iterar hora por hora para clasificar tiempo
  let tiempoActual = new Date(entrada);
  let tiempoOrdinarioAcumulado = 0;

  while (tiempoActual < salida) {
    const siguienteHora = new Date(tiempoActual);
    siguienteHora.setHours(tiempoActual.getHours() + 1, 0, 0, 0);
    
    const finPeriodo = siguienteHora > salida ? salida : siguienteHora;
    const minutosEnPeriodo = (finPeriodo - tiempoActual) / (1000 * 60);
    
    const hora = tiempoActual.getHours();
    const esHorarioDiurno = hora >= JORNADA_DIURNA_INICIO && hora < JORNADA_DIURNA_FIN;
    const tiempoOrdinarioCompletado = tiempoOrdinarioAcumulado >= (MAX_HORAS_DIARIAS * 60);

    if (this.esFinDeSemana) {
      // Domingo o festivo - 100% recargo
      this.tiempoHorasExtrasDominicales += minutosEnPeriodo;
    } else if (!tiempoOrdinarioCompletado) {
      // Jornada ordinaria
      if (esHorarioDiurno) {
        this.tiempoJornadaOrdinariaDiurna += minutosEnPeriodo;
      } else {
        this.tiempoJornadaOrdinariaNoturna += minutosEnPeriodo;
      }
      tiempoOrdinarioAcumulado += minutosEnPeriodo;
    } else {
      // Horas extras
      if (esHorarioDiurno) {
        this.tiempoHorasExtrasDiurnas += minutosEnPeriodo;
      } else {
        this.tiempoHorasExtrasNocturnas += minutosEnPeriodo;
      }
    }

    tiempoActual = siguienteHora;
  }
};

// Método para calcular recargos 
workSessionSchema.methods.calcularRecargos = function() {
  // Porcentajes horas extrax
  const RECARGO_NOCTURNO = 0.35;           
  const RECARGO_EXTRAS_DIURNAS = 0.25;    
  const RECARGO_EXTRAS_NOCTURNAS = 0.75;   
  const RECARGO_DOMINICALES_FESTIVOS = 1.0; 

  // Calcular recargos en minutos adicionales
  this.recargos.recargoNocturno = Math.round(this.tiempoJornadaOrdinariaNoturna * RECARGO_NOCTURNO);
  this.recargos.recargoHorasExtrasDiurnas = Math.round(this.tiempoHorasExtrasDiurnas * RECARGO_EXTRAS_DIURNAS);
  this.recargos.recargoHorasExtrasNocturnas = Math.round(this.tiempoHorasExtrasNocturnas * RECARGO_EXTRAS_NOCTURNAS);
  this.recargos.recargoDominicalesFestivos = Math.round(this.tiempoHorasExtrasDominicales * RECARGO_DOMINICALES_FESTIVOS);
  
  // Calcular recargo total
  this.recargos.recargoTotal = 
    this.recargos.recargoNocturno +
    this.recargos.recargoHorasExtrasDiurnas +
    this.recargos.recargoHorasExtrasNocturnas +
    this.recargos.recargoDominicalesFestivos;
};

// Método estático para obtener sesión activa de un usuario
workSessionSchema.statics.obtenerSesionActiva = async function(userId) {
  return await this.findOne({
    userId,
    estado: 'activa'
  }).sort({ timestampEntrada: -1 });
};

// Método estático para verificar si ya existe entrada para una fecha
workSessionSchema.statics.existeEntradaEnFecha = async function(userId, fecha) {
  return await this.findOne({
    userId,
    fecha,
    estado: { $in: ['activa', 'completada'] }
  });
};

// Crear y exportar el modelo
const WorkSession = mongoose.model('WorkSession', workSessionSchema);
module.exports = WorkSession;