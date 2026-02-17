// Servicio de auditoría
// Registra actividades

const Audit = require('../models/Audit');

  // Servicio para manejo de registros de auditoría
class AuditService {
  // Registrar acción
  static async registrarAccion(usuario, entidad, entidadId, accion, detalles = {}, req = null) {
    try {
      // Datos básicos del registro de auditoría
      const registroAuditoria = {
        usuarioId: usuario._id,
        nombreUsuario: usuario.nombreCompleto,
        tipoUsuario: usuario.tipoUsuario,
        entidad,
        entidadId,
        accion,
        detalles
      };

      // Si se proporcionó el objeto de solicitud, extraer IP y user agent
      if (req) {
        registroAuditoria.ipAddress = this.obtenerIP(req);
        registroAuditoria.userAgent = req.headers['user-agent'];
      }

      // Crear y guardar el registro de auditoría
      await Audit.create(registroAuditoria);
    } catch (error) {
      // No detener la ejecución en caso de error, solo registrar
      console.error('Error al registrar auditoría:', error);
    }
  }

  /**
   * Obtiene la dirección IP del cliente
   * @param {Object} req - Objeto de solicitud Express
   * @returns {string} Dirección IP
   */
  static obtenerIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           req.connection.socket?.remoteAddress || 
           '0.0.0.0';
  }

  /**
   * Registra cambios en un objeto, comparando versiones anterior y nueva
   * @param {Object} usuario - Usuario que realiza la acción
   * @param {string} entidad - Tipo de entidad afectada
   * @param {string|ObjectId} entidadId - ID de la entidad afectada
   * @param {Object} objAnterior - Estado anterior del objeto
   * @param {Object} objNuevo - Nuevo estado del objeto
   * @param {Object} req - Objeto de solicitud Express (opcional)
   */
  static async registrarCambios(usuario, entidad, entidadId, objAnterior, objNuevo, req = null) {
    // Detectar campos modificados
    const cambios = this.detectarCambios(objAnterior, objNuevo);
    
    if (Object.keys(cambios).length > 0) {
      // Registrar la acción de actualización
      await this.registrarAccion(
        usuario, 
        entidad, 
        entidadId, 
        'actualizar', 
        { cambios }, 
        req
      );
    }
  }

  /**
   * Detecta diferencias entre dos objetos
   * @param {Object} objAnterior - Estado anterior del objeto
   * @param {Object} objNuevo - Nuevo estado del objeto
   * @returns {Object} Objeto con los cambios detectados
   */
  static detectarCambios(objAnterior, objNuevo) {
    const cambios = {};
    
    // Recorrer propiedades del objeto nuevo
    Object.keys(objNuevo).forEach(key => {
      // Excluir campos sensibles o técnicos
      if (['password', '__v', '_id', 'createdAt', 'updatedAt'].includes(key)) {
        return;
      }
      
      // Comparar valores
      if (JSON.stringify(objAnterior[key]) !== JSON.stringify(objNuevo[key])) {
        cambios[key] = {
          anterior: objAnterior[key],
          nuevo: objNuevo[key]
        };
      }
    });
    
    return cambios;
  }
}

module.exports = AuditService;