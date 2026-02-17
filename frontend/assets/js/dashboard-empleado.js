// Dashboard para empleados
// Hereda de BaseDashboard

class EmployeeDashboard extends BaseDashboard {
  constructor() {

    super('empleado');
   
    this.employeeName = document.getElementById('employeeName');
    this.currentTime = document.getElementById('currentTime');
    this.currentDate = document.getElementById('currentDate');
    this.entryBtn = document.getElementById('entryBtn');
    this.exitBtn = document.getElementById('exitBtn');
    this.employeeRecords = document.getElementById('employeeRecords');
    this.profileName = document.getElementById('profileName');
    this.profileDoc = document.getElementById('profileDoc');
    this.profilePosition = document.getElementById('profilePosition');
    this.profileSchedule = document.getElementById('profileSchedule');
    this.profileEmail = document.getElementById('profileEmail');
    this.profileAvatar = document.getElementById('profileAvatar');
    this.photoInput = document.getElementById('photoInput') || document.getElementById('profile-photo-input');
    this.uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    this.selectedFile = null;
    this.attendanceChartCanvas = document.getElementById('attendanceChartCanvas');
    this.weeklyChartTab = document.getElementById('weeklyChartTab');
    this.monthlyChartTab = document.getElementById('monthlyChartTab');
    
    this.currentChartPeriod = 'week'; 
    this.attendanceChart = null; 
  }
  
  initSpecific() {
    console.log('Iniciando dashboard de empleado...');
    this.setupActionButtons();
    this.setupProfilePhotoUpload();
    this.loadEmployeeRecords();
    this.loadDashboardStats();
    setInterval(() => {
      this.loadDashboardStats();
    }, 30000);
    this.startClock();
    this.setupChartTabs();
    this.initializeCharts();
    
    console.log('Dashboard de empleado inicializado correctamente');
  }
  setupProfilePhotoUpload() {
    console.log('Configurando carga de foto de perfil...');
    if (!this.photoInput) {
      console.error('Input de foto no encontrado. Buscando alternativas...');
      this.photoInput = document.getElementById('profile-photo-input');
      if (!this.photoInput) {
        console.error('No se encontró ningún input de foto');
      } else {
        console.log('Input de foto encontrado con ID alternativo');
      }
    } 
    if (!this.uploadPhotoBtn) {
      console.error('Botón de upload no encontrado');
      this.uploadPhotoBtn = document.querySelector('button[id*="upload"]') || document.querySelector('button.upload-photo-btn');
    }
    if (!this.profileAvatar) {
      console.error('Avatar de perfil no encontrado');
      this.profileAvatar = document.querySelector('img[id*="avatar"]') || document.querySelector('img.profile-avatar');
    }
    if (!this.photoInput || !this.uploadPhotoBtn || !this.profileAvatar) {
      console.error('No se pudieron encontrar todos los elementos necesarios para la carga de fotos');
      return;
    }
    
    console.log('Elementos para carga de foto encontrados:', {
      photoInput: this.photoInput.id || 'sin ID',
      uploadPhotoBtn: this.uploadPhotoBtn.id || 'sin ID',
      profileAvatar: this.profileAvatar.id || 'sin ID'
    });
    this.loadProfilePhoto();
    const oldPhotoInput = this.photoInput.cloneNode(true);
    const oldUploadBtn = this.uploadPhotoBtn.cloneNode(true);
    
    if (this.photoInput.parentNode) {
      this.photoInput.parentNode.replaceChild(oldPhotoInput, this.photoInput);
      this.photoInput = oldPhotoInput;
    }
    
    if (this.uploadPhotoBtn.parentNode) {
      this.uploadPhotoBtn.parentNode.replaceChild(oldUploadBtn, this.uploadPhotoBtn);
      this.uploadPhotoBtn = oldUploadBtn;
    }
    this.photoInput.addEventListener('change', (event) => {
      console.log('Evento change detectado en input de foto');
      if (event.target.files && event.target.files[0]) {
        this.selectedFile = event.target.files[0];
        console.log('Archivo seleccionado:', this.selectedFile.name);
        if (!this.selectedFile.type.match('image.*')) {
          console.error('El archivo no es una imagen válida');
          if (typeof NotificationManager !== 'undefined') {
            NotificationManager.showToast('Por favor, seleccione una imagen válida.', 'error');
          } else {
            alert('Por favor, seleccione una imagen válida.');
          }
          this.selectedFile = null;
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          console.log('Previsualizando imagen');
          this.profileAvatar.src = e.target.result;
        };
        reader.readAsDataURL(this.selectedFile);
        this.uploadPhotoBtn.disabled = false;
      }
    });
    console.log('Agregando evento click al botón de subida');
    this.uploadPhotoBtn.addEventListener('click', (event) => {
      console.log('Botón de subida clickeado');
      event.preventDefault(); 
      this.uploadProfilePhoto();
    });
  }

