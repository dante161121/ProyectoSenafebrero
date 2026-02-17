/**
 * IN OUT MANAGER - PATH UTILITY MODULE
 * @version 2.0.0
 * @description Módulo avanzado para manejar rutas de navegación entre páginas
 */

class PathManager {
  /**
   * Obtiene la base URL del proyecto
   * @returns {string} - URL base del proyecto
   */
  static getBaseUrl() {
    const protocol = window.location.protocol;
    const host = window.location.host;
    
    // En desarrollo con Vite, la raíz es directamente el host
    // No hay prefijo /frontend/ en la URL
    return `${protocol}//${host}/`;
  }

  /**
   * Detecta el nivel de profundidad actual en la estructura de carpetas
   * para generar rutas relativas correctas
   * @returns {string} - Prefijo de ruta relativa (e.g., '../', '../../', etc.)
   */
  static getCurrentPathPrefix() {
    const currentPath = window.location.pathname.toLowerCase();
    
    console.log(' PathManager: Detectando ruta actual:', currentPath);
    
    // Usar rutas absolutas basadas en la estructura del proyecto
    const baseUrl = this.getBaseUrl();
    console.log(' PathManager: Base URL detectada:', baseUrl);
    
    // Para simplificar, usar rutas absolutas desde la base del frontend
    return baseUrl;
  }
  
  /**
   * Genera una ruta absoluta para un archivo en la carpeta components
   * @param {string} componentPath - Ruta relativa desde components (e.g., 'auth/login.html')
   * @returns {string} - Ruta absoluta completa
   */
  static getComponentPath(componentPath) {
    const baseUrl = this.getCurrentPathPrefix();
    const fullPath = `${baseUrl}components/${componentPath}`;
    console.log(' PathManager: Ruta de componente generada:', fullPath);
    return fullPath;
  }
  
  /**
   * Genera una ruta absoluta para un archivo en la carpeta assets
   * @param {string} assetPath - Ruta relativa desde assets (e.g., 'js/script.js')
   * @returns {string} - Ruta absoluta completa
   */
  static getAssetPath(assetPath) {
    const baseUrl = this.getCurrentPathPrefix();
    const fullPath = `${baseUrl}assets/${assetPath}`;
    console.log(' PathManager: Ruta de asset generada:', fullPath);
    return fullPath;
  }
  
  /**
   * Genera una ruta absoluta para una página principal
   * @param {string} pagePath - Ruta relativa desde proyectopages (e.g., 'index.html')
   * @returns {string} - Ruta absoluta completa
   */
  static getPagePath(pagePath) {
    const baseUrl = this.getCurrentPathPrefix();
    const fullPath = `${baseUrl}proyectopages/${pagePath}`;
    console.log(' PathManager: Ruta de página generada:', fullPath);
    return fullPath;
  }
  
  /**
   * Redirige al usuario al dashboard correspondiente según su rol
   * @param {string} userType - Tipo de usuario ('empleado' o 'administrador')
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
   * Redirige al usuario a la página de login
   * @param {string} message - Mensaje opcional para mostrar
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
   * Obtiene la URL actual sin parámetros
   * @returns {string} - URL limpia
   */
  static getCurrentCleanUrl() {
    return window.location.origin + window.location.pathname;
  }

  /**
   * Verifica si estamos en una página específica
   * @param {string} pageName - Nombre de la página a verificar
   * @returns {boolean} - True si estamos en esa página
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
   * Método avanzado para cargar módulos JavaScript dinámicamente
   * @param {string} modulePath - Ruta del módulo JavaScript
   * @returns {Promise} - Promesa que se resuelve cuando el módulo se carga
   */
  static async loadModule(modulePath) {
    console.log(' PathManager: Cargando módulo:', modulePath);
    
    try {
      const fullPath = this.getAssetPath('js/' + modulePath);
      console.log(' PathManager: Ruta completa del módulo:', fullPath);
      
      // Crear elemento script dinámicamente
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
    
    // Agregar listener para cambios de ruta
    window.addEventListener('popstate', (event) => {
      console.log(' PathManager: Cambio de ruta detectado:', event);
    });
    
    // Debuggear rutas al inicializar
    this.debugPaths();
    
    console.log(' PathManager: Inicialización completada');
  }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PathManager.init());
} else {
  PathManager.init();
}

// Hacer PathManager disponible globalmente
if (typeof window !== 'undefined') {
  window.PathManager = PathManager;
}

export default PathManager;