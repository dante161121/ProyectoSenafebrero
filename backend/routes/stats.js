const express = require('express');
const router = express.Router();
const StatsController = require('../controllers/StatsController');
const { protect } = require('../middlewares/auth');

// REGISTRO DE ASISTENCIA 

/**
 * @route   
 * @desc    
 * @access 
 * @body   
 */
router.post('/attendance', protect, async (req, res) => {
    return await StatsController.registrarAsistencia(req, res);
});

// DASHBOARD Y RESÚMENES 

/**
 * @route   
 * @desc    
 * @access  
 * @returns 
 */
router.get('/dashboard', protect, async (req, res) => {
    return await StatsController.obtenerDashboard(req, res);
});

/**
 * @route  
 * @desc    
 * @access 
 * @returns 
 */
router.get('/today', protect, async (req, res) => {
    return await StatsController.obtenerEstadisticasHoy(req, res);
});

/**
 * @route   
 * @desc    
 * @access  
 * @returns 
 */
router.get('/weekly', protect, async (req, res) => {
    return await StatsController.obtenerEstadisticasSemanales(req, res);
});

/**
 * @route   
 * @desc    
 * @access 
 * @returns 
 */
router.get('/monthly', protect, async (req, res) => {
    return await StatsController.obtenerEstadisticasMensuales(req, res);
});

//  GRÁFICAS Y VISUALIZACIÓN 

/**
 * @route   
 * @desc    
 * @access  
 * @query   
 * @returns 
 */
router.get('/charts', protect, async (req, res) => {
    return await StatsController.obtenerDatosGraficas(req, res);
});

// = SESIONES DE TRABAJO =

/**
 * @route   
 * @desc    
 * @access  
 * @returns 
 */
router.get('/active-session', protect, async (req, res) => {
    return await StatsController.obtenerSesionActiva(req, res);
});

/**
 * @route   
 * @desc    
 * @access  
 * @query   
 * @returns 
 */
router.get('/sessions', protect, async (req, res) => {
    return await StatsController.obtenerHistoricoSesiones(req, res);
});

/**
 * @route   
 * @desc    
 * @access  
 * @returns 
 */
router.get('/sessions/:sessionId', protect, async (req, res) => {
    return await StatsController.obtenerDetalleSesion(req, res);
});

//  MIGRACIÓN Y MANTENIMIENTO 

/**
 * @route  
 * @desc    
 * @access  
 * @body    
 * @returns 
 */
router.post('/migrate', protect, async (req, res) => {
    return await StatsController.migrarRegistros(req, res);
});

/**
 * @route   
 * @desc    
 * @access  
 * @returns 
 */
router.get('/validate', protect, async (req, res) => {
    return await StatsController.validarIntegridad(req, res);
});

// LEGISLACIÓN Y CÁLCULOS 

/**
 * @route   
 * @desc    
 * @access  
 * @returns 
 */
router.get('/labor-law-info', protect, async (req, res) => {
    return await StatsController.obtenerInfoLegislacion(req, res);
});

/**
 * @route   
 * @desc    
 * @access  
 * @body    
 * @returns 
 */
router.post('/calculate-overtime', protect, async (req, res) => {
    return await StatsController.calcularRecargos(req, res);
});

//  RENDIMIENTO DEL SISTEMA =

/**
 * @route   
 * @desc    
 * @access  
 * @returns 
 */
router.get('/system-performance', protect, async (req, res) => {
    return await StatsController.obtenerRendimientoSistema(req, res);
});

module.exports = router;