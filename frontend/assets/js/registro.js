//Registro de usuarios - Frontend
// TODO: Agregar más validaciones


class RegistroManager {
  constructor() {
    try {
        this.form = document.getElementById('registroForm');
        this.roleTabs = document.querySelectorAll('.role-tab');
        this.tipoUsuarioInput = document.getElementById('tipoUsuario');
        this.adminFields = document.getElementById('adminFields');
        this.mensajeContainer = document.getElementById('registroMensaje');
        if (!this.form) throw new Error('Elemento del formulario no encontrado');
        
        this.init();
    } catch (error) {
        this.showMessage('Error al inicializar el formulario. Recargue la página.', 'error');
    }
  }

  init() {
    if (!this.form) return;
    
    try {
      this.setupRoleTabs();
      this.setupFormValidation();
      this.setupFormSubmission();
    } catch (error) {

    }
  }

  setupRoleTabs() {
    const roleTabs = document.querySelectorAll('.role-tab');
    const adminFields = document.getElementById('adminFields');
    const tipoUsuarioInput = document.getElementById('tipoUsuario');
    const roleDescription = document.getElementById('roleDescription');
    const codigoAdmin = document.getElementById('codigoAdmin');
    const departamento = document.getElementById('departamento');

    roleTabs.forEach(tab => {
      tab.addEventListener('click', function () {
        roleTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
          t.setAttribute('tabindex', '-1');
        });
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');
        this.setAttribute('tabindex', '0');
        const role = this.getAttribute('data-role');
        tipoUsuarioInput.value = role;
        if (role === 'administrador') {
          adminFields.style.display = 'block';
          roleDescription.innerHTML = '<span>Complete los campos adicionales para administradores.</span>';
          codigoAdmin.setAttribute('required', 'required');
          departamento.setAttribute('required', 'required');
        } else {
          adminFields.style.display = 'none';
          roleDescription.innerHTML = '<span>Complete los campos para registro de empleado.</span>';
          codigoAdmin.removeAttribute('required');
          departamento.removeAttribute('required');
        }
      });
      tab.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
  }

  setupFormValidation() {
    const inputs = this.form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    switch (field.name) {
      case 'nombreCompleto':
        if (field.required && !value) {
          isValid = false;
          errorMessage = 'El nombre completo es requerido';
        } else if (value && !/^[A-Za-zÀ-ÿ\s]{2,50}$/.test(value)) {
          isValid = false;
          errorMessage = 'Solo letras y espacios, entre 2 y 50 caracteres';
        }
        break;

      case 'numeroDocumento':
        if (field.required && !value) {
          isValid = false;
          errorMessage = 'El número de documento es requerido';
        } else if (value && !/^[0-9]{6,12}$/.test(value)) {
          isValid = false;
          errorMessage = 'Solo números, entre 6 y 12 dígitos';
        }
        break;

      case 'edad':
        if (value && (value < 18 || value > 100)) {
          isValid = false;
          errorMessage = 'La edad debe estar entre 18 y 100 años';
        }
        break;

      case 'correoElectronico':
        if (field.required && !value) {
          isValid = false;
          errorMessage = 'El correo electrónico es requerido';
        } else if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          isValid = false;
          errorMessage = 'Formato de correo electrónico inválido';
        }
        break;
      case 'telefono':
        if (value && !/^[\+]?[0-9\s\-\(\)]{7,15}$/.test(value)) {
          isValid = false;
          errorMessage = 'Formato de teléfono inválido';
        }
        break;

      case 'password':
        if (field.required && !value) {
          isValid = false;
          errorMessage = 'La contraseña es requerida';
        } else if (value && value.length < 6) {
          isValid = false;
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        }
        break;

      case 'confirmPassword':
        const passwordField = document.getElementById('password');
        if (field.required && !value) {
          isValid = false;
          errorMessage = 'Debe confirmar la contraseña';
        } else if (value && passwordField && value !== passwordField.value) {
          isValid = false;
          errorMessage = 'Las contraseñas no coinciden';
        }
        break;

      case 'codigoAdmin':
        if (this.tipoUsuarioInput.value === 'administrador' && field.required && !value) {
          isValid = false;
          errorMessage = 'El código de administrador es requerido';
        } else if (this.tipoUsuarioInput.value === 'administrador' && value && !this.validateAdminCode(value)) {
          isValid = false;
          errorMessage = 'El código debe ser un número de máximo 4 dígitos';
        }
        break;
    }

