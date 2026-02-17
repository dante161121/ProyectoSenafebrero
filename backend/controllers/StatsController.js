const TimeCalculationService = require('../services/TimeCalculationService');
const ColombianLaborLawService = require('../services/ColombianLaborLawService');
const WorkSession = require('../models/WorkSession');
const DailyStats = require('../models/DailyStats');


class StatsController {

    static async registrarAsistencia(req, res) {
        try {
            const { type, timestamp, location } = req.body;
            const userId = req.user.id;

            console.log(` Nueva asistencia - Usuario: ${userId}, Tipo: ${type}`);
            if (!type || !['entrada', 'salida'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de asistencia inválido. Debe ser "entrada" o "salida"'
                });
            }

            const resultado = await TimeCalculationService.procesarRegistroAsistencia(
                userId,
                type,
                timestamp ? new Date(timestamp) : new Date(),
                location
            );

            res.status(201).json({
                success: true,
                message: resultado.mensaje,
                data: {
                    registro: resultado.registro,
                    sesion: resultado.sesion,
                    estadisticas: resultado.estadisticas,
                    accion: resultado.accion
                }
            });

        } catch (error) {
            console.error(' Error en registrarAsistencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar asistencia',
                error: error.message
            });
        }
    }

    static async obtenerDashboard(req, res) {
        try {
            const userId = req.user.id;
            console.log(` Generando dashboard para usuario: ${userId}`);

            const resumen = await TimeCalculationService.obtenerResumenDashboard(userId);

            res.json({
                success: true,
                data: resumen
            });

        } catch (error) {
            console.error(' Error en obtenerDashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos del dashboard',
                error: error.message
            });
        }
    }

    
    static async obtenerEstadisticasHoy(req, res) {
        try {
            const userId = req.user.id;
            const estadisticas = await TimeCalculationService.obtenerEstadisticasHoy(userId);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error(' Error en obtenerEstadisticasHoy:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de hoy',
                error: error.message
            });
        }
    }

    static async obtenerEstadisticasSemanales(req, res) {
        try {
            const userId = req.user.id;
            const estadisticas = await TimeCalculationService.obtenerEstadisticasSemanales(userId);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error(' Error en obtenerEstadisticasSemanales:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas semanales',
                error: error.message
            });
        }
    }

    static async obtenerEstadisticasMensuales(req, res) {
        try {
            const userId = req.user.id;
            const estadisticas = await TimeCalculationService.obtenerEstadisticasMensuales(userId);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error(' Error en obtenerEstadisticasMensuales:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas mensuales',
                error: error.message
            });
        }
    }


    static async obtenerDatosGraficas(req, res) {
        try {
            const userId = req.user.id;
            const { days = 7 } = req.query;

            const datos = await TimeCalculationService.obtenerDatosGraficas(
                userId, 
                parseInt(days)
            );

            res.json({
                success: true,
                data: datos
            });

        } catch (error) {
            console.error(' Error en obtenerDatosGraficas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener datos para gráficas',
                error: error.message
            });
        }
    }


    static async obtenerSesionActiva(req, res) {
        try {
            const userId = req.user.id;
            const sesion = await TimeCalculationService.obtenerSesionActiva(userId);

            res.json({
                success: true,
                data: sesion
            });

        } catch (error) {
            console.error(' Error en obtenerSesionActiva:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener sesión activa',
                error: error.message
            });
        }
    }


    static async obtenerHistoricoSesiones(req, res) {
        try {
            const userId = req.user.id;
            const { 
                fechaInicio, 
                fechaFin, 
                page = 1, 
                limit = 20 
            } = req.query;

            const filtros = { userId };
            
            if (fechaInicio || fechaFin) {
                filtros.entrada = {};
                if (fechaInicio) filtros.entrada.$gte = new Date(fechaInicio);
                if (fechaFin) filtros.entrada.$lte = new Date(fechaFin);
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [sesiones, total] = await Promise.all([
                WorkSession.find(filtros)
                    .sort({ entrada: -1 })
                    .skip(skip)
                    .limit(parseInt(limit))
                    .populate('userId', 'name email'),
                    
                WorkSession.countDocuments(filtros)
            ]);

            res.json({
                success: true,
                data: {
                    sesiones,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / parseInt(limit))
                    }
                }
            });

        } catch (error) {
            console.error(' Error en obtenerHistoricoSesiones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener histórico de sesiones',
                error: error.message
            });
        }
    }

    static async obtenerDetalleSesion(req, res) {
        try {
            const { sessionId } = req.params;
            const userId = req.user.id;

            const sesion = await WorkSession.findOne({
                _id: sessionId,
                userId
            });

            if (!sesion) {
                return res.status(404).json({
                    success: false,
                    message: 'Sesión no encontrada'
                });
            }

            let reporteLegal = null;
            if (sesion.salida) {
                reporteLegal = ColombianLaborLawService.generarReporteLegal({
                    metadata: sesion.metadata || {},
                    recargos: sesion.recargos || {},
                    horasExtras: sesion.horasExtras || {}
                });
            }

            res.json({
                success: true,
                data: {
                    sesion,
                    reporteLegal
                }
            });

        } catch (error) {
            console.error(' Error en obtenerDetalleSesion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener detalle de sesión',
                error: error.message
            });
        }
    }

    static async migrarRegistros(req, res) {
        try {
            const userId = req.user.id;
            const { fechaInicio, fechaFin } = req.body;

            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({
                    success: false,
                    message: 'Fechas de inicio y fin son requeridas'
                });
            }

            console.log(` Iniciando migración para usuario ${userId}`);

            const resultado = await TimeCalculationService.migrarRegistrosExistentes(
                userId,
                new Date(fechaInicio),
                new Date(fechaFin)
            );

            res.json({
                success: true,
                message: 'Migración completada',
                data: resultado
            });

        } catch (error) {
            console.error(' Error en migrarRegistros:', error);
            res.status(500).json({
                success: false,
                message: 'Error al migrar registros',
                error: error.message
            });
        }
    }

    static async validarIntegridad(req, res) {
        try {
            const userId = req.user.id;
            
            const reporte = await TimeCalculationService.validarIntegridadDatos(userId);

            res.json({
                success: true,
                data: reporte
            });

        } catch (error) {
            console.error(' Error en validarIntegridad:', error);
            res.status(500).json({
                success: false,
                message: 'Error al validar integridad de datos',
                error: error.message
            });
        }
    }

    static async obtenerInfoLegislacion(req, res) {
        try {
            const info = {
                jornadas: ColombianLaborLawService.JORNADAS,
                recargos: ColombianLaborLawService.RECARGOS,
                festivosFijos: ColombianLaborLawService.FESTIVOS_FIJOS,
                festivosLunes: ColombianLaborLawService.FESTIVOS_LUNES,
                descripcion: {
                    'NOCTURNO_ORDINARIO': 'Trabajo nocturno ordinario (22:00-06:00) - Art. 168 CST',
                    'EXTRA_DIURNO': 'Horas extras diurnas (después de 8 horas) - Art. 159 CST',
                    'EXTRA_NOCTURNO': 'Horas extras nocturnas - Art. 168 CST',
                    'DOMINICAL_DIURNO': 'Trabajo dominical y festivo diurno - Art. 179 CST',
                    'DOMINICAL_NOCTURNO': 'Trabajo dominical y festivo nocturno - Art. 179 + 168 CST'
                }
            };

            res.json({
                success: true,
                data: info
            });

        } catch (error) {
            console.error(' Error en obtenerInfoLegislacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener información de legislación',
                error: error.message
            });
        }
    }

    /**
    Calcular recargos para fechas específicas
     */
    static async calcularRecargos(req, res) {
        try {
            const { entrada, salida } = req.body;

            if (!entrada || !salida) {
                return res.status(400).json({
                    success: false,
                    message: 'Fechas de entrada y salida son requeridas'
                });
            }

            const fechaEntrada = new Date(entrada);
            const fechaSalida = new Date(salida);
            const tiempoTotalMinutos = Math.floor((fechaSalida - fechaEntrada) / (1000 * 60));

            if (tiempoTotalMinutos <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha de salida debe ser posterior a la entrada'
                });
            }

            const calculos = ColombianLaborLawService.calcularRecargos(
                fechaEntrada,
                fechaSalida,
                tiempoTotalMinutos
            );

            const validacion = ColombianLaborLawService.validarLimitesLegales(
                tiempoTotalMinutos / 60, 
                0 
            );

            res.json({
                success: true,
                data: {
                    calculos,
                    validacion,
                    tiempoTotal: {
                        minutos: tiempoTotalMinutos,
                        formato: TimeCalculationService.formatearTiempo(tiempoTotalMinutos),
                        horas: Math.round((tiempoTotalMinutos / 60) * 100) / 100
                    }
                }
            });

        } catch (error) {
            console.error(' Error en calcularRecargos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al calcular recargos',
                error: error.message
            });
        }
    }

    /**
     Obtener estadísticas de rendimiento del sistema
     */
    static async obtenerRendimientoSistema(req, res) {
        try {
            const userId = req.user.id;

            const [
                totalSesiones,
                sesionesEsteMes,
                ultimasSesiones,
                estadisticasRecientes
            ] = await Promise.all([
                WorkSession.countDocuments({ userId }),
                
                WorkSession.countDocuments({
                    userId,
                    entrada: {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }),
                
                WorkSession.find({ userId, salida: { $ne: null } })
                    .sort({ entrada: -1 })
                    .limit(5)
                    .select('entrada salida tiempoTotal'),
                    
                DailyStats.find({ userId })
                    .sort({ fecha: -1 })
                    .limit(10)
                    .select('fecha tiempoTotal horasExtras')
            ]);

            let tiempoTotalAcumulado = 0;
            let horasExtrasAcumuladas = 0;

            estadisticasRecientes.forEach(stat => {
                tiempoTotalAcumulado += stat.tiempoTotal.minutos || 0;
                horasExtrasAcumuladas += (stat.horasExtras?.total?.minutos || 0);
            });

            const rendimiento = {
                resumen: {
                    totalSesiones,
                    sesionesEsteMes,
                    promedioHorasDiarias: estadisticasRecientes.length > 0 ? 
                        Math.round(((tiempoTotalAcumulado / 60) / estadisticasRecientes.length) * 100) / 100 : 0,
                    totalHorasExtras: Math.round((horasExtrasAcumuladas / 60) * 100) / 100
                },
                ultimaActividad: ultimasSesiones,
                tendencias: {
                    diasConDatos: estadisticasRecientes.length,
                    promedioSemanal: estadisticasRecientes.length > 0 ? 
                        Math.round(((tiempoTotalAcumulado / 60) / estadisticasRecientes.length) * 7 * 100) / 100 : 0
                }
            };

            res.json({
                success: true,
                data: rendimiento
            });

        } catch (error) {
            console.error(' Error en obtenerRendimientoSistema:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener rendimiento del sistema',
                error: error.message
            });
        }
    }
}

module.exports = StatsController;