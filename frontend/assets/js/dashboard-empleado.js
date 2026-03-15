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
    this.profileName = document.getElementById('profileName');
    this.profileDoc = document.getElementById('profileDoc');
    this.profilePosition = document.getElementById('profilePosition');
    this.profileSchedule = document.getElementById('profileSchedule');
    this.profileEmail = document.getElementById('profileEmail');
    this.profileAvatar = document.getElementById('profileAvatar');
    this.photoInput = document.getElementById('photoInput') || document.getElementById('profile-photo-input');
    this.uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    this.selectedFile = null;
  }
  
  initSpecific() {
    console.log('Iniciando dashboard de empleado...');
    this.setupActionButtons();
    this.setupProfilePhotoUpload();
    this.startClock();
    
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
          const mensaje = `${response.data.accion === 'entrada_registrada' ? 'Entrada' : 'Salida'} registrada exitosamente`;
          const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          if (typeof NotificationManager !== 'undefined') {
            NotificationManager.showToast(`${mensaje} a las ${hora}`, 'success');
          } else {
            alert(`${mensaje} a las ${hora}`);
          }
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
  
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.employeeDashboard = new EmployeeDashboard();
  });
} else {
  window.employeeDashboard = new EmployeeDashboard();
}