    this.showFieldValidation(field, isValid, errorMessage);
    return isValid;
  }

  showFieldValidation(field, isValid, errorMessage) {
    if (typeof NotificationManager !== 'undefined') {
      if (!isValid && errorMessage) {
        NotificationManager.showFieldError(field, errorMessage);
      } else {
        NotificationManager.clearFieldError(field);
      }
      return;
    }

    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    field.classList.remove('password-mismatch', 'password-match', 'field-error-highlight');

    if (!isValid && errorMessage) {
      const errorDiv = document.createElement('div');
      errorDiv.className = field.type === 'password' ? 'field-error password-error' : 'field-error';
      errorDiv.textContent = errorMessage;
      const inputContainer = field.closest('.input-container');
      if (inputContainer) {
        inputContainer.appendChild(errorDiv);
      } else {
        field.parentNode.appendChild(errorDiv);
      }

      field.classList.add('field-error-highlight');
      if (field.type === 'password') {
        field.classList.add('password-mismatch');
      }
    } else if (field.type === 'password' && field.value && isValid) {
      field.classList.add('password-match');
    }
  }

  clearFieldError(field) {
    if (typeof NotificationManager !== 'undefined') {
      NotificationManager.clearFieldError(field);
      return;
    }

    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    field.classList.remove('password-mismatch', 'password-match');
  }

  setupFormSubmission() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmission();
    });
  }

  async handleFormSubmission() {
    try {
      this.mensajeContainer.style.display = 'none';
      const isFormValid = this.validateForm();
      
      if (!isFormValid) {
        return;
      }
      this.showMessage('Procesando registro...', 'warning');
      const formData = this.getFormData();
      if (formData.tipoUsuario === 'administrador') {
        const isValidAdminCode = this.validateAdminCode(formData.codigoAdmin);
        if (!isValidAdminCode) {
          this.showMessage('El código de administrador debe ser un número de máximo 4 dígitos.', 'error');
          return;
        }
      }

      console.log(' Enviando registro al backend...');
      const backendUrl = '/api/auth/register';
      
      const registroData = {
        nombreCompleto: formData.nombreCompleto,
        numeroDocumento: formData.numeroDocumento,
        correoElectronico: formData.correoElectronico,
        password: formData.password,
        tipoUsuario: formData.tipoUsuario,
        edad: formData.edad ? parseInt(formData.edad) : undefined,
        cargo: formData.cargo || undefined,
        horarioAsignado: formData.horarioAsignado || undefined,
        telefono: formData.telefono || undefined,
        direccion: formData.direccion || undefined,
        fechaIngreso: formData.fechaIngreso || undefined,
        departamento: formData.departamento || undefined
      };

      if (formData.tipoUsuario === 'administrador') {
        registroData.codigoAdmin = formData.codigoAdmin;
      }

      console.log(' Datos a enviar:', { ...registroData, password: '***' });

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(registroData)
      });

      const data = await response.json();
      console.log(' Respuesta del backend:', data);

      if (response.ok && data.success) {
        console.log(' Usuario registrado en MongoDB');

        this.showMessage(
          `¡Registro exitoso! Bienvenido/a ${formData.nombreCompleto}. Su registro como ${formData.tipoUsuario} ha sido completado.`,
          'success'
        );

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);
      } else {
        console.log(' Error del backend:', data.message);
        this.showMessage(data.message || 'Error al registrar usuario', 'error');
      }

    } catch (error) {
      console.error(' Error en registro:', error);
      this.showMessage('Error al conectar con el servidor: ' + error.message, 'error');
    }
  }

  validateForm() {
    const inputs = this.form.querySelectorAll('input, select');
    let isValid = true;
    let errorFields = [];

    inputs.forEach(input => {
      const isAdminField = input.closest('#adminFields') !== null;
      const isUserAdmin = this.tipoUsuarioInput.value === 'administrador';
      if (isAdminField && !isUserAdmin) {
        return;
      }
      
      if (!this.validateField(input)) {
        isValid = false;
        errorFields.push(input.labels ? input.labels[0].textContent.trim() : input.name);
      }
    });

    if (!isValid) {
      const errorMessage = `Por favor corrija los siguientes campos: ${errorFields.join(', ')}`;
      this.showMessage(errorMessage, 'error');
    }

    return isValid;
  }

  getFormData() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value.trim();
    }

    data.fechaRegistro = new Date().toISOString();
    data.id = Date.now().toString();
    
    return data;
  }

  validateAdminCode(code) {
    if (!code) return false;
    const isNumeric = /^[0-9]+$/.test(code);
    const isValidLength = code.length <= 4 && code.length >= 1;
    const adminFields = document.getElementById('adminFields');
    if (adminFields && adminFields.style.display !== 'none') {
      this.updateRequirementCheck('digits-check', isNumeric && isValidLength);
    }

    return isNumeric && isValidLength;
  }

  updateRequirementCheck(elementId, isValid) {
    const element = document.getElementById(elementId);
    if (element) {
      const icon = element.querySelector('i');
      if (isValid) {
        icon.className = 'fas fa-check-circle';
        element.classList.add('requirement-met');
        element.classList.remove('requirement-failed');
      } else {
        icon.className = 'fas fa-times-circle';
        element.classList.add('requirement-failed');
        element.classList.remove('requirement-met');
      }
    }
  }

  isDocumentExists(documento) {
    // La validación de duplicados la maneja el backend.
    // Este método se mantiene para compatibilidad pero no bloquea el envío.
    return false;
  }

  showMessage(message, type) {
    if (typeof NotificationManager !== 'undefined') {
      NotificationManager.showToast(message, type);
      return;
    }

    this.mensajeContainer.textContent = message;
    this.mensajeContainer.className = `registro-mensaje ${type}`;
    this.mensajeContainer.style.display = 'block';

    this.mensajeContainer.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });

    if (type === 'success') {
      setTimeout(() => {
        this.mensajeContainer.style.display = 'none';
      }, 5000);
    }
  }

  resetForm() {
    this.form.reset();

    this.roleTabs.forEach(tab => tab.classList.remove('active'));
    this.roleTabs[0].classList.add('active'); // Activar "Empleado" por defecto
    this.tipoUsuarioInput.value = 'empleado';
    this.adminFields.style.display = 'none';
    const errors = this.form.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
    setTimeout(() => {
      document.querySelector('.registro-header').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 1000);
  }

}

document.addEventListener('DOMContentLoaded', () => {
  new RegistroManager();
});
