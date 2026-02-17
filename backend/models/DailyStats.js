const mongoose = require('mongoose');

// Modelo de estadísticas diarias

const dailyStatsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    fecha: {
        type: Date,
        required: true,
        index: true
    },
    esDomingoOFestivo: {
        type: Boolean,
        default: false
    },
    tiempoTotal: {
        minutos: {
            type: Number,
            default: 0,
            min: 0
        },
        formato: {
            type: String,
            default: "00:00"
        }
    },
    horasOrdinarias: {
        // Horas diurnas ordinarias (06:00 - 22:00)
        diurnas: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" }
        },
        
        // Horas nocturnas ordinarias (22:00 - 06:00)
        nocturnas: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" }
        },

        // Total ordinarias
        total: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" }
        }
    },

    // === HORAS EXTRAS ===
    horasExtras: {
        // Horas extras diurnas (+25%)
        diurnas: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" }
        },
        
        // Horas extras nocturnas (+75%)
        nocturnas: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" }
        },

        // Total extras
        total: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" }
        }
    },

    // === RECARGOS SALARIALES ===
    recargos: {
        // Recargo nocturno ordinario (35%)
        nocturnoOrdinario: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" },
            porcentaje: { type: Number, default: 35 }
        },

        // Recargo extra diurno (25%)
        extraDiurno: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" },
            porcentaje: { type: Number, default: 25 }
        },

        // Recargo extra nocturno (75%)
        extraNocturno: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" },
            porcentaje: { type: Number, default: 75 }
        },

        // Recargo dominical/festivo diurno (75%)
        dominicalDiurno: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" },
            porcentaje: { type: Number, default: 75 }
        },

        // Recargo dominical/festivo nocturno (100%)
        dominicalNocturno: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" },
            porcentaje: { type: Number, default: 100 }
        },

        // Total de recargos en minutos adicionales pagados
        totalRecargos: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" }
        }
    },

    // === SESIONES DE TRABAJO ===
    sesiones: [{
        entrada: Date,
        salida: Date,
        duracionMinutos: Number,
        tipo: {
            type: String,
            enum: ['ordinaria', 'extra', 'nocturna', 'dominical'],
            default: 'ordinaria'
        }
    }],

    // === ESTADÍSTICAS ADICIONALES ===
    estadisticas: {
        // Número de entradas/salidas del día
        numeroSesiones: {
            type: Number,
            default: 0,
            min: 0
        },

        // Primera entrada del día
        primeraEntrada: Date,

        // Última salida del día
        ultimaSalida: Date,

        // Tiempo de pausa total (entre sesiones)
        tiempoPausa: {
            minutos: { type: Number, default: 0, min: 0 },
            formato: { type: String, default: "00:00" }
        },

        // Indicadores de cumplimiento
        cumplimientoJornada: {
            // ¿Cumplió las 8 horas?
            cumplioOchoHoras: { type: Boolean, default: false },
            
            // ¿Excedió las 8 horas?
            excedioJornada: { type: Boolean, default: false },
            
            // Porcentaje de cumplimiento de jornada (0-100+)
            porcentajeCumplimiento: { type: Number, default: 0, min: 0 }
        }
    },

    // === METADATOS ===
    metadata: {
        // Última actualización
        ultimaActualizacion: {
            type: Date,
            default: Date.now
        },

        // Número de veces que se actualizó
        numeroActualizaciones: {
            type: Number,
            default: 1,
            min: 1
        },

        // Origen de los datos
        origenDatos: {
            type: String,
            enum: ['manual', 'automatico', 'importado', 'correccion'],
            default: 'automatico'
        },

        // Observaciones o notas del día
        observaciones: String
    }
}, {
    timestamps: true,
    versionKey: false
});

// === ÍNDICES COMPUESTOS ===
// Índice único por usuario y fecha
dailyStatsSchema.index({ userId: 1, fecha: 1 }, { unique: true });

// Índice para consultas por rango de fechas
dailyStatsSchema.index({ userId: 1, fecha: -1 });

// Índice para estadísticas agregadas
dailyStatsSchema.index({ fecha: -1, 'tiempoTotal.minutos': -1 });