  loadProfilePhoto() {
    console.log('Cargando foto de perfil para el usuario:', this.currentUser.id);
    
    try {
      const userPhotos = JSON.parse(localStorage.getItem('userProfilePhotos') || '{}');
      const photoData = userPhotos[this.currentUser.id];
      
      if (photoData) {
        console.log('Foto encontrada en localStorage');
        this.profileAvatar.src = photoData;
      } else {
        console.log('Usando imagen predeterminada');
        this.profileAvatar.src = '../../assets/img/default-profile.png';
        this.profileAvatar.onerror = () => {
          console.warn('Imagen por defecto no encontrada, intentando rutas alternativas');
          this.profileAvatar.src = '../../assets/img/default-profile.jpg';
          this.profileAvatar.onerror = () => {
            console.warn('Usando avatar genérico en base64');
            this.profileAvatar.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAFWUlEQVR4nO2dbWhdRRTHf9ea2jR9QJNaK9HWVNTUl0BtFRFBsH6pgtYXFLFoa6E+fBDxA1J98QMK+qFWFKRFRQTB1iKCYPGpgvXdtonGptVardE0Tdr6sE327vcP9xrvzZ29c87M3jibe39w2M3O7jn/s3fv3Zkzc85FURRFURRFURRFURRFURRFURRFKTFltgzHTr16HphqWzkC7NoUf1cgim0DisSmpXBjF9Q1QM1cGD4YXCe3v2G/LCKMjcDKu2D2VYfoHDhl20QlmTdbYOl66JjXIBJcZ9tEJZgNS6C9IR5YS9BqMIvUalc/H/2CiqbUB7YM541bfx2dXSmzgKUXBVYw3NO2lUtl9jRsmBvoiXVAl21blcLdN8CcqsA2sbFTYr0gVgIvBtbPnYGVu2Ffw7Tf34mWZx3WAxuCG6RQ9zQ8VE/niGlsj+WCeAl4MLCe9xGsaoD9W75sGQVGbNsuBtIFsdUM3wsuiI6qwQaDRhE8mUodNgCbwlpmHTPDfVPbE4lE09voUgNP2i6AUlE3cF/UDZQ72bL55CiqZGuWalqoOM7uwf5U2YqA8pjcOA0FIcBpKAgBTkNBCHAaCkKA01AQApyGghDgNBSEAKehIAQ4DQUhwGkoCEfxKPBeSrvbjcNxZoN7rWD+HzQjFMR1wIHIWnly4zhBHATeMLDj3EghLYFZPTP+GW3XO7oVjgHfJTR90Ti6FQ4QQxATxuEoTJ/D9OQmd9hNHw4/TmPbQXvjBOHJzYsGdiqOwhvECuBnTO/eX+nJHwbCW8QR4OtUdoU4TBsI9xBv8vIDlqoQIcLOEY8CH2Oarnc4nM4InSOGgM8TnP2UcTgKM48+l5Mf38JxkiiIR4BdMeHIOhznsJX80JaLdRGefHSREH8QzwJfEXROSRyOc9w6kR/hstD+PbPdQvxBbAZ2BNYy43Dk4T1gO7PDbyC77Z8xpL0EkV//rphNPv+KOWkkWLXAaxGtHgBeAdYGf54LvBNhfwb4wDwcZzkMdAc3SqHC0Cb+c+b5BRiO0boB+CHMcZJJ68LtSOs88GFU/UIw5/eEJt3ALVHtxQniBGbp+x3gQIz9LmB3So9bfO28EZkAHwceBFYnNHsSeD9qQCORtL3PV0T0RbYjgR4Y3mppcTLGdkVcJ6UmiPeAO8mEBCVJWpfCYQOfMOXlcAw4HNVhmgSkbRzuh5eXws+jMJRg14dZR+VtdVJJiF+XzWMwOhtO95rZWQklP8r6GbiT9K/ATwKXB9a5CaI14EajcOTRB3QS85poJgnrMI8AM6Oj7ruHg+uk9VUSxVF+Ax6z7SvRYvKroPtnFuwJrPPDlpkgfjj0WQYsMLJ9no5JcfQEt5i9R5K5zgDbzpp3Lp03iW+aBG9CshJCKbgOODTdJpLneqGy+oQTB4rzkFgDVBdlZI/XSP4/c/N8HULPjJiU4mim34HKxcDrrs8ZkCUyF8R5cAPwEWYTlK7LkvvICt3AHqL3eImTvAUIIo+6moB7jT1MgzpHFlmUPpOUOocC2+BfN05Y6hyatdekaDiBWXLO7EdaJu9QZF8qUeCxiv7gjYrO9PMDcGc68ZXJM0M6iSBrkB4n2+eZl5ofAZrdvh6bzJ17ga7ZqMB1QmUdkTuamR2+MvpOZPcfhs/sIYL2YtvfAOnj8vRBVC5dVjQ6MNOV9slAJJO0ebH5iTmZgSgXdtl2UClsTFFXW6lY6KI3OorpEJR7XHTdPz2+VnKD8+CvvsA6N78d6qQzL2wfCqzfnYuKsFPoO+RX2wYqhQeXwpIA3bnpzEpCWwOMjQTW7xkvTV0URVEURRH4B1T6ZhDtsqX/AAAAAElFTkSuQmCC';
          };
        };
      }
    } catch (error) {
      console.error('Error al cargar foto de perfil:', error);
      this.profileAvatar.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAFWUlEQVR4nO2dbWhdRRTHf9ea2jR9QJNaK9HWVNTUl0BtFRFBsH6pgtYXFLFoa6E+fBDxA1J98QMK+qFWFKRFRQTB1iKCYPGpgvXdtonGptVardE0Tdr6sE327fcP9xrvzZ29c87M3jibe39w2M3O7jn/s3fv3Zkzc85FURRFURRFURRFURRFURRFURRFKTFltgzHTr16HphqWzkC7NoUf1cgim0DisSmpXBjF9Q1QM1cGD4YXCe3v2G/LCKMjcDKu2D2VYfoHDhl20QlmTdbYOl66JjXIBJcZ9tEJZgNS6C9IR5YS9BqMIvUalc/H/2CiqbUB7YM541bfx2dXSmzgKUXBVYw3NO2lUtl9jRsmBvoiXVAl21blcLdN8CcqsA2sbFTYr0gVgIvBtbPnYGVu2Ffw7Tf34mWZx3WAxuCG6RQ9zQ8VE/niGlsj+WCeAl4MLCe9xGsaoD9W75sGQVGbNsuBtIFsdUM3wsuiI6qwQaDRhE8mUodNgCbwlpmHTPDfVPbE4lE09voUgNP2i6AUlE3cF/UDZQ72bL55CiqZGuWalqoOM7uwf5U2YqA8pjcOA0FIcBpKAgBTkNBCHAaCkKA01AQApyGghDgNBSEAKehIAQ4DQUhwGkoCEfxKPBeSrvbjcNxZoN7rWD+HzQjFMR1wIHIWnly4zhBHATeMLDj3EghLYFZPTP+GW3XO7oVjgHfJTR90Ti6FQ4QQxATxuEoTJ/D9OQmd9hNHw4/TmPbQXvjBOHJzYsGdiqOwhvECuBnTO/eX+nJHwbCW8QR4OtUdoU4TBsI9xBv8vIDlqoQIcLOEY8CH2Oarnc4nM4InSOGgM8TnP2UcTgKM48+l5Mf38JxkiiIR4BdMeHIOhznsJX80JaLdRGefHSREH8QzwJfEXROSRyOc9w6kR/hstD+PbPdQvxBbAZ2BNYy43Dk4T1gO7PDbyC77Z8xpL0EkV//rphNPv+KOWkkWLXAaxGtHgBeAdYGf54LvBNhfwb4wDwcZzkMdAc3SqHC0Cb+c+b5BRiO0boB+CHMcZJJ68LtSOs88GFU/UIw5/eEJt3ALVHtxQniBGbp+x3gQIz9LmB3So9bfO28EZkAHwceBFYnNHsSeD9qQCORtL3PV0T0RbYjgR4Y3mppcTLGdkVcJ6UmiPeAO8mEBCVJWpfCYQOfMOXlcAw4HNVhmgSkbRzuh5eXws+jMJRg14dZR+VtdVJJiF+XzWMwOhtO95rZWQklP8r6GbiT9K/ATwKXB9a5CaI14EajcOTRB3QS85poJgnrMI8AM6Oj7ruHg+uk9VUSxVF+Ax6z7SvRYvKroPtnFuwJrPPDlpkgfjj0WQYsMLJ9no5JcfQEt5i9R5K5zgDbzpp3Lp03iW+aBG9CshJCKbgOODTdJpLneqGy+oQTB4rzkFgDVBdlZI/XSP4/c/N8HULPjJiU4mim34HKxcDrrs8ZkCUyF8R5cAPwEWYTlK7LkvvICt3AHqL3eImTvAUIIo+6moB7jT1MgzpHFlmUPpOUOocC2+BfN05Y6hyatdekaDiBWXLO7EdaJu9QZF8qUeCxiv7gjYrO9PMDcGc68ZXJM0M6iSBrkB4n2+eZl5ofAZrdvh6bzJ17ga7ZqMB1QmUdkTuamR2+MvpOZPcfhs/sIYL2YtvfAOnj8vRBVC5dVjQ6MNOV9slAJJO0ebH5iTmZgSgXdtl2UClsTFFXW6lY6KI3OorpEJR7XHTdPz2+VnKD8+CvvsA6N78d6qQzL2wfCqzfnYuKsFPoO+RX2wYqhQeXwpIA3bnpzEpCWwOMjQTW7xkvTV0URVEURRH4B1T6ZhDtsqX/AAAAAElFTkSuQmCC';
    }
  }

