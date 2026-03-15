/**
 * @version 1.0.0
 * @description 
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');
router.use(protect);

/**
 * @route   
 * @desc   
 * @access
 */
router.get('/user/:userId', authorize('administrador'), reportController.generateUserReport);

/**
 * @route 
 * @desc    
 * @access  
 */
router.get('/general', authorize('administrador'), reportController.generateGeneralReport);

/**
 * @route  
 * @desc   
 * @access  
 */
router.get('/download/:fileName', reportController.downloadReport);

module.exports = router;