/**
 * @version 1.0.0
 * @description 
 */

const express = require('express');
const router = express.Router();

// Importar controladores
const {
  registerAttendance,
  getUserAttendance,
  getWeeklyStats,
  getMonthlyStats,
  deleteAttendance,
  getAllAttendance
} = require('../controllers/attendanceController');


const { 
  protect, 
  authorize 
} = require('../middlewares/auth');

const { 
  attendanceRules,
  validate 
} = require('../middlewares/validation');

router.use(protect);

router.post('/', attendanceRules, validate, registerAttendance);
router.get('/user/:userId', authorize('administrador'), getUserAttendance);
router.get('/stats/weekly/:userId', authorize('administrador'), getWeeklyStats);
router.get('/stats/monthly/:userId', authorize('administrador'), getMonthlyStats);
router.get('/all', authorize('administrador'), getAllAttendance);
router.delete('/:id', authorize('administrador'), deleteAttendance);

module.exports = router;