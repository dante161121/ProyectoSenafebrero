// Servicio de legislación laboral colombiana
// Calcula horas según normativas locales

class ColombianLaborLawService {
    static JORNADAS = {
        MAXIMA_DIARIA: 8, 
        MAXIMA_SEMANAL: 44, 

        DIURNA: {
            INICIO: 6, 
            FIN: 22   
        },
        
        NOCTURNA: {
            INICIO: 22, 
            FIN: 6    
        }
    };

    static RECARGOS = {
        NOCTURNO_ORDINARIO: 35, 
        EXTRA_DIURNO: 25, // % 
        // Horas extras nocturnas (después de 8 horas + nocturno)
        EXTRA_NOCTURNO: 75, // % (Art. 168 CST)
        // Trabajo dominical y festivo
        DOMINICAL_DIURNO: 75, // % (Art. 179 CST)
        DOMINICAL_NOCTURNO: 100, // % (Art. 179 + 168 CST)
        // Trabajo en día de descanso compensatorio
        DESCANSO_COMPENSATORIO: 100 // %
    };



    /**
     * Días festivos fijos de Colombia
     */
    static FESTIVOS_FIJOS = [
        { mes: 1, dia: 1 },   // Año Nuevo
        { mes: 5, dia: 1 },   // Día del Trabajo
        { mes: 7, dia: 20 },  // Día de la Independencia
        { mes: 8, dia: 7 },   // Batalla de Boyacá
        { mes: 12, dia: 8 },  // Inmaculada Concepción
        { mes: 12, dia: 25 }  // Navidad
    ];



    /**
     * Días festivos que se trasladan al lunes siguiente
     */
    static FESTIVOS_LUNES = [
        { mes: 1, dia: 6 },   // Reyes Magos
        { mes: 3, dia: 19 },  // San José
        { mes: 6, dia: 29 },  // San Pedro y San Pablo
        { mes: 8, dia: 15 },  // Asunción de la Virgen
        { mes: 10, dia: 12 }, // Día de la Raza
        { mes: 11, dia: 1 },  // Todos los Santos
        { mes: 11, dia: 11 }  // Independencia de Cartagena
    ];


    /**
     * Verificar si una fecha es domingo
     * @param {Date} fecha - Fecha a verificar
     * @returns {Boolean} True si es domingo
     */
    static esDomingo(fecha) {
        return fecha.getDay() === 0;
    }


    /**
     * Verificar si una fecha es día festivo en Colombia
     * @param {Date} fecha - Fecha a verificar
     * @returns {Boolean} True si es festivo
     */
    static esFestivo(fecha) {
        const mes = fecha.getMonth() + 1;
        const dia = fecha.getDate();

        // Verificar festivos fijos
        const esFestivoFijo = this.FESTIVOS_FIJOS.some(festivo => 
            festivo.mes === mes && festivo.dia === dia
        );

        if (esFestivoFijo) return true;

        // Verificar festivos que se trasladan al lunes
        const esFestivoLunes = this.FESTIVOS_LUNES.some(festivo => {
            const fechaFestivo = new Date(fecha.getFullYear(), festivo.mes - 1, festivo.dia);
            
            // Si el festivo cae en domingo o después, se traslada al siguiente lunes
            if (fechaFestivo.getDay() === 0) {
                fechaFestivo.setDate(fechaFestivo.getDate() + 1);
            } else if (fechaFestivo.getDay() > 1) {
                fechaFestivo.setDate(fechaFestivo.getDate() + (8 - fechaFestivo.getDay()));
            }

            return fechaFestivo.toDateString() === fecha.toDateString();
        });

        if (esFestivoLunes) return true;

        return false;
    }

    /**
     * @param {Date} fecha 
     * @returns {Boolean} 
     */
    static esDomingoOFestivo(fecha) {
        return this.esDomingo(fecha) || this.esFestivo(fecha);
    }

    /**
     * @param {Date} timestamp 
     * @returns {Boolean} 
     */
    static esHorarioNocturno(timestamp) {
        const hora = timestamp.getHours();
        return hora >= this.JORNADAS.NOCTURNA.INICIO || hora < this.JORNADAS.NOCTURNA.FIN;
    }

