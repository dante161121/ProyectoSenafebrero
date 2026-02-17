/**

 * @version 1.0.0
 * @description 
 */

class BaseDashboard {
  /**
   * @param {string} userRole - Rol del usuario ('empleado' o 'administrador')
   */
  constructor(userRole) {
    this.currentUser = null;
    this.userRole = userRole || 'empleado';
    this.isLoading = false;
    this.clockTimer = null;
    this.init();
  }
  
  init() {
    this.checkUserSession();
    this.setupLogout();
    this.startClock();
    if (typeof this.initSpecific === 'function') {
      this.initSpecific();
    }
  }
  checkUserSession() {
    try {
      if (typeof SessionManager !== 'undefined') {
        if (!SessionManager.validateSession(this.userRole)) {
          SessionManager.redirectToLogin('Acceso no autorizado o sesión expirada');
          return;
        }
        this.currentUser = SessionManager.getCurrentSession();
        this.loadUserData();
        return;
      }
      const sessionData = JSON.parse(localStorage.getItem('currentSession'));
      if (!sessionData) {
        this.redirectToLogin('No hay sesión activa');
        return;
      }
      if (sessionData.tipoUsuario !== this.userRole) {
        this.redirectToLogin(`Acceso no autorizado. Este dashboard es solo para ${this.userRole}s.`);
        return;
      }
      this.currentUser = sessionData;
      this.loadUserData();
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      this.redirectToLogin('Error de sesión');
    }
  }

  async loadUserData() {
    try {
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        console.error('No hay token de autenticación');
        this.redirectToLogin('Sesión expirada');
        return;
      }
      if (typeof EnhancedApiClient !== 'undefined') {
        try {
          const apiClient = new EnhancedApiClient();
          const response = await apiClient.getCurrentUser();
          if (response.success && response.data) {
            this.currentUser = response.data;
            console.log('Datos de usuario cargados desde backend:', this.currentUser);
            this.updateUserInterface();
            return;
          } else {
            console.error('Error al obtener datos del usuario:', response.message);
   
          }
        } catch (apiError) {
          console.error('Error de API al cargar usuario:', apiError);
        }
      }
      
      if (typeof SessionManager !== 'undefined') {
        const userData = SessionManager.getFullUserData();
        if (!userData) {
          console.error('Datos de usuario no encontrados');
          return;
        }
        
        this.currentUser = userData;
        this.updateUserInterface();
        return;
      }
      
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const userData = users.find(user => user.id === this.currentUser.id);
      if (!userData) {
        console.error('Datos de usuario no encontrados');
        return;
      }
      
      this.currentUser = userData;
      this.updateUserInterface();
      
    } catch (error) {
      console.error('Error al cargar datos de usuario:', error);
    }
  }
  
  
  updateUserInterface() {
    
    console.warn('Método updateUserInterface no implementado');
  }
  
  setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  }
  
  
  startClock() {
    const currentTime = document.getElementById('currentTime');
    const currentDate = document.getElementById('currentDate');
    
    if (!currentTime && !currentDate) return;
  
    const updateClock = () => {
      const now = new Date();
      if (currentTime) {
        currentTime.textContent = now.toLocaleTimeString('es-ES');
      }
      
      if (currentDate) {
        currentDate.textContent = now.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    };
    
    updateClock();
    
    this.clockTimer = setInterval(updateClock, 1000);
  }

  logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      if (typeof SessionManager !== 'undefined') {
        SessionManager.endSession();
        if (this.clockTimer) {
          clearInterval(this.clockTimer);
        }
        SessionManager.redirectToLogin();
        return;
      }
      localStorage.removeItem('currentSession');
      if (this.clockTimer) {
        clearInterval(this.clockTimer);
      }
      window.location.href = '../../components/auth/login.html';
    }
  }
  
  /**
   * @param {string} message 
   */
  redirectToLogin(message) {
    if (typeof SessionManager !== 'undefined') {
      SessionManager.redirectToLogin(message);
      return;
    }
    alert(message || 'Debe iniciar sesión para acceder a esta página');
    window.location.href = '../../components/auth/login.html';
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseDashboard;
}