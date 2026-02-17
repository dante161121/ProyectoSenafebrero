// Servicio API - Cliente HTTP para backend
// FIXME: Revisar URLs en producción

class EnhancedApiClient {
  // Constructor
  constructor(baseUrl = null) {
    // URL base de la API - usar puerto 5000 para el backend
    this.apiUrl = baseUrl || 'http://localhost:5000/api';
    
    // Estado de conexión
    this.isOnline = navigator.onLine;
    this.connectionTimeout = 5000; // 5 segundos timeout
    
    // Headers comunes
    this.headers = {
      'Accept': 'application/json'
    };
    
    // Configurar listeners para estado de conexión
    this._setupConnectionListeners();
  }
  
  /**
   * Configura listeners para detectar cambios en la conexión
   * @private
   */
  _setupConnectionListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this._syncOfflineData();
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showToast('Conexión restablecida. Sincronizando datos...', 'info');
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showToast('Sin conexión. Los datos se guardarán localmente.', 'warning');
      }
    });
  }
  
  /**
   * Sincroniza datos guardados offline cuando se recupera la conexión
   * @private
   */
  async _syncOfflineData() {
    try {
      // Obtener datos pendientes de sincronización
      const pendingAttendance = JSON.parse(localStorage.getItem('pendingAttendance') || '[]');
      const pendingPhotos = JSON.parse(localStorage.getItem('pendingPhotos') || '[]');
      
      // Sincronizar registros de asistencia
      for (const record of pendingAttendance) {
        try {
          await this.registerAttendance(record.userId, record.type, record.timestamp, true);
        } catch (error) {
          console.error('Error al sincronizar registro de asistencia:', error);
        }
      }
      
      // Sincronizar fotos pendientes
      for (const photoData of pendingPhotos) {
        try {
          // Convertir base64 a Blob para enviar al servidor
          const response = await fetch(photoData.photoUrl);
          const blob = await response.blob();
          const file = new File([blob], `profile_${photoData.userId}.jpg`, { type: 'image/jpeg' });
          
          await this.uploadProfilePhoto(photoData.userId, file, true);
        } catch (error) {
          console.error('Error al sincronizar foto de perfil:', error);
        }
      }
      
      // Limpiar datos pendientes
      localStorage.removeItem('pendingAttendance');
      localStorage.removeItem('pendingPhotos');
      
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showToast('Datos sincronizados correctamente', 'success');
      }
    } catch (error) {
      console.error('Error durante la sincronización:', error);
    }
  }
  
  /**
   * Verifica si hay conexión con el servidor
   * @returns {Promise<boolean>} - True si hay conexión, false si no
   */
  async checkServerConnection() {
    if (!this.isOnline) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.connectionTimeout);
      
      // Usar el endpoint health del backend
      const healthUrl = this.apiUrl.replace('/api', '/health');
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('No se pudo conectar con el servidor:', error);
      return false;
    }
  }
  
  /**
   * Obtiene el token JWT del almacenamiento local
   * @returns {string|null} - Token JWT o null si no existe
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }
  
  /**
   * Agrega el token de autenticación a los headers
   * @returns {Object} - Headers con token de autenticación
   */
  getAuthHeaders() {
    const token = this.getAuthToken();
    return token ? { ...this.headers, 'Authorization': `Bearer ${token}` } : this.headers;
  }
  
  // MÉTODOS DE AUTENTICACIÓN
  
  /**
   * Inicia sesión de usuario
   * @param {Object} credentials - Credenciales de login
   * @param {string} credentials.email - Correo electrónico
   * @param {string} credentials.password - Contraseña
   * @param {string} credentials.adminCode - Código de administrador (opcional)
   * @returns {Promise} - Datos del usuario y token
   */
  async login(credentials) {
    try {
      const { email, password, adminCode } = credentials;
      
      // Verificar conexión
      const serverAvailable = await this.checkServerConnection();
      
      if (serverAvailable) {
        // Preparar datos para enviar al backend
        const loginData = { 
          correoElectronico: email, 
          password 
        };

        // Si se proporciona código de administrador, incluirlo
        if (adminCode) {
          loginData.codigoAdmin = adminCode;
        }

        // Intentar login con el servidor
        const response = await this.post('/auth/login', loginData);
        
        // Guardar token
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        
        // Retornar en el formato esperado por el frontend
        return {
          success: true,
          data: {
            user: response.user,
            token: response.token
          },
          message: 'Login exitoso'
        };
      } else {
        // Modo offline: verificar credenciales en localStorage
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const user = users.find(u => 
          u.correoElectronico === email && 
          u.password === SecurityManager.hashPassword(password)
        );
        
        if (!user) {
          return {
            success: false,
            message: 'Credenciales incorrectas'
          };
        }
        
        return {
          success: true,
          data: {
            user: { ...user, password: undefined },
            token: null
          },
          message: 'Login exitoso (modo offline)'
        };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: error.message || 'Error al iniciar sesión'
      };
    }
  }
  
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise} - Usuario creado
   */
  async register(userData) {
    try {
      // Verificar conexión
      const serverAvailable = await this.checkServerConnection();
      
      if (serverAvailable) {
        // Registrar en el servidor
        return await this.post('/auth/register', userData);
      } else {
        // Modo offline: guardar en localStorage
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // Verificar si el correo ya existe
        if (users.some(u => u.correoElectronico === userData.correoElectronico)) {
          throw new Error('El correo electrónico ya está registrado');
        }
        
        // Crear ID único
        userData.id = `user_${Date.now()}`;
        
        // Hashear contraseña si SecurityManager está disponible
        if (typeof SecurityManager !== 'undefined') {
          userData.password = SecurityManager.hashPassword(userData.password);
        }
        
        // Guardar usuario
        users.push(userData);
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        
        return {
          user: { ...userData, password: undefined },
          mode: 'offline'
        };
      }
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene los datos del usuario actual
   * @returns {Promise} - Datos del usuario actual
   */
  async getCurrentUser() {
    try {
      // Verificar si hay token de autenticación
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Verificar conexión con el servidor
      const serverAvailable = await this.checkServerConnection();
      
      if (serverAvailable) {
        // Obtener datos del servidor
        return await this.get('/auth/me');
      } else {
        // Modo offline: obtener de localStorage usando el token decodificado
        try {
          // Decodificar el token para obtener el ID del usuario
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userId = payload.userId;
          
          // Buscar el usuario en localStorage
          const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
          const user = users.find(u => u.id === userId);
          
          if (!user) {
            throw new Error('Usuario no encontrado en datos locales');
          }
          
          return {
            success: true,
            data: { ...user, password: undefined }
          };
        } catch (decodeError) {
          throw new Error('Token inválido');
        }
      }
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // MÉTODOS DE ASISTENCIA
  
  /**
   * Registra entrada o salida del empleado
   * @param {string} userId - ID del usuario
   * @param {string} type - Tipo de registro ('entrada' o 'salida')
   * @param {string} timestamp - Timestamp ISO (opcional, usa la fecha actual si no se proporciona)
   * @param {boolean} skipOfflineStorage - Si es true, no guarda en localStorage (para sincronización)
   * @returns {Promise} - Registro creado
   */
  async registerAttendance(userId, type, timestamp = null, skipOfflineStorage = false) {
    try {
      // Validar tipo
      if (!['entrada', 'salida'].includes(type)) {
        throw new Error('Tipo de registro inválido. Debe ser "entrada" o "salida"');
      }
      
      // Usar timestamp proporcionado o crear uno nuevo
      const recordTime = timestamp ? new Date(timestamp) : new Date();
      
      // Preparar datos del registro
      const attendanceData = {
        userId,
        type,
        timestamp: recordTime.toISOString(),
        date: recordTime.toLocaleDateString('es-ES'),
        time: recordTime.toLocaleTimeString('es-ES')
      };
      
      // Verificar conexión
      const serverAvailable = await this.checkServerConnection();
      
      if (serverAvailable) {
        // Registrar en el servidor
        const response = await this.post('/attendance', attendanceData);
        
        // Guardar también en localStorage para acceso rápido
        this._saveAttendanceToLocalStorage(attendanceData);
        
        return response;
      } else {
        // Modo offline: guardar en localStorage
        attendanceData.id = `att_${Date.now()}`;
        this._saveAttendanceToLocalStorage(attendanceData);
        
        // Guardar para sincronización posterior, a menos que skipOfflineStorage sea true
        if (!skipOfflineStorage) {
          const pendingAttendance = JSON.parse(localStorage.getItem('pendingAttendance') || '[]');
          pendingAttendance.push(attendanceData);
          localStorage.setItem('pendingAttendance', JSON.stringify(pendingAttendance));
        }
        
        return {
          ...attendanceData,
          mode: 'offline'
        };
      }
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      throw error;
    }
  }
  
  /**
   * Guarda un registro de asistencia en localStorage
   * @param {Object} attendanceData - Datos del registro
   * @private
   */
  _saveAttendanceToLocalStorage(attendanceData) {
    try {
      // Obtener registros actuales
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      
      // Añadir nuevo registro
      attendanceRecords.push({
        ...attendanceData,
        id: attendanceData.id || `att_${Date.now()}`
      });
      
      // Guardar registros actualizados
      localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    } catch (error) {
      console.error('Error al guardar registro en localStorage:', error);
    }
  }
  
  /**
   * Obtiene los registros de asistencia de un empleado
   * @param {string} userId - ID del usuario
   * @param {Object} filters - Filtros de búsqueda (fechaInicio, fechaFin, tipo)
   * @returns {Promise} - Registros encontrados
   */
  async getAttendanceRecords(userId, filters = {}) {
    try {
      // Construir query string para filtros
      const queryParams = new URLSearchParams();
      if (filters.fechaInicio) queryParams.append('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) queryParams.append('fechaFin', filters.fechaFin);
      if (filters.tipo) queryParams.append('tipo', filters.tipo);
      
      // Verificar conexión
      const serverAvailable = await this.checkServerConnection();
      
      if (serverAvailable) {
        // Obtener del servidor
        const endpoint = `/attendance/${userId}?${queryParams.toString()}`;
        return await this.get(endpoint);
      } else {
        // Modo offline: obtener de localStorage
        const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
        
        // Filtrar por usuario
        let records = attendanceRecords.filter(record => record.userId === userId);
        
        // Aplicar filtros adicionales
        if (filters.fechaInicio) {
          const startDate = new Date(filters.fechaInicio);
          records = records.filter(record => new Date(record.timestamp) >= startDate);
        }
        
        if (filters.fechaFin) {
          const endDate = new Date(filters.fechaFin);
          records = records.filter(record => new Date(record.timestamp) <= endDate);
        }
        
        if (filters.tipo) {
          records = records.filter(record => record.type === filters.tipo);
        }
        
        return {
          records,
          mode: 'offline'
        };
      }
    } catch (error) {
      console.error('Error al obtener registros de asistencia:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene las estadísticas de asistencia para un rango de fechas
   * @param {string} userId - ID del usuario
   * @param {string} period - Período ('week' o 'month')
   * @returns {Promise} - Estadísticas de asistencia
   */
  async getAttendanceStats(userId, period = 'week') {
    try {
      // Verificar conexión
      const serverAvailable = await this.checkServerConnection();
      
      if (serverAvailable) {
        // Obtener del servidor
        return await this.get(`/attendance/stats/${userId}?period=${period}`);
      } else {
        // Modo offline: calcular estadísticas localmente
        const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
        
        // Filtrar por usuario
        const records = attendanceRecords.filter(record => record.userId === userId);
        
        // Determinar fechas de inicio y fin según período
        const today = new Date();
        let startDate, endDate;
        
        if (period === 'week') {
          // Primera fecha de la semana actual (domingo)
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          startDate.setHours(0, 0, 0, 0);
          
          // Última fecha de la semana actual (sábado)
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Primer día del mes actual
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          
          // Último día del mes actual
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
        }
        
        // Filtrar registros por rango de fechas
        const filteredRecords = records.filter(record => {
          const recordDate = new Date(record.timestamp);
          return recordDate >= startDate && recordDate <= endDate;
        });
        
        // Procesar estadísticas (estructura simplificada)
        const stats = {
          period,
          totalEntries: filteredRecords.filter(r => r.type === 'entrada').length,
          totalExits: filteredRecords.filter(r => r.type === 'salida').length,
          dailyStats: [],
          mode: 'offline'
        };
        
        return stats;
      }
    } catch (error) {
      console.error('Error al obtener estadísticas de asistencia:', error);
      throw error;
    }
  }
  
  // MÉTODOS DE GESTIÓN DE PERFIL
  
  /**
   * Sube una foto de perfil
   * @param {string} userId - ID del usuario
   * @param {File} file - Archivo de imagen
   * @param {boolean} skipOfflineStorage - Si es true, no guarda en localStorage (para sincronización)
   * @returns {Promise} - URL de la foto subida
   */
  async uploadProfilePhoto(userId, file, skipOfflineStorage = false) {
    try {
      // Verificar conexión
      const serverAvailable = await this.checkServerConnection();
      
      if (serverAvailable) {
        // Subir al servidor
        const formData = new FormData();
        formData.append('fotoPerfil', file);
        
        const response = await this.uploadFile(`/users/${userId}/profile-photo`, formData);
        
        // Guardar también en localStorage para acceso rápido
        this._savePhotoToLocalStorage(userId, file);
        
        return response;
      } else {
        // Modo offline: guardar en localStorage
        const photoUrl = await this._savePhotoToLocalStorage(userId, file);
        
        // Guardar para sincronización posterior, a menos que skipOfflineStorage sea true
        if (!skipOfflineStorage) {
          const pendingPhotos = JSON.parse(localStorage.getItem('pendingPhotos') || '[]');
          pendingPhotos.push({
            userId,
            photoUrl,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('pendingPhotos', JSON.stringify(pendingPhotos));
        }
        
        return {
          photoUrl,
          mode: 'offline'
        };
      }
    } catch (error) {
      console.error('Error al subir foto de perfil:', error);
      throw error;
    }
  }
  
  /**
   * Guarda una foto en localStorage
   * @param {string} userId - ID del usuario
   * @param {File} file - Archivo de imagen
   * @returns {Promise<string>} - URL de la foto guardada
   * @private
   */
  async _savePhotoToLocalStorage(userId, file) {
    console.log('Guardando foto en localStorage para usuario:', userId);
    
    return new Promise((resolve, reject) => {
      try {
        // Si file es un string de datos (base64), guardarlo directamente
        if (typeof file === 'string' && file.startsWith('data:image')) {
          console.log('Guardando datos de imagen ya procesados');
          try {
            const userPhotos = JSON.parse(localStorage.getItem('userProfilePhotos') || '{}');
            userPhotos[userId] = file;
            localStorage.setItem('userProfilePhotos', JSON.stringify(userPhotos));
            resolve(file);
          } catch (error) {
            console.error('Error al guardar datos de imagen en localStorage:', error);
            reject(error);
          }
          return;
        }
        
        // Si file es un objeto File, procesarlo
        if (file instanceof File || file instanceof Blob) {
          console.log('Procesando objeto File/Blob para guardar en localStorage');
          const reader = new FileReader();
          
          reader.onload = (e) => {
            try {
              // Guardar en localStorage
              console.log('Archivo leído correctamente, guardando en localStorage');
              const userPhotos = JSON.parse(localStorage.getItem('userProfilePhotos') || '{}');
              userPhotos[userId] = e.target.result;
              localStorage.setItem('userProfilePhotos', JSON.stringify(userPhotos));
              
              resolve(e.target.result);
            } catch (error) {
              console.error('Error al guardar en localStorage:', error);
              reject(error);
            }
          };
          
          reader.onerror = (error) => {
            console.error('Error al leer el archivo:', error);
            reject(error);
          };
          
          reader.readAsDataURL(file);
          return;
        }
        
        // Si no es ninguno de los anteriores, rechazar
        console.error('Tipo de datos no compatible para guardar como foto:', typeof file);
        reject(new Error('Formato de datos no válido para guardar como foto'));
      } catch (error) {
        console.error('Error general al guardar foto en localStorage:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Actualiza los datos del perfil de usuario
   * @param {string} userId - ID del usuario
   * @param {Object} profileData - Datos actualizados del perfil
   * @returns {Promise} - Usuario actualizado
   */
  async updateProfile(userId, profileData) {
    try {
      // Verificar conexión
      const serverAvailable = await this.checkServerConnection();
      
      if (serverAvailable) {
        // Actualizar en el servidor
        return await this.put(`/users/${userId}`, profileData);
      } else {
        // Modo offline: actualizar en localStorage
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        
        // Encontrar usuario
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          throw new Error('Usuario no encontrado');
        }
        
        // Actualizar datos
        users[userIndex] = {
          ...users[userIndex],
          ...profileData,
          // Evitar actualizar campos sensibles
          password: users[userIndex].password
        };
        
        // Guardar usuarios actualizados
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        
        // Actualizar sesión si es el usuario actual
        const currentSession = JSON.parse(localStorage.getItem('currentSession') || '{}');
        if (currentSession && currentSession.id === userId) {
          const updatedSession = {
            ...currentSession,
            ...profileData
          };
          localStorage.setItem('currentSession', JSON.stringify(updatedSession));
        }
        
        return {
          user: { ...users[userIndex], password: undefined },
          mode: 'offline'
        };
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }
  
  // IMPLEMENTACIÓN DE MÉTODOS HTTP BASE
  
  /**
   * Realiza una solicitud GET a la API
   * @param {string} endpoint - Endpoint a llamar
   * @returns {Promise} - Promesa con la respuesta
   */
  async get(endpoint) {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud');
      }
      
      return data;
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw error;
    }
  }
  
  /**
   * Realiza una solicitud POST a la API
   * @param {string} endpoint - Endpoint a llamar
   * @param {Object} body - Datos a enviar
   * @returns {Promise} - Promesa con la respuesta
   */
  async post(endpoint, body) {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud');
      }
      
      return data;
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      throw error;
    }
  }
  
  /**
   * Realiza una solicitud PUT a la API
   * @param {string} endpoint - Endpoint a llamar
   * @param {Object} body - Datos a enviar
   * @returns {Promise} - Promesa con la respuesta
   */
  async put(endpoint, body) {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'PUT',
        headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud');
      }
      
      return data;
    } catch (error) {
      console.error(`Error en PUT ${endpoint}:`, error);
      throw error;
    }
  }
  
  /**
   * Realiza una solicitud DELETE a la API
   * @param {string} endpoint - Endpoint a llamar
   * @returns {Promise} - Promesa con la respuesta
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la solicitud');
      }
      
      return data;
    } catch (error) {
      console.error(`Error en DELETE ${endpoint}:`, error);
      throw error;
    }
  }
  
  /**
   * Sube un archivo al servidor
   * @param {string} endpoint - Endpoint a llamar
   * @param {FormData} formData - Datos del formulario con el archivo
   * @returns {Promise} - Promesa con la respuesta
   */
  async uploadFile(endpoint, formData) {
    try {
      // Para subidas de archivos no incluimos Content-Type para que el navegador
      // establezca automáticamente el boundary correcto para multipart/form-data
      const headers = this.getAuthHeaders();
      delete headers['Content-Type'];
      
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'PUT',
        headers: headers,
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al subir el archivo');
      }
      
      return data;
    } catch (error) {
      console.error(`Error en uploadFile ${endpoint}:`, error);
      throw error;
    }
  }
}

// Crear una instancia global
const enhancedApiService = new EnhancedApiClient();

// Exportar la instancia como global
window.apiService = enhancedApiService;