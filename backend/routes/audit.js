/**
 * @version 1.0.0
 * @description 
 */

const express = require('express');
const router = express.Router();

const {
  getAuditLogs,
  getEntityAuditLogs,
  getAuditLogById
} = require('../controllers/auditController');

const { protect, authorize } = require('../middlewares/auth');
router.use(protect);
router.use(authorize('administrador'));
router.get('/', getAuditLogs);
router.get('/log/:id', getAuditLogById);
router.get('/:entidad/:entidadId', getEntityAuditLogs);

module.exports = router;