// === MÉTODOS ESTÁTICOS ===

/**
 * Crear o actualizar estadísticas diarias para un usuario
 * @param {ObjectId} userId - ID del usuario
 * @param {Date} fecha - Fecha del día
 * @param {Object} datosWorkSession - Datos calculados de WorkSession
 * @returns {Object} Estadísticas diarias actualizadas
 */
dailyStatsSchema.statics.crearOActualizarEstadisticas = async function(userId, fecha, datosWorkSession) {
    try {
        // Normalizar fecha (solo día, sin hora)
        const fechaNormalizada = new Date(fecha);
        fechaNormalizada.setHours(0, 0, 0, 0);

        // Verificar si es domingo o festivo
        const esDomingo = fechaNormalizada.getDay() === 0;
        // TODO: Implementar lógica de días festivos colombianos

        // Buscar estadísticas existentes
        let stats = await this.findOne({ 
            userId, 
            fecha: fechaNormalizada 
        });

        if (!stats) {
            // Crear nuevas estadísticas
            stats = new this({
                userId,
                fecha: fechaNormalizada,
                esDomingoOFestivo: esDomingo
            });
        }

        // Actualizar con datos de WorkSession
        stats.tiempoTotal = datosWorkSession.tiempoTotal;
        stats.horasOrdinarias = datosWorkSession.horasOrdinarias;
        stats.horasExtras = datosWorkSession.horasExtras;
        stats.recargos = datosWorkSession.recargos;
        
        // Actualizar estadísticas
        stats.estadisticas.numeroSesiones = datosWorkSession.sesiones?.length || 0;
        stats.estadisticas.primeraEntrada = datosWorkSession.entrada;
        stats.estadisticas.ultimaSalida = datosWorkSession.salida;
        
        // Calcular cumplimiento de jornada
        const tiempoTotalHoras = stats.tiempoTotal.minutos / 60;
        stats.estadisticas.cumplimientoJornada.cumplioOchoHoras = tiempoTotalHoras >= 8;
        stats.estadisticas.cumplimientoJornada.excedioJornada = tiempoTotalHoras > 8;
        stats.estadisticas.cumplimientoJornada.porcentajeCumplimiento = Math.round((tiempoTotalHoras / 8) * 100);

        // Actualizar metadatos
        stats.metadata.ultimaActualizacion = new Date();
        stats.metadata.numeroActualizaciones += 1;

        await stats.save();
        return stats;

    } catch (error) {
        throw new Error(`Error al crear/actualizar estadísticas diarias: ${error.message}`);
    }
};

/**
 * Obtener estadísticas de la semana actual
 * @param {ObjectId} userId - ID del usuario
 * @returns {Object} Estadísticas semanales
 */
dailyStatsSchema.statics.obtenerEstadisticasSemanales = async function(userId) {
    try {
        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo
        inicioSemana.setHours(0, 0, 0, 0);

        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6); // Sábado
        finSemana.setHours(23, 59, 59, 999);

        const estadisticasSemana = await this.find({
            userId,
            fecha: { $gte: inicioSemana, $lte: finSemana }
        }).sort({ fecha: 1 });

        // Calcular totales semanales
        let tiempoTotalSemana = 0;
        let diasTrabajados = 0;
        let horasExtrasSemana = 0;

        estadisticasSemana.forEach(dia => {
            if (dia.tiempoTotal.minutos > 0) {
                tiempoTotalSemana += dia.tiempoTotal.minutos;
                diasTrabajados++;
                horasExtrasSemana += dia.horasExtras.total.minutos;
            }
        });

        return {
            diasTrabajados,
            tiempoTotal: {
                minutos: tiempoTotalSemana,
                formato: this.formatearTiempo(tiempoTotalSemana),
                horas: Math.round((tiempoTotalSemana / 60) * 100) / 100
            },
            horasExtras: {
                minutos: horasExtrasSemana,
                formato: this.formatearTiempo(horasExtrasSemana)
            },
            promedioHorasDiarias: diasTrabajados > 0 ? 
                Math.round(((tiempoTotalSemana / 60) / diasTrabajados) * 100) / 100 : 0,
            cumpleLimite44Horas: (tiempoTotalSemana / 60) <= 44,
            estadisticasDiarias: estadisticasSemana
        };

    } catch (error) {
        throw new Error(`Error al obtener estadísticas semanales: ${error.message}`);
    }
};

