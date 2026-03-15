// Recuperación de contraseña - TODO: mejorar UX
class RecoveryManager {
  constructor() {
    this.currentStep = 1;
    this.verificationCode = '';
    this.userData = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.showStep(1);
  }

  setupEventListeners() {
    const identityForm = document.getElementById('identityForm');
    if (identityForm) {
      identityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleIdentityForm();
      });
    }
    const verificationForm = document.getElementById('verificationForm');
    if (verificationForm) {
      verificationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleVerificationForm();
      });
    }
    const passwordForm = document.getElementById('newPasswordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePasswordForm();
      });
    }

    const resendCodeBtn = document.getElementById('resendCodeBtn');
    if (resendCodeBtn) {
      resendCodeBtn.addEventListener('click', () => {
        this.resendVerificationCode();
      });
    }
    
    const backToIdentityBtn = document.getElementById('backToIdentityBtn');
    if (backToIdentityBtn) {
      backToIdentityBtn.addEventListener('click', () => {
        this.showStep(1);
      });
    }
  }

  validateField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return false;

    const value = field.value.trim();
    let isValid = true;
    let message = '';

    switch (fieldId) {
      case 'numeroDocumento':
        if (!value) {
          isValid = false;
          message = 'El número de documento es requerido';
        } else if (!/^[0-9]{6,12}$/.test(value)) {
          isValid = false;
          message = 'Debe tener entre 6 y 12 dígitos';
        }
        break;
      
      case 'correoElectronico':
        if (!value) {
          isValid = false;
          message = 'El correo electrónico es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          isValid = false;
          message = 'Ingrese un correo válido';
        }
        break;
    }

    this.showFieldError(fieldId + 'Error', message, !isValid);
    return isValid;
  }

  showFieldError(errorId, message, show) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      if (show) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
      } else {
        errorElement.classList.remove('show');
      }
    }
  }

  handleIdentityForm() {
    const numeroDocumento = document.getElementById('numeroDocumento').value.trim();
    const correoElectronico = document.getElementById('correoElectronico').value.trim();
    const isDocumentoValid = this.validateField('numeroDocumento');
    const isCorreoValid = this.validateField('correoElectronico');

    if (!isDocumentoValid || !isCorreoValid) {
      return;
    }

    this.showMessage('identityResult', 'Verificando información...', 'info');

    fetch('/api/auth/recover-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correoElectronico, numeroDocumento })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          this.showMessage('identityResult', data.message || 'Error al verificar la información', 'error');
          return;
        }

        this.userData = { numeroDocumento, correoElectronico };

        // En modo desarrollo el backend devuelve el código directamente
        if (data.debugCode) {
          this.verificationCode = data.debugCode;
          if (typeof NotificationManager !== 'undefined') {
            NotificationManager.showToast(`CÓDIGO: ${data.debugCode} (Simulación de envío)`, 'info', 10000);
          } else {
            alert(`Para pruebas: Su código es ${data.debugCode}`);
          }
        }

        this.showMessage('identityResult', `Código enviado a ${this.maskEmail(correoElectronico)}`, 'success');
        setTimeout(() => { this.showStep(2); }, 1500);
      })
      .catch(error => {
        console.error('Error en recuperación:', error);
        this.showMessage('identityResult', 'Error al conectar con el servidor', 'error');
      });
  }

  handleVerificationForm() {
    const codigo = document.getElementById('codigoVerificacion').value.trim().toUpperCase();

    if (!codigo) {
      this.showMessage('verificationResult', 'Ingrese el código de verificación', 'error');
      return;
    }

    if (codigo.length !== 6) {
      this.showMessage('verificationResult', 'El código debe tener 6 caracteres', 'error');
      return;
    }

    this.showMessage('verificationResult', 'Verificando código...', 'info');

    fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correoElectronico: this.userData.correoElectronico,
        codigoVerificacion: codigo
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          this.showMessage('verificationResult', data.message || 'Código incorrecto', 'error');
          if (typeof NotificationManager !== 'undefined') {
            NotificationManager.showToast('El código ingresado no es válido', 'error');
          }
          return;
        }
        // Guardar el código verificado para usarlo en el paso 3
        this.verificationCode = codigo;
        this.showMessage('verificationResult', 'Código verificado correctamente', 'success');
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('Código verificado correctamente', 'success');
        }
        setTimeout(() => { this.showStep(3); }, 1000);
      })
      .catch(error => {
        console.error('Error en verificación:', error);
        this.showMessage('verificationResult', 'Error al conectar con el servidor', 'error');
      });
  }

  handlePasswordForm() {
    const nuevaPassword = document.getElementById('nuevaPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!nuevaPassword || !confirmPassword) {
      this.showMessage('passwordResult', 'Complete todos los campos', 'error');
      return;
    }

    if (nuevaPassword.length < 8) {
      this.showMessage('passwordResult', 'La contraseña debe tener al menos 8 caracteres', 'error');
      return;
    }

    if (nuevaPassword !== confirmPassword) {
      this.showMessage('passwordResult', 'Las contraseñas no coinciden', 'error');
      return;
    }

    fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correoElectronico: this.userData.correoElectronico,
        codigoVerificacion: this.verificationCode,
        newPassword: nuevaPassword
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          this.showMessage('passwordResult', data.message || 'Error al actualizar contraseña', 'error');
          return;
        }
        this.showMessage('passwordResult', '¡Contraseña actualizada correctamente!', 'success');
        if (typeof NotificationManager !== 'undefined') {
          NotificationManager.showToast('Contraseña actualizada exitosamente', 'success');
        }
        setTimeout(() => {
          if (typeof PathManager !== 'undefined') {
            PathManager.navigateToLogin();
            return;
          }
          window.location.href = 'login.html';
        }, 2000);
      })
      .catch(error => {
        console.error('Error al actualizar contraseña:', error);
        this.showMessage('passwordResult', 'Error al conectar con el servidor', 'error');
      });
  }

  showStep(step) {
    this.currentStep = step;

    const forms = ['identityForm', 'verificationForm', 'newPasswordForm'];
    forms.forEach(formId => {
      const form = document.getElementById(formId);
      if (form) {
        form.style.display = 'none';
        form.classList.remove('active');
      }
    });

    for (let i = 1; i <= 3; i++) {
      const stepElement = document.getElementById(`step${i}`);
      if (stepElement) {
        stepElement.classList.remove('active', 'completed');
        if (i < step) {
          stepElement.classList.add('completed');
        } else if (i === step) {
          stepElement.classList.add('active');
        }
      }
    }


    const formIds = ['', 'identityForm', 'verificationForm', 'newPasswordForm'];
    const currentForm = document.getElementById(formIds[step]);
    if (currentForm) {
      currentForm.style.display = 'block';
      currentForm.classList.add('active');
    }

    this.clearMessages();
  }

  showMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (container) {
      container.textContent = message;
      container.className = `result-message ${type}`;
      container.style.display = 'block';
    }
  }

  clearMessages() {
    const messageIds = ['identityResult', 'verificationResult', 'passwordResult'];
    messageIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
      }
    });
  }

  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  maskEmail(email) {
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '***' + username.slice(-1);
    return maskedUsername + '@' + domain;
  }

  resendVerificationCode() {
    if (!this.userData || !this.userData.correoElectronico) {
      this.showMessage('verificationResult', 'Error al reenviar el código. Por favor, vuelva a la primera etapa.', 'error');
      return;
    }

    fetch('/api/auth/recover-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correoElectronico: this.userData.correoElectronico,
        numeroDocumento: this.userData.numeroDocumento
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.debugCode) {
          this.verificationCode = data.debugCode;
          if (typeof NotificationManager !== 'undefined') {
            NotificationManager.showToast(`CÓDIGO NUEVO: ${data.debugCode} (Simulación de reenvío)`, 'info', 10000);
          } else {
            alert(`Para pruebas: Su nuevo código es ${data.debugCode}`);
          }
        }
        this.showMessage('verificationResult', `Nuevo código enviado a ${this.maskEmail(this.userData.correoElectronico)}`, 'success');
      })
      .catch(error => {
        console.error('Error al reenviar código:', error);
        this.showMessage('verificationResult', 'Error al reenviar el código', 'error');
      });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const recoveryManager = new RecoveryManager();
});