    /**

     * @param {Date} entrada 
     * @param {Date} salida 
     * @returns {Object} 
     */
    static calcularDistribucionHoraria(entrada, salida) {
        const resultado = {
            tiempoTotal: 0,
            tiempoDiurno: 0,
            tiempoNocturno: 0,
            detalles: []
        };

        let actual = new Date(entrada);
        const fin = new Date(salida);

        while (actual < fin) {
            const siguienteHito = this.obtenerSiguienteHitoHorario(actual, fin);
            const duracionSegmento = siguienteHito - actual;
            const minutos = Math.floor(duracionSegmento / (1000 * 60));

            if (minutos > 0) {
                const esNocturno = this.esHorarioNocturno(actual);
                
                resultado.tiempoTotal += minutos;
                
                if (esNocturno) {
                    resultado.tiempoNocturno += minutos;
                } else {
                    resultado.tiempoDiurno += minutos;
                }

                resultado.detalles.push({
                    inicio: new Date(actual),
                    fin: new Date(siguienteHito),
                    duracionMinutos: minutos,
                    tipo: esNocturno ? 'nocturno' : 'diurno'
                });
            }

            actual = new Date(siguienteHito);
        }

        return resultado;
    }

    /**
     *  (cambio de diurno/nocturno)
     * @param {Date} actual 
     * @param {Date} limite 
     * @returns {Date} 
     */
    static obtenerSiguienteHitoHorario(actual, limite) {
        const fecha = new Date(actual);
        
        // Próximo cambio a nocturno (22:00)
        const proximoNocturno = new Date(fecha);
        proximoNocturno.setHours(this.JORNADAS.NOCTURNA.INICIO, 0, 0, 0);
        if (proximoNocturno <= actual) {
            proximoNocturno.setDate(proximoNocturno.getDate() + 1);
        }


        // Próximo cambio a diurno (06:00)
        const proximoDiurno = new Date(fecha);
        proximoDiurno.setHours(this.JORNADAS.DIURNA.INICIO, 0, 0, 0);
        if (proximoDiurno <= actual) {
            proximoDiurno.setDate(proximoDiurno.getDate() + 1);
        }
        // Retornar el hito más cercano que no exceda el límite
        const siguienteHito = proximoNocturno < proximoDiurno ? proximoNocturno : proximoDiurno;
        return siguienteHito > limite ? limite : siguienteHito;
    }