/**
 * Obtener estadísticas del mes actual
 * @param {ObjectId} userId - ID del usuario
 * @returns {Object} Estadísticas mensuales
 */
dailyStatsSchema.statics.obtenerEstadisticasMensuales = async function(userId) {
    try {
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        finMes.setHours(23, 59, 59, 999);

        const estadisticasMes = await this.find({
            userId,
            fecha: { $gte: inicioMes, $lte: finMes }
        }).sort({ fecha: 1 });

        // Calcular totales mensuales
        let tiempoTotalMes = 0;
        let diasTrabajados = 0;
        let horasExtrasMes = 0;
        const estadisticasPorDia = [];

        estadisticasMes.forEach(dia => {
            if (dia.tiempoTotal.minutos > 0) {
                tiempoTotalMes += dia.tiempoTotal.minutos;
                diasTrabajados++;
                horasExtrasMes += dia.horasExtras.total.minutos;
            }

            estadisticasPorDia.push({
                fecha: dia.fecha,
                horas: Math.round((dia.tiempoTotal.minutos / 60) * 100) / 100,
                horasExtras: Math.round((dia.horasExtras.total.minutos / 60) * 100) / 100
            });
        });

        return {
            diasTrabajados,
            tiempoTotal: {
                minutos: tiempoTotalMes,
                formato: this.formatearTiempo(tiempoTotalMes),
                horas: Math.round((tiempoTotalMes / 60) * 100) / 100
            },
            horasExtras: {
                minutos: horasExtrasMes,
                formato: this.formatearTiempo(horasExtrasMes)
            },
            promedioHorasDiarias: diasTrabajados > 0 ? 
                Math.round(((tiempoTotalMes / 60) / diasTrabajados) * 100) / 100 : 0,
            estadisticasPorDia
        };

    } catch (error) {
        throw new Error(`Error al obtener estadísticas mensuales: ${error.message}`);
    }
};

/**
 * Obtener datos para gráficas del dashboard
 * @param {ObjectId} userId - ID del usuario
 * @param {Number} ultimosDias - Número de días hacia atrás (default: 7)
 * @returns {Object} Datos formateados para gráficas
 */
dailyStatsSchema.statics.obtenerDatosGraficas = async function(userId, ultimosDias = 7) {
    try {
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - ultimosDias);
        fechaInicio.setHours(0, 0, 0, 0);

        const estadisticas = await this.find({
            userId,
            fecha: { $gte: fechaInicio }
        }).sort({ fecha: 1 });

        // Formatear datos para gráficas
        const labels = [];
        const horasTrabajadas = [];
        const horasExtras = [];
        const recargos = [];

        // Generar array completo de fechas (incluyendo días sin datos)
        for (let i = 0; i < ultimosDias; i++) {
            const fecha = new Date(fechaInicio);
            fecha.setDate(fechaInicio.getDate() + i);
            
            const fechaStr = fecha.toLocaleDateString('es-CO', { 
                weekday: 'short', 
                day: 'numeric' 
            });
            labels.push(fechaStr);

            // Buscar estadísticas para esta fecha
            const statsDelDia = estadisticas.find(stat => 
                stat.fecha.toDateString() === fecha.toDateString()
            );

            if (statsDelDia) {
                horasTrabajadas.push(Math.round((statsDelDia.tiempoTotal.minutos / 60) * 100) / 100);
                horasExtras.push(Math.round((statsDelDia.horasExtras.total.minutos / 60) * 100) / 100);
                recargos.push(Math.round((statsDelDia.recargos.totalRecargos.minutos / 60) * 100) / 100);
            } else {
                horasTrabajadas.push(0);
                horasExtras.push(0);
                recargos.push(0);
            }
        }

        return {
            labels,
            datasets: {
                horasTrabajadas,
                horasExtras,
                recargos
            }
        };

    } catch (error) {
        throw new Error(`Error al obtener datos para gráficas: ${error.message}`);
    }
};

// === MÉTODOS DE INSTANCIA ===