  async uploadProfilePhoto() {
    console.log('[uploadProfilePhoto] Iniciando proceso de subida de foto');

    if (!this.photoInput) {
      this.photoInput = document.getElementById('photoInput');
      if (!this.photoInput) {
        this.showNotification('Error: No se encontró el selector de fotos', 'error');
        return;
      }
    }
    
    if (!this.uploadPhotoBtn) {
      this.uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    }

    const file = this.selectedFile || (this.photoInput.files && this.photoInput.files[0]);
    
    if (!file) {
      this.showNotification('Por favor, seleccione una imagen primero', 'warning');
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.showNotification('El archivo debe ser una imagen', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showNotification('La imagen no debe superar 5MB', 'error');
      return;
    }
    
    console.log('[uploadProfilePhoto] Archivo válido:', file.name, file.size, 'bytes');
    
    this.setUploadButtonState(true, 'Subiendo...');
    
    try {
      if (typeof window.apiService !== 'undefined' && typeof window.apiService.uploadProfilePhoto === 'function') {
        console.log('[uploadProfilePhoto] Subiendo al servidor via API');
        const response = await window.apiService.uploadProfilePhoto(this.currentUser.id, file);
        console.log('[uploadProfilePhoto] Respuesta del servidor:', response);
        const photoUrl = response.fotoPerfil ? `/uploads/${response.fotoPerfil}` : response.photoUrl;
        if (photoUrl && this.profileAvatar) {
          this.profileAvatar.src = photoUrl;
        }
        this.showNotification('Foto de perfil actualizada correctamente', 'success');
      } else {
        console.log('[uploadProfilePhoto] API no disponible, guardando en localStorage');
        await this.savePhotoLocally(file);
        this.showNotification('Foto guardada localmente', 'success');
      }
      
    } catch (error) {
      console.error('[uploadProfilePhoto] Error:', error);
      try {
        console.log('[uploadProfilePhoto] Fallback a localStorage por error');
        await this.savePhotoLocally(file);
        this.showNotification('Foto guardada localmente (sin conexión al servidor)', 'warning');
      } catch (localError) {
        console.error('[uploadProfilePhoto] Error al guardar localmente:', localError);
        this.showNotification('Error al guardar la foto', 'error');
      }
      
    } finally {
      this.setUploadButtonState(false, 'Actualizar Foto');
      if (this.photoInput) this.photoInput.value = '';
      this.selectedFile = null;
      console.log('[uploadProfilePhoto] Proceso finalizado');
    }
  }
  
  /**

   * @param {File} file 
   * @returns {Promise}
   */
  savePhotoLocally(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const userPhotos = JSON.parse(localStorage.getItem('userProfilePhotos') || '{}');
          userPhotos[this.currentUser.id] = e.target.result;
          localStorage.setItem('userProfilePhotos', JSON.stringify(userPhotos));
          
          if (this.profileAvatar) {
            this.profileAvatar.src = e.target.result;
          }
          resolve(e.target.result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * @param {boolean} loading
   * @param {string} text 
   */
  setUploadButtonState(loading, text) {
    if (this.uploadPhotoBtn) {
      this.uploadPhotoBtn.disabled = loading;
      this.uploadPhotoBtn.textContent = text;
    }
  }
  
  /**

   * @param {string} message 
   * @param {string} type 
   */
  showNotification(message, type = 'info') {
    console.log(`[Notificación ${type}]:`, message);
    if (typeof NotificationManager !== 'undefined') {
      NotificationManager.showToast(message, type);
    } else {
      alert(message);
    }
  }

  setupChartTabs() {
    if (this.weeklyChartTab) {
      this.weeklyChartTab.addEventListener('click', () => {
        this.setChartPeriod('week');
      });
    }
    
    if (this.monthlyChartTab) {
      this.monthlyChartTab.addEventListener('click', () => {
        this.setChartPeriod('month');
      });
    }
  }
  
  setChartPeriod(period) {
    this.weeklyChartTab.classList.toggle('active', period === 'week');
    this.monthlyChartTab.classList.toggle('active', period === 'month');
    this.currentChartPeriod = period;
    this.updateAttendanceChart();
  }
  
  startClock() {
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
  }
  updateDateTime() {
    const now = new Date();
    if (this.currentTime) {
      this.currentTime.textContent = now.toLocaleTimeString('es-ES');
    }
    
    if (this.currentDate) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      this.currentDate.textContent = now.toLocaleDateString('es-ES', options);
    }
  }
  
  updateUserInterface() {
    if (this.employeeName) {
      this.employeeName.textContent = this.currentUser.nombreCompleto;
    }
    
    if (this.profileName) this.profileName.textContent = this.currentUser.nombreCompleto;
    if (this.profileDoc) this.profileDoc.textContent = this.currentUser.numeroDocumento;
    if (this.profilePosition) this.profilePosition.textContent = this.currentUser.cargo || 'No especificado';
    if (this.profileSchedule) this.profileSchedule.textContent = this.currentUser.horarioAsignado || 'No especificado';
    if (this.profileEmail) this.profileEmail.textContent = this.currentUser.correoElectronico;
    if (this.profileAvatar) {
      this.loadProfilePhoto();
    }
  }
  
  setupActionButtons() {
    if (this.entryBtn) {
      console.log('Configurando botón de entrada');
      this.entryBtn.addEventListener('click', () => {
        console.log('Botón de entrada clickeado');
        this.registerAttendance('entrada');
      });
    }
    if (this.exitBtn) {
      console.log('Configurando botón de salida');
      this.exitBtn.addEventListener('click', () => {
        console.log('Botón de salida clickeado');
        this.registerAttendance('salida');
      });
    }
  }
  
  registerAttendance(type) {
    console.log('Método registerAttendance ejecutado con tipo:', type);
    try {
      if (!this.currentUser || !this.currentUser.id) {
        console.error('No hay usuario activo en la sesión');
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('Error: No hay una sesión activa', 'error');
        } else {
          alert('Error: No hay una sesión activa');
        }
        return;
      }
      
      console.log('Usuario actual:', this.currentUser);

      const actionBtn = type === 'entrada' ? this.entryBtn : this.exitBtn;
      const originalText = actionBtn.innerHTML;
      actionBtn.disabled = true;
      actionBtn.innerHTML = '<span class="loading-spinner"></span> Procesando...';
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      console.log('Registros existentes:', attendanceRecords.length);
      const today = new Date().toLocaleDateString('es-ES');
      const alreadyRegisteredToday = attendanceRecords.some(record => 
        record.userId === this.currentUser.id && 
        record.type === type && 
        new Date(record.timestamp).toLocaleDateString('es-ES') === today
      );
      
      if (alreadyRegisteredToday) {
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.showToast(`Ya ha registrado su ${type} de hoy.`, 'warning');
        } else {
            alert(`Ya ha registrado su ${type} de hoy.`);
        }
        actionBtn.disabled = false;
        actionBtn.innerHTML = originalText;
        return;
      }
      this.registerAttendanceWithStats(type)
        .then(response => {
          console.log('Registro de asistencia exitoso:', response);
          this.loadEmployeeRecords();
          this.loadDashboardStats();
          const mensaje = `${response.data.accion === 'entrada_registrada' ? 'Entrada' : 'Salida'} registrada exitosamente`;
          const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          if (typeof NotificationManager !== 'undefined') {
            NotificationManager.showToast(`${mensaje} a las ${hora}`, 'success');
          } else {
            alert(`${mensaje} a las ${hora}`);
          }
          this.updateAttendanceChart();
        })
        .catch(error => {
          console.error('Error al registrar asistencia:', error);

          if (typeof NotificationManager !== 'undefined') {
            NotificationManager.showToast('Error al registrar asistencia: ' + error.message, 'error');
          } else {
            alert('Error al registrar asistencia: ' + error.message);
          }
        })
        .finally(() => {
          actionBtn.disabled = false;
          actionBtn.innerHTML = originalText;
        });
        
    } catch (error) {
      console.error('Error general al registrar asistencia:', error);
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showToast('Error al registrar la asistencia. Por favor, intente nuevamente.', 'error');
      } else {
        alert('Error al registrar la asistencia. Por favor, intente nuevamente.');
      }
    }
  }
  async registerAttendanceWithStats(type) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa');
      }
      const response = await fetch('/api/stats/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: type,
          timestamp: new Date().toISOString(),
          location: null 
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar asistencia');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en registerAttendanceWithStats:', error);
      throw error;
    }
  }
  async loadDashboardStats() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/stats/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Error al cargar estadísticas del dashboard');
        return;
      }

      const data = await response.json();
      this.updateDashboardDisplay(data.data);
    } catch (error) {
      console.error('Error al cargar estadísticas del dashboard:', error);
    }
  }

  updateDashboardDisplay(stats) {
    try {
      const tiempoHoyElement = document.getElementById('tiempoTrabajadoHoy');
      if (tiempoHoyElement && stats.hoy) {
        tiempoHoyElement.textContent = stats.hoy.estadisticas.tiempoTotal.formato || '00:00';
      }

      const promedioSemanalElement = document.getElementById('promedioSemanal');
      if (promedioSemanalElement && stats.semana) {
        const promedio = stats.semana.promedioHorasDiarias || 0;
        promedioSemanalElement.textContent = `${promedio.toFixed(1)}h`;
      }

      const diasMesElement = document.getElementById('diasTrabajadosMes');
      if (diasMesElement && stats.mes) {
        diasMesElement.textContent = stats.mes.diasTrabajados || 0;
      }

      const sesionActivaElement = document.getElementById('sesionActiva');
      if (sesionActivaElement) {
        if (stats.sesionActiva) {
          sesionActivaElement.innerHTML = `
            <div class="status-working">
              <i class="fas fa-play-circle text-success"></i>
              <span>Trabajando (${stats.sesionActiva.duracionActual?.formato || '00:00'})</span>
            </div>
          `;
        } else {
          sesionActivaElement.innerHTML = `
            <div class="status-idle">
              <i class="fas fa-pause-circle text-muted"></i>
              <span>Sin sesión activa</span>
            </div>
          `;
        }
      }
      this.updateStatsCards(stats);
      if (stats.graficas) {
        this.updateChartsWithRealData(stats.graficas);
      }

    } catch (error) {
      console.error('Error al actualizar visualización del dashboard:', error);
    }
  }

  updateStatsCards(stats) {
    const cardTiempoHoy = document.querySelector('.stat-card[data-stat="tiempo-hoy"]');
    if (cardTiempoHoy && stats.hoy) {
      const valueElement = cardTiempoHoy.querySelector('.stat-value');
      const percentElement = cardTiempoHoy.querySelector('.stat-percentage');
      
      if (valueElement) {
        valueElement.textContent = stats.hoy.estadisticas.tiempoTotal.formato || '00:00';
      }
      
      if (percentElement && stats.hoy.estadisticas.estadisticas) {
        const porcentaje = stats.hoy.estadisticas.estadisticas.cumplimientoJornada?.porcentajeCumplimiento || 0;
        percentElement.textContent = `${porcentaje}%`;
        percentElement.className = 'stat-percentage';
        if (porcentaje >= 100) {
          percentElement.classList.add('text-success');
        } else if (porcentaje >= 80) {
          percentElement.classList.add('text-warning');
        } else {
          percentElement.classList.add('text-danger');
        }
      }
    }
    const cardHorasExtras = document.querySelector('.stat-card[data-stat="horas-extras"]');
    if (cardHorasExtras && stats.hoy) {
      const valueElement = cardHorasExtras.querySelector('.stat-value');
      if (valueElement) {
        valueElement.textContent = stats.hoy.estadisticas.horasExtras?.total?.formato || '00:00';
      }
    }
    const cardDiasMes = document.querySelector('.stat-card[data-stat="dias-mes"]');
    if (cardDiasMes && stats.mes) {
      const valueElement = cardDiasMes.querySelector('.stat-value');
      if (valueElement) {
        valueElement.textContent = stats.mes.diasTrabajados || 0;
      }
    }

    const cardPromedio = document.querySelector('.stat-card[data-stat="promedio-semanal"]');
    if (cardPromedio && stats.semana) {
      const valueElement = cardPromedio.querySelector('.stat-value');
      if (valueElement) {
        const promedio = stats.semana.promedioHorasDiarias || 0;
        valueElement.textContent = `${promedio.toFixed(1)}h`;
      }
    }
  }

  async updateChartsWithRealData(graphData) {
    try {
      if (!this.attendanceChart || !graphData) return;

      const chartData = {
        labels: graphData.labels || [],
        datasets: [
          {
            label: 'Horas Trabajadas',
            data: graphData.datasets.horasTrabajadas || [],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Horas Extras',
            data: graphData.datasets.horasExtras || [],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          },
          {
            label: 'Recargos (horas)',
            data: graphData.datasets.recargos || [],
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.4
          }
        ]
      };
      this.attendanceChart.data = chartData;
      this.attendanceChart.options.scales.y.title.text = 'Horas';
      this.attendanceChart.update('active');

      console.log('Gráficas actualizadas con datos reales');
    } catch (error) {
      console.error('Error al actualizar gráficas con datos reales:', error);
    }
  }
  async loadChartDataFromAPI(days = 7) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(`/api/stats/charts?days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Error al cargar datos de gráficas');
        return null;
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error al cargar datos de gráficas desde la API:', error);
      return null;
    }
  }
  
  loadEmployeeRecords() {
    try {
      if (!this.employeeRecords) return;

      this.employeeRecords.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Cargando registros...</p>';

      if (typeof window.apiService !== 'undefined' && typeof window.apiService.getAttendanceRecords === 'function') {
        window.apiService.getAttendanceRecords(this.currentUser.id)
          .then(response => {
            const records = response.records || [];
            this.renderEmployeeRecords(records);
            if (response.mode === 'offline' && typeof NotificationManager !== 'undefined') {
              NotificationManager.showToast('Mostrando registros en modo offline', 'info');
            }
          })
          .catch(error => {
            console.error('Error al obtener registros desde API:', error);
            this.loadEmployeeRecordsFromLocalStorage();
          });
      } else {
        this.loadEmployeeRecordsFromLocalStorage();
      }
    } catch (error) {
      console.error('Error al cargar registros de empleado:', error);
      this.employeeRecords.innerHTML = '<p>Error al cargar los registros.</p>';
    }
  }

  loadEmployeeRecordsFromLocalStorage() {
    try {
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      const employeeRecords = attendanceRecords.filter(
        record => record.userId === this.currentUser.id
      );
      this.renderEmployeeRecords(employeeRecords);
      
    } catch (error) {
      console.error('Error al cargar registros desde localStorage:', error);
      this.employeeRecords.innerHTML = '<p>Error al cargar los registros.</p>';
    }
  }

  renderEmployeeRecords(records) {
    if (!this.employeeRecords) return;
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (records.length === 0) {
      this.employeeRecords.innerHTML = '<p>No hay registros disponibles.</p>';
      return;
    }

    let recordsHTML = '<div class="records-table"><table class="records-table">';
    recordsHTML += '<thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th></tr></thead><tbody>';
    
    records.forEach(record => {
      const typeClass = record.type === 'entrada' ? 'entry-record' : 'exit-record';
      const typeIcon = record.type === 'entrada' ? '<i class="fas fa-sign-in-alt"></i>' : '<i class="fas fa-sign-out-alt"></i>';
      const typeLabel = record.type.charAt(0).toUpperCase() + record.type.slice(1);
      
      recordsHTML += `
        <tr class="${typeClass}">
          <td><i class="fas fa-calendar-day"></i> ${record.date}</td>
          <td><i class="fas fa-clock"></i> ${record.time}</td>
          <td>${typeIcon} ${typeLabel}</td>
        </tr>
      `;
    });
    
    recordsHTML += '</tbody></table></div>';
    this.employeeRecords.innerHTML = recordsHTML;
  }
  
  initializeCharts() {
    if (!this.attendanceChartCanvas) return;
    const ctx = this.attendanceChartCanvas.getContext('2d');
    this.attendanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Registros'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Día'
            }
          }
        }
      }
    });
    this.updateAttendanceChart();
  }
  
  updateAttendanceChart() {
    if (!this.attendanceChart) return;
    this.attendanceChart.data = {
      labels: ['Cargando datos...'],
      datasets: []
    };
    this.attendanceChart.update();
    const days = this.currentChartPeriod === 'week' ? 7 : 30;
    this.loadChartDataFromAPI(days)
      .then(chartData => {
        if (chartData) {
          this.updateChartsWithRealData(chartData);
        } else {
          this.updateChartWithLocalData();
        }
      })
      .catch(error => {
        console.error('Error al cargar datos de gráficas:', error);
        this.updateChartWithLocalData();
      });
  }
  
  updateChartWithApiData(stats) {
    let chartData;
    
    if (this.currentChartPeriod === 'week') {
      chartData = {
        labels: stats.dailyStats.map(day => day.label || day.day),
        datasets: [
          {
            label: 'Entradas',
            data: stats.dailyStats.map(day => day.entries),
            backgroundColor: 'rgba(40, 167, 69, 0.7)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'Salidas',
            data: stats.dailyStats.map(day => day.exits),
            backgroundColor: 'rgba(220, 53, 69, 0.7)',
            borderColor: 'rgba(220, 53, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'Horas Trabajadas',
            data: stats.dailyStats.map(day => day.workHours),
            backgroundColor: 'rgba(255, 193, 7, 0.7)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 1,
            type: 'line'
          }
        ]
      };
    } else {
      chartData = {
        labels: stats.dailyStats.map(day => day.day),
        datasets: [
          {
            label: 'Entradas',
            data: stats.dailyStats.map(day => day.entries),
            backgroundColor: 'rgba(40, 167, 69, 0.7)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'Salidas',
            data: stats.dailyStats.map(day => day.exits),
            backgroundColor: 'rgba(220, 53, 69, 0.7)',
            borderColor: 'rgba(220, 53, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'Horas Trabajadas',
            data: stats.dailyStats.map(day => day.workHours),
            backgroundColor: 'rgba(255, 193, 7, 0.7)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 1,
            type: 'line'
          }
        ]
      };
    }
    
    // Actualizar gráfica del dashboard
    this.attendanceChart.data = chartData;
    this.attendanceChart.options.scales.x.title.text = 
      this.currentChartPeriod === 'week' ? 'Día de la semana' : 'Día del mes';
    this.attendanceChart.update();
    
    // Mostrar indicador 
    if (stats.mode === 'offline') {
      if (typeof NotificationManager !== 'undefined') {
        NotificationManager.showToast('Mostrando estadísticas en modo offline', 'info');
      }
    }
  }
  
  // Método para actualizar gráfica con datos 
  updateChartWithLocalData() {
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const employeeRecords = attendanceRecords.filter(
      record => record.userId === this.currentUser.id
    );
    
    if (employeeRecords.length === 0) {
      this.attendanceChart.data = {
        labels: ['No hay datos disponibles'],
        datasets: []
      };
      this.attendanceChart.update();
      return;
    }
    let chartData;
    if (this.currentChartPeriod === 'week') {
      chartData = this.prepareWeeklyChartData(employeeRecords);
    } else {
      chartData = this.prepareMonthlyChartData(employeeRecords);
    }
    this.attendanceChart.data = chartData;
    this.attendanceChart.options.scales.x.title.text = 
      this.currentChartPeriod === 'week' ? 'Día de la semana' : 'Día del mes';
    this.attendanceChart.update();
  }

  prepareWeeklyChartData(records) {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const days = [];
    const entriesData = [];
    const exitsData = [];
    const workHoursData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(firstDayOfWeek);
      currentDate.setDate(firstDayOfWeek.getDate() + i);
      const dateString = currentDate.toLocaleDateString('es-ES');
      const dayRecords = records.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.toLocaleDateString('es-ES') === dateString;
      });
      const entries = dayRecords.filter(r => r.type === 'entrada').length;
      const exits = dayRecords.filter(r => r.type === 'salida').length;
      let workHours = 0;
      if (entries > 0 && exits > 0) {
       workHours = Math.min(entries, exits) * 8; 
      }
      
      days.push(dayNames[i]);
      entriesData.push(entries);
      exitsData.push(exits);
      workHoursData.push(workHours);
    }

    return {
      labels: days,
      datasets: [
        {
          label: 'Entradas',
          data: entriesData,
          backgroundColor: 'rgba(40, 167, 69, 0.7)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1
        },
        {
          label: 'Salidas',
          data: exitsData,
          backgroundColor: 'rgba(220, 53, 69, 0.7)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 1
        },
        {
          label: 'Horas Trabajadas',
          data: workHoursData,
          backgroundColor: 'rgba(255, 193, 7, 0.7)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1
        }
      ]
    };
  }
  
  prepareMonthlyChartData(records) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    const entriesData = [];
    const exitsData = [];
    const workHoursData = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(currentYear, currentMonth, i);
      const dateString = currentDate.toLocaleDateString('es-ES');
      const dayRecords = records.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.toLocaleDateString('es-ES') === dateString;
      });
      const entries = dayRecords.filter(r => r.type === 'entrada').length;
      const exits = dayRecords.filter(r => r.type === 'salida').length;
      let workHours = 0;
      if (entries > 0 && exits > 0) {
        workHours = Math.min(entries, exits) * 8; 
      }
      days.push(i); 
      entriesData.push(entries);
      exitsData.push(exits);
      workHoursData.push(workHours);
    }

    return {
      labels: days,
      datasets: [
        {
          label: 'Entradas',
          data: entriesData,
          backgroundColor: 'rgba(40, 167, 69, 0.7)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1
        },
        {
          label: 'Salidas',
          data: exitsData,
          backgroundColor: 'rgba(220, 53, 69, 0.7)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 1
        },
        {
          label: 'Horas Trabajadas',
          data: workHoursData,
          backgroundColor: 'rgba(255, 193, 7, 0.7)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 1,
          type: 'line'
        }
      ]
    };
  }
  
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.employeeDashboard = new EmployeeDashboard();
  });
} else {
  window.employeeDashboard = new EmployeeDashboard();
}
