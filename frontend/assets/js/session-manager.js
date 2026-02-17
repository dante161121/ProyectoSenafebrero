/**
 * @version 2.0.0
 * @description Módulo para centralizar la gestión de sesiones en la aplicación
 */

import PathManager from './path-manager.js';

class SessionManager {
  /**
   * @param {Object} userData 
   * @returns {Object} 
   */
  static createSession(userData) {
    if (!userData || !userData.id || !userData.tipoUsuario) {
      console.error('Datos de usuario inválidos para crear sesión');
      return null;
    }

    const sessionData = {
      id: userData.id,
      nombreCompleto: userData.nombreCompleto,
      correoElectronico: userData.correoElectronico,
      tipoUsuario: userData.tipoUsuario,
      lastLogin: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      userAgent: navigator.userAgent,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hora de expiración
    };

    if (typeof SecurityManager !== 'undefined') {
      sessionData.token = SecurityManager.generateToken({
        userId: userData.id,
        tipoUsuario: userData.tipoUsuario,
        sessionId: sessionData.sessionId
      });
    }

    localStorage.setItem('currentSession', JSON.stringify(sessionData));
    this.logSessionEvent('login');
    
    return sessionData;
  }
  
  /**
   * @returns {Object|null} 
   */
  static getCurrentSession() {
    try {
      const sessionData = localStorage.getItem('currentSession');
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error al obtener la sesión actual:', error);
      return null;
    }
  }
  
  /**
   * @param {string|null} userType 
   * @returns {boolean} 
   */
  static validateSession(userType = null) {
    const session = this.getCurrentSession();
    if (!session) return false;
    if (userType && session.tipoUsuario !== userType) return false;
    if (session.expiresAt) {
      const expirationTime = new Date(session.expiresAt).getTime();
      if (Date.now() > expirationTime) {

        this.endSession();
        return false;
      }
      
      if (expirationTime - Date.now() < 600000) {
        this.updateSession({
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        });
      }
    }
    

    if (typeof SecurityManager !== 'undefined' && session.token) {
      const payload = SecurityManager.verifyToken(session.token);
      
      if (!payload || payload.userId !== session.id) {

        this.endSession();
        return false;
      }
    }

    if (session.userAgent && session.userAgent !== navigator.userAgent) {
      console.warn('Posible intento de secuestro de sesión detectado');
      this.endSession();
      return false;
    }
    
    return true;
  }
  
  /**
   * @returns {boolean} 
   */
  static endSession() {
    this.logSessionEvent('logout');
    localStorage.removeItem('currentSession');
    return true;
  }

  /**
   * @param {string} message
   */
  static logout(message = null) {
    console.log(' SessionManager: Cerrando sesión...');
    
    this.endSession();
    
    if (typeof PathManager !== 'undefined' && PathManager.navigateToLogin) {
      PathManager.navigateToLogin(message || 'Sesión cerrada correctamente.');
    } else {
      window.location.href = '../auth/login.html';
    }
  }

  /**
   * @returns {Object|null} 
   */
  static getUserData() {
    const session = this.getCurrentSession();
    if (!session) return null;
    
    return {
      id: session.id,
      nombre: session.nombreCompleto,
      correo: session.correoElectronico,
      tipo: session.tipoUsuario,
      lastLogin: session.lastLogin
    };
  }

  /**
   * @returns {boolean} - true si es administrador
   */
  static isAdmin() {
    const userData = this.getUserData();
    return userData && userData.tipo === 'administrador';
  }

  /**
   * @returns {boolean} - true si está autenticado
   */
  static isAuthenticated() {
    return this.getCurrentSession() !== null;
  }
  
  /**
   * @param {Object} newData 
   * @returns {Object|null} 
   */
  static updateSession(newData) {
    const currentSession = this.getCurrentSession();
    if (!currentSession) return null;

    const updatedSession = { ...currentSession, ...newData };
    localStorage.setItem('currentSession', JSON.stringify(updatedSession));
    
    return updatedSession;
  }
  
  /**
   * @returns {Object|null} - Datos completos del usuario o null si no se encuentra
   */
  static getFullUserData() {
    const session = this.getCurrentSession();
    if (!session) return null;
    
    try {
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      return users.find(user => user.id === session.id) || null;
    } catch (error) {
      console.error('Error al obtener datos completos del usuario:', error);
      return null;
    }
  }
  
  /**

   * @param {string} message 
   */
  static redirectToLogin(message = null) {

    if (typeof PathManager !== 'undefined') {
      PathManager.navigateToLogin(message);
      return;
    }

    if (message) {
      alert(message);
    }
    window.location.href = '../../components/auth/login.html';
  }
  
  /**
   * @param {string} userType 
   */
  static redirectToDashboard(userType) {
    console.log('SessionManager: Redirigiendo usuario tipo:', userType);
    
    if (typeof PathManager !== 'undefined') {
      PathManager.navigateToDashboard(userType);
      return;
    }
    const dashboardUrls = {
      empleado: '../empleado/dashboard-empleado.html',
      administrador: '../admin/dashboard-admin.html'
    };
    const url = dashboardUrls[userType] || dashboardUrls.empleado;
    console.log('SessionManager: Navegando a URL:', url);
    window.location.href = url;
  }
  
  
  /**

   * @private
   * @returns {string} 
   */
  static generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * @private
   * @param {string} eventType 
   */
  static logSessionEvent(eventType) {
    const session = this.getCurrentSession();
    if (!session) return;

    const sessionHistory = JSON.parse(localStorage.getItem('sessionHistory') || '[]');

    sessionHistory.push({
      userId: session.id,
      userType: session.tipoUsuario,
      eventType: eventType,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem('sessionHistory', JSON.stringify(
      sessionHistory.slice(-100)
    ));
  }
}

if (typeof window !== 'undefined') {
  window.SessionManager = SessionManager;
}

export default SessionManager;