/**
 * Formatear tiempo de minutos a HH:MM
 * @param {Number} minutos - Minutos a formatear
 * @returns {String} Tiempo formateado
 */
dailyStatsSchema.statics.formatearTiempo = function(minutos) {
    if (!minutos || minutos < 0) return "00:00";
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Validar y limpiar datos antes de guardar
 */
dailyStatsSchema.pre('save', function(next) {
    try {
        // Formatear todos los tiempos
        if (this.tiempoTotal.minutos >= 0) {
            this.tiempoTotal.formato = this.constructor.formatearTiempo(this.tiempoTotal.minutos);
        }

        // Formatear horas ordinarias
        if (this.horasOrdinarias.diurnas.minutos >= 0) {
            this.horasOrdinarias.diurnas.formato = this.constructor.formatearTiempo(this.horasOrdinarias.diurnas.minutos);
        }
        if (this.horasOrdinarias.nocturnas.minutos >= 0) {
            this.horasOrdinarias.nocturnas.formato = this.constructor.formatearTiempo(this.horasOrdinarias.nocturnas.minutos);
        }
        this.horasOrdinarias.total.minutos = this.horasOrdinarias.diurnas.minutos + this.horasOrdinarias.nocturnas.minutos;
        this.horasOrdinarias.total.formato = this.constructor.formatearTiempo(this.horasOrdinarias.total.minutos);

        // Formatear horas extras
        if (this.horasExtras.diurnas.minutos >= 0) {
            this.horasExtras.diurnas.formato = this.constructor.formatearTiempo(this.horasExtras.diurnas.minutos);
        }
        if (this.horasExtras.nocturnas.minutos >= 0) {
            this.horasExtras.nocturnas.formato = this.constructor.formatearTiempo(this.horasExtras.nocturnas.minutos);
        }
        this.horasExtras.total.minutos = this.horasExtras.diurnas.minutos + this.horasExtras.nocturnas.minutos;
        this.horasExtras.total.formato = this.constructor.formatearTiempo(this.horasExtras.total.minutos);

        // Formatear recargos
        ['nocturnoOrdinario', 'extraDiurno', 'extraNocturno', 'dominicalDiurno', 'dominicalNocturno'].forEach(tipo => {
            if (this.recargos[tipo].minutos >= 0) {
                this.recargos[tipo].formato = this.constructor.formatearTiempo(this.recargos[tipo].minutos);
            }
        });

        // Calcular total de recargos
        this.recargos.totalRecargos.minutos = 
            this.recargos.nocturnoOrdinario.minutos +
            this.recargos.extraDiurno.minutos +
            this.recargos.extraNocturno.minutos +
            this.recargos.dominicalDiurno.minutos +
            this.recargos.dominicalNocturno.minutos;
        
        this.recargos.totalRecargos.formato = this.constructor.formatearTiempo(this.recargos.totalRecargos.minutos);

        // Formatear tiempo de pausa
        if (this.estadisticas.tiempoPausa.minutos >= 0) {
            this.estadisticas.tiempoPausa.formato = this.constructor.formatearTiempo(this.estadisticas.tiempoPausa.minutos);
        }

        next();
    } catch (error) {
        next(error);
    }
});

// === MÉTODOS VIRTUALES ===

/**
 * Tiempo total en horas (decimal)
 */
dailyStatsSchema.virtual('tiempoTotalHoras').get(function() {
    return Math.round((this.tiempoTotal.minutos / 60) * 100) / 100;
});

/**
 * Porcentaje de cumplimiento de jornada
 */
dailyStatsSchema.virtual('porcentajeJornada').get(function() {
    return Math.round((this.tiempoTotalHoras / 8) * 100);
});

/**
 * Indicador de día completo trabajado
 */
dailyStatsSchema.virtual('diaCompleto').get(function() {
    return this.tiempoTotalHoras >= 8;
});

// Configurar para incluir virtuals en JSON
dailyStatsSchema.set('toJSON', { virtuals: true });
dailyStatsSchema.set('toObject', { virtuals: true });

const DailyStats = mongoose.model('DailyStats', dailyStatsSchema);

module.exports = DailyStats;