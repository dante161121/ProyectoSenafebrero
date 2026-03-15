/**
 * @version 2.0.0
 * @description 
 */

class PathManager {
  static getKnownRootFolders() {
    return ['assets', 'components', 'proyectopages'];
  }

  static getRouteDefinitions() {
    return {
      home: { type: 'page', path: 'index.html' },
      login: { type: 'component', path: 'auth/login.html' },
      register: { type: 'component', path: 'auth/registro.html' },
      recovery: { type: 'component', path: 'auth/recuperar-password.html' },
      'dashboard-empleado': { type: 'component', path: 'empleado/dashboard-empleado.html' },
      'dashboard-admin': { type: 'component', path: 'admin/dashboard-admin.html' }
    };
  }

  /**
   * @returns {string} 
   */
  static getBaseUrl() {
    const origin = window.location.origin;
    const pathname = window.location.pathname.replace(/\\/g, '/');
    const segments = pathname.split('/').filter(Boolean);
    const knownRootFolders = this.getKnownRootFolders();
    const rootFolderIndex = segments.findIndex(segment => {
      return knownRootFolders.includes(segment.toLowerCase());
    });

    if (rootFolderIndex === -1) {
      return `${origin}/`;
    }

    const baseSegments = segments.slice(0, rootFolderIndex);
    const basePath = baseSegments.length > 0 ? `/${baseSegments.join('/')}/` : '/';
    return `${origin}${basePath}`;
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

  static buildUrl(type, relativePath, section = null) {
    const normalizedPath = relativePath.replace(/^\/+/, '');
    let fullPath = '';

    if (type === 'component') {
      fullPath = `${this.getCurrentPathPrefix()}components/${normalizedPath}`;
    } else if (type === 'page') {
      fullPath = `${this.getCurrentPathPrefix()}proyectopages/${normalizedPath}`;
    } else if (type === 'asset') {
      fullPath = `${this.getCurrentPathPrefix()}assets/${normalizedPath}`;
    } else {
      throw new Error(`Tipo de ruta no soportado: ${type}`);
    }

    if (section) {
      return `${fullPath}#${section}`;
    }

    return fullPath;
  }

  static getRouteUrl(routeName, options = {}) {
    const routeDefinitions = this.getRouteDefinitions();
    const route = routeDefinitions[routeName];

    if (!route) {
      throw new Error(`Ruta no registrada en PathManager: ${routeName}`);
    }

    return this.buildUrl(route.type, route.path, options.section || null);
  }

  static navigateToRoute(routeName, options = {}) {
    const fullUrl = this.getRouteUrl(routeName, options);

    console.log(' PathManager: Redirigiendo a ruta registrada:', routeName, fullUrl);
    window.location.href = fullUrl;
  }
  
  /**
   * @param {string} componentPath 
   * @returns {string} 
   */
  static getComponentPath(componentPath) {
    const fullPath = this.buildUrl('component', componentPath);
    console.log(' PathManager: Ruta de componente generada:', fullPath);
    return fullPath;
  }
  
  /**
   * @param {string} assetPath 
   * @returns {string} 
   */
  static getAssetPath(assetPath) {
    const fullPath = this.buildUrl('asset', assetPath);
    console.log(' PathManager: Ruta de asset generada:', fullPath);
    return fullPath;
  }
  
  /**
   * @param {string} pagePath 
   * @returns {string} 
   */
  static getPagePath(pagePath) {
    const fullPath = this.buildUrl('page', pagePath);
    console.log(' PathManager: Ruta de página generada:', fullPath);
    return fullPath;
  }
  
  /**
   * @param {string} userType
   */
  static navigateToDashboard(userType) {
    console.log(' PathManager: Navegando al dashboard para usuario tipo:', userType);
    
    const dashboardRoutes = {
      empleado: 'dashboard-empleado',
      administrador: 'dashboard-admin'
    };
    
    const routeName = dashboardRoutes[userType] || dashboardRoutes.empleado;
    this.navigateToRoute(routeName);
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
    this.navigateToRoute('login');
  }
  
  /**
   * Redirige al usuario a la página de registro
   */
  static navigateToRegister() {
    console.log(' PathManager: Navegando al registro');
    this.navigateToRoute('register');
  }

  static navigateToRecovery() {
    console.log(' PathManager: Navegando a recuperación de contraseña');
    this.navigateToRoute('recovery');
  }
  
  /**
   * Redirige al usuario a la página principal
   */
  static navigateToHome(section = null) {
    console.log(' PathManager: Navegando al home');
    const fullUrl = this.getRouteUrl('home', { section });
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
    console.log('Register URL:', this.getComponentPath('auth/registro.html'));
    console.log('Recovery URL:', this.getComponentPath('auth/recuperar-password.html'));
    console.log('Home URL:', this.getPagePath('index.html'));
    console.groupEnd();
  }

  static bindNavigation() {
    if (this.navigationBound) {
      return;
    }

    document.addEventListener('click', event => {
      const target = event.target.closest('[data-route]');

      if (!target) {
        return;
      }

      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      if (target.target === '_blank' || target.hasAttribute('download')) {
        return;
      }

      const routeName = target.dataset.route;
      const section = target.dataset.section || null;

      if (!routeName) {
        return;
      }

      event.preventDefault();
      this.navigateToRoute(routeName, { section });
    });

    this.navigationBound = true;
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
    this.bindNavigation();
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