/**
 * @version 2.0.0
 * @description 
 */

class PathManager {
  /**
   * @returns {string} 
   */
  static getBaseUrl() {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/`;
  }

  /**
   * @returns {string} 
   */
  static getCurrentPathPrefix() {
    const currentPath = window.location.pathname.toLowerCase();
    
    console.log(' PathManager: Detectando ruta actual:', currentPath);
    const baseUrl = this.getBaseUrl();
    console.log(' PathManager: Base URL detectada:', baseUrl);
    return baseUrl;
  }
  
  /**
   * @param {string} componentPath 
   * @returns {string} 
   */
  static getComponentPath(componentPath) {
    const baseUrl = this.getCurrentPathPrefix();
    const fullPath = `${baseUrl}components/${componentPath}`;
    console.log(' PathManager: Ruta de componente generada:', fullPath);
    return fullPath;
  }
  
  /**
   * @param {string} assetPath 
   * @returns {string} 
   */
  static getAssetPath(assetPath) {
    const baseUrl = this.getCurrentPathPrefix();
    const fullPath = `${baseUrl}assets/${assetPath}`;
    console.log(' PathManager: Ruta de asset generada:', fullPath);
    return fullPath;
  }
  
  /**
   * @param {string} pagePath 
   * @returns {string} 
   */
  static getPagePath(pagePath) {
    const baseUrl = this.getCurrentPathPrefix();
    const fullPath = `${baseUrl}proyectopages/${pagePath}`;
    console.log(' PathManager: Ruta de página generada:', fullPath);
    return fullPath;
  }
  
  /**
   * @param {string} userType
   */
  static navigateToDashboard(userType) {
    console.log(' PathManager: Navegando al dashboard para usuario tipo:', userType);
    
    const dashboardPaths = {
      empleado: 'empleado/dashboard-empleado.html',
      administrador: 'admin/dashboard-admin.html'
    };
    
    const path = dashboardPaths[userType] || dashboardPaths.empleado;
    const fullUrl = this.getComponentPath(path);
    
    console.log(' PathManager: Redirigiendo a dashboard:', fullUrl);
    window.location.href = fullUrl;
  }
  
  /**
   * @param {string} message 
   */
  static navigateToLogin(message = null) {
    console.log(' PathManager: Navegando al login');
    if (message) {
      console.log(' PathManager: Mensaje:', message);
      alert(message);
    }
    const fullUrl = this.getComponentPath('auth/login.html');
    console.log(' PathManager: Redirigiendo a login:', fullUrl);
    window.location.href = fullUrl;
  }
  
  /**
   * Redirige al usuario a la página de registro
   */
  static navigateToRegister() {
    console.log(' PathManager: Navegando al registro');
    const fullUrl = this.getComponentPath('auth/registro.html');
    console.log(' PathManager: Redirigiendo a registro:', fullUrl);
    window.location.href = fullUrl;
  }
  
  /**
   * Redirige al usuario a la página principal
   */
  static navigateToHome() {
    console.log(' PathManager: Navegando al home');
    const fullUrl = this.getPagePath('index.html');
    console.log(' PathManager: Redirigiendo a home:', fullUrl);
    window.location.href = fullUrl;
  }

  /**
   * @returns {string} - URL limpia
   */
  static getCurrentCleanUrl() {
    return window.location.origin + window.location.pathname;
  }

  /**

   * @param {string} pageName
   * @returns {boolean} 
   */
  static isCurrentPage(pageName) {
    const currentPath = window.location.pathname.toLowerCase();
    return currentPath.includes(pageName.toLowerCase());
  }

  /**
   * Método para debuggear rutas
   */
  static debugPaths() {
    console.group(' PathManager Debug Info');
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    console.log('Base URL:', this.getBaseUrl());
    console.log('Current path prefix:', this.getCurrentPathPrefix());
    console.log('Dashboard Admin URL:', this.getComponentPath('admin/dashboard-admin.html'));
    console.log('Dashboard Empleado URL:', this.getComponentPath('empleado/dashboard-empleado.html'));
    console.log('Login URL:', this.getComponentPath('auth/login.html'));
    console.groupEnd();
  }

  /**
   * @param {string} modulePath 
   * @returns {Promise} 
   */
  static async loadModule(modulePath) {
    console.log(' PathManager: Cargando módulo:', modulePath);
    
    try {
      const fullPath = this.getAssetPath('js/' + modulePath);
      console.log(' PathManager: Ruta completa del módulo:', fullPath);
      const script = document.createElement('script');
      script.type = 'module';
      script.src = fullPath;
      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log(' PathManager: Módulo cargado exitosamente:', modulePath);
          resolve(script);
        };
        
        script.onerror = (error) => {
          console.error(' PathManager: Error cargando módulo:', modulePath, error);
          reject(error);
        };
        
        document.head.appendChild(script);
      });
      
    } catch (error) {
      console.error(' PathManager: Error al cargar módulo:', error);
      throw error;
    }
  }

  /**
   * Inicializa PathManager y ejecuta diagnósticos
   */
  static init() {
    console.log(' PathManager: Inicializando...');
    window.addEventListener('popstate', (event) => {
      console.log(' PathManager: Cambio de ruta detectado:', event);
    });
    this.debugPaths();
    
    console.log(' PathManager: Inicialización completada');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PathManager.init());
} else {
  PathManager.init();
}

if (typeof window !== 'undefined') {
  window.PathManager = PathManager;
}

export default PathManager;