    /**
     * Calcular recargos para una sesión de trabajo
     * @param {Date} entrada 
     * @param {Date} salida 
     * @param {Number} tiempoTotalMinutos 
     * @returns {Object} 
     */
    static calcularRecargos(entrada, salida, tiempoTotalMinutos) {
        const fechaEntrada = new Date(entrada);
        fechaEntrada.setHours(0, 0, 0, 0);

        const esDomingoOFestivo = this.esDomingoOFestivo(fechaEntrada);
        const distribucion = this.calcularDistribucionHoraria(entrada, salida);



        const tiempoTotalHoras = tiempoTotalMinutos / 60;
        const JORNADA_ORDINARIA = this.JORNADAS.MAXIMA_DIARIA; // 8 horas

        const resultado = {

            horasOrdinarias: {
                diurnas: { minutos: 0, formato: "00:00" },
                nocturnas: { minutos: 0, formato: "00:00" },
                total: { minutos: 0, formato: "00:00" }
            },

            // Horas extras (después de 8 horas)
            horasExtras: {
                diurnas: { minutos: 0, formato: "00:00" },
                nocturnas: { minutos: 0, formato: "00:00" },
                total: { minutos: 0, formato: "00:00" }
            },

            // Recargos por tipo
            recargos: {
                nocturnoOrdinario: { minutos: 0, formato: "00:00", porcentaje: this.RECARGOS.NOCTURNO_ORDINARIO },
                extraDiurno: { minutos: 0, formato: "00:00", porcentaje: this.RECARGOS.EXTRA_DIURNO },
                extraNocturno: { minutos: 0, formato: "00:00", porcentaje: this.RECARGOS.EXTRA_NOCTURNO },
                dominicalDiurno: { minutos: 0, formato: "00:00", porcentaje: this.RECARGOS.DOMINICAL_DIURNO },
                dominicalNocturno: { minutos: 0, formato: "00:00", porcentaje: this.RECARGOS.DOMINICAL_NOCTURNO },
                totalRecargos: { minutos: 0, formato: "00:00" }
            },


            // Información adicional
            metadata: {
                esDomingoOFestivo,
                tiempoTotalHoras,
                excedeLimiteOrdinario: tiempoTotalHoras > JORNADA_ORDINARIA,
                distribucionHoraria: distribucion.detalles
            }
        };

        if (esDomingoOFestivo) {
            //TRABAJO EN DOMINGO O FESTIVO
            
            // Todo el tiempo trabajado en domingo/festivo tiene recargo
            resultado.horasOrdinarias.diurnas.minutos = distribucion.tiempoDiurno;
            resultado.horasOrdinarias.nocturnas.minutos = distribucion.tiempoNocturno;

            // Recargos dominicales/festivos
            resultado.recargos.dominicalDiurno.minutos = Math.round(
                (distribucion.tiempoDiurno * this.RECARGOS.DOMINICAL_DIURNO) / 100
            );
            
            resultado.recargos.dominicalNocturno.minutos = Math.round(
                (distribucion.tiempoNocturno * this.RECARGOS.DOMINICAL_NOCTURNO) / 100
            );

        } else {
            // TRABAJO EN DÍA ORDINARIO 

            if (tiempoTotalHoras <= JORNADA_ORDINARIA) {
                // Trabajo dentro de jornada ordinaria
                resultado.horasOrdinarias.diurnas.minutos = distribucion.tiempoDiurno;
                resultado.horasOrdinarias.nocturnas.minutos = distribucion.tiempoNocturno;

                // Solo recargo nocturno ordinario
                resultado.recargos.nocturnoOrdinario.minutos = Math.round(
                    (distribucion.tiempoNocturno * this.RECARGOS.NOCTURNO_ORDINARIO) / 100
                );

            } else {
                // Trabajo con horas extras
                const minutosOrdinarios = JORNADA_ORDINARIA * 60;
                const minutosExtras = tiempoTotalMinutos - minutosOrdinarios;

                // Distribuir tiempo ordinario proporcionalmente
                const proporcionDiurna = distribucion.tiempoDiurno / tiempoTotalMinutos;
                const proporcionNocturna = distribucion.tiempoNocturno / tiempoTotalMinutos;

                // Horas ordinarias
                resultado.horasOrdinarias.diurnas.minutos = Math.round(minutosOrdinarios * proporcionDiurna);
                resultado.horasOrdinarias.nocturnas.minutos = Math.round(minutosOrdinarios * proporcionNocturna);

                // Horas extras
                resultado.horasExtras.diurnas.minutos = Math.round(minutosExtras * proporcionDiurna);
                resultado.horasExtras.nocturnas.minutos = Math.round(minutosExtras * proporcionNocturna);

                // Recargos
                resultado.recargos.nocturnoOrdinario.minutos = Math.round(
                    (resultado.horasOrdinarias.nocturnas.minutos * this.RECARGOS.NOCTURNO_ORDINARIO) / 100
                );

                resultado.recargos.extraDiurno.minutos = Math.round(
                    (resultado.horasExtras.diurnas.minutos * this.RECARGOS.EXTRA_DIURNO) / 100
                );

                resultado.recargos.extraNocturno.minutos = Math.round(
                    (resultado.horasExtras.nocturnas.minutos * this.RECARGOS.EXTRA_NOCTURNO) / 100
                );
            }
        }

        // Calcular totales
        resultado.horasOrdinarias.total.minutos = 
            resultado.horasOrdinarias.diurnas.minutos + resultado.horasOrdinarias.nocturnas.minutos;

        resultado.horasExtras.total.minutos = 
            resultado.horasExtras.diurnas.minutos + resultado.horasExtras.nocturnas.minutos;

        resultado.recargos.totalRecargos.minutos = 
            resultado.recargos.nocturnoOrdinario.minutos +
            resultado.recargos.extraDiurno.minutos +
            resultado.recargos.extraNocturno.minutos +
            resultado.recargos.dominicalDiurno.minutos +
            resultado.recargos.dominicalNocturno.minutos;

        // Formatear todos los tiempos
        this.formatearTodosLosTiempos(resultado);

        return resultado;
    }

    /**
     * Formatear todos los campos de tiempo en un objeto
     * @param {Object} objeto 
     */
    static formatearTodosLosTiempos(objeto) {
        const formatear = (minutos) => {
            if (!minutos || minutos < 0) return "00:00";
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        // Formatear horas ordinarias
        objeto.horasOrdinarias.diurnas.formato = formatear(objeto.horasOrdinarias.diurnas.minutos);
        objeto.horasOrdinarias.nocturnas.formato = formatear(objeto.horasOrdinarias.nocturnas.minutos);
        objeto.horasOrdinarias.total.formato = formatear(objeto.horasOrdinarias.total.minutos);

        // Formatear horas extras
        objeto.horasExtras.diurnas.formato = formatear(objeto.horasExtras.diurnas.minutos);
        objeto.horasExtras.nocturnas.formato = formatear(objeto.horasExtras.nocturnas.minutos);
        objeto.horasExtras.total.formato = formatear(objeto.horasExtras.total.minutos);

        // Formatear recargos
        Object.keys(objeto.recargos).forEach(key => {
            if (objeto.recargos[key].minutos !== undefined) {
                objeto.recargos[key].formato = formatear(objeto.recargos[key].minutos);
            }
        });
    }

    /**
     * Validar límites legales de trabajo
     * @param {Number} horasSemanales 
     * @param {Number} horasDiarias 
     * @returns {Object} 
     */
    static validarLimitesLegales(horasSemanales, horasDiarias) {
        const validacion = {
            cumpleLimites: true,
            violaciones: [],
            advertencias: []
        };

        // Validar límite diario (8 horas)
        if (horasDiarias > this.JORNADAS.MAXIMA_DIARIA) {
            validacion.cumpleLimites = false;
            validacion.violaciones.push({
                tipo: 'LIMITE_DIARIO_EXCEDIDO',
                limite: this.JORNADAS.MAXIMA_DIARIA,
                actual: horasDiarias,
                diferencia: horasDiarias - this.JORNADAS.MAXIMA_DIARIA
            });
        }

        // Validar límite semanal (44 horas)
        if (horasSemanales > this.JORNADAS.MAXIMA_SEMANAL) {
            validacion.cumpleLimites = false;
            validacion.violaciones.push({
                tipo: 'LIMITE_SEMANAL_EXCEDIDO',
                limite: this.JORNADAS.MAXIMA_SEMANAL,
                actual: horasSemanales,
                diferencia: horasSemanales - this.JORNADAS.MAXIMA_SEMANAL
            });
        }

        // Advertencias por aproximación a límites
        if (horasDiarias > 7 && horasDiarias <= 8) {
            validacion.advertencias.push({
                tipo: 'APROXIMACION_LIMITE_DIARIO',
                mensaje: 'Aproximándose al límite diario de 8 horas'
            });
        }

        if (horasSemanales > 40 && horasSemanales <= 44) {
            validacion.advertencias.push({
                tipo: 'APROXIMACION_LIMITE_SEMANAL',
                mensaje: 'Aproximándose al límite semanal de 44 horas'
            });
        }

        return validacion;
    }

    /**
     * Calcular valor monetario de recargos
     * @param {Object} recargos 
     * @param {Number} salarioHora 
     * @returns {Object} 
     */
    static calcularValorMonetarioRecargos(recargos, salarioHora) {
        const valores = {
            nocturnoOrdinario: 0,
            extraDiurno: 0,
            extraNocturno: 0,
            dominicalDiurno: 0,
            dominicalNocturno: 0,
            totalRecargos: 0
        };

        const salarioMinuto = salarioHora / 60;

        // Calcular valor de cada tipo de recargo
        valores.nocturnoOrdinario = Math.round(recargos.nocturnoOrdinario.minutos * salarioMinuto);
        valores.extraDiurno = Math.round(recargos.extraDiurno.minutos * salarioMinuto);
        valores.extraNocturno = Math.round(recargos.extraNocturno.minutos * salarioMinuto);
        valores.dominicalDiurno = Math.round(recargos.dominicalDiurno.minutos * salarioMinuto);
        valores.dominicalNocturno = Math.round(recargos.dominicalNocturno.minutos * salarioMinuto);

        valores.totalRecargos = 
            valores.nocturnoOrdinario +
            valores.extraDiurno +
            valores.extraNocturno +
            valores.dominicalDiurno +
            valores.dominicalNocturno;

        return valores;
    }



    /**
     * Generar reporte detallado de legislación aplicada
     * @param {Object} calculos 
     * @returns {Object} 
     */
    static generarReporteLegal(calculos) {
        const reporte = {
            fecha: new Date(),
            legislacionAplicada: [],
            articulos: [],
            resumen: {}
        };


        if (calculos.metadata.esDomingoOFestivo) {
            reporte.legislacionAplicada.push('Trabajo dominical y festivo');
            reporte.articulos.push('Art. 179 CST - Trabajo en domingo y días de descanso obligatorio');
        }

        if (calculos.recargos.nocturnoOrdinario.minutos > 0) {
            reporte.legislacionAplicada.push('Trabajo nocturno ordinario');
            reporte.articulos.push('Art. 168 CST - Trabajo nocturno');
        }

        if (calculos.horasExtras.total.minutos > 0) {
            reporte.legislacionAplicada.push('Horas extras');
            reporte.articulos.push('Art. 159 CST - Trabajo suplementario');
        }

        reporte.resumen = {
            tiempoTotal: calculos.metadata.tiempoTotalHoras,
            excedeLimiteOrdinario: calculos.metadata.excedeLimiteOrdinario,
            aplicaRecargos: calculos.recargos.totalRecargos.minutos > 0,
            cumpleLegislacion: true 
        };

        return reporte;
    }
}

module.exports = ColombianLaborLawService;