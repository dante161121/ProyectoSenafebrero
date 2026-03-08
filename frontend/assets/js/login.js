// Módulo de Login -Proyecto Final SENA 2024
// TODO: Revisar validaciones al integrar con backend final

(function() {
    'use strict';

    const CONFIG = {
        minPasswordLength: 6,
        redirectDelay: 1000,
        loadingText: 'Cargando...',
        successMessage: 'Inicio de sesión exitoso',
        errorMessage: 'Error al iniciar sesión'
    };
    class LoginModule {
        constructor() {
            this.elements = {};
            this.selectedRole = 'empleado';
            this.isLoading = false;
        }

            // Inicializa el módulo
            init() {
                try {
                    this.cacheElements();
                    this.bindEvents();
                    this.initializeUI();
                    console.log(' Login module initialized successfully');
                } catch (error) {
                    console.error(' Error initializing login module:', error);
                }
            }

            // Cachea los elementos del DOM
            cacheElements() {
                const selectors = {
                    form: '#loginForm',
                    email: '#email',
                    password: '#password',
                    showPassword: '#showPassword',
                    roleTabs: '.role-tab',
                    submitButton: '.login-submit-btn',
                    resultMessage: '#loginResult',
                    adminCodeGroup: '#adminCodeGroup',
                    adminCode: '#adminCode',
                    roleDescription: '#roleDescription'
                };

                Object.entries(selectors).forEach(([key, selector]) => {
                    const element = selector.startsWith('.') ? 
                        document.querySelectorAll(selector) : 
                        document.querySelector(selector);
                    this.elements[key] = element;
                });

                if (!this.elements.form || !this.elements.email || !this.elements.password) {
                    throw new Error('Critical form elements not found');
                }
            }

            // Bind de eventos
            bindEvents() {
                if (this.elements.showPassword) {
                    this.elements.showPassword.addEventListener('change', (e) => {
                        this.togglePasswordVisibility(e.target.checked);
                    });
                }

                if (this.elements.roleTabs) {
                    this.elements.roleTabs.forEach(tab => {
                        tab.addEventListener('click', () => this.handleRoleChange(tab));
                        tab.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                this.handleRoleChange(tab);
                            }
                        });
                    });
                }

                this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
                this.elements.email.addEventListener('blur', () => this.validateField(this.elements.email, 'email'));
                this.elements.password.addEventListener('blur', () => this.validateField(this.elements.password, 'password'));
            }

            // Inicializa la UI
            initializeUI() {
                const defaultTab = document.querySelector(`[data-role="${this.selectedRole}"]`);
                if (defaultTab) {
                    this.handleRoleChange(defaultTab);
                }
            }

      
        handleRoleChange(tab) {
            if (!tab) return;

         
            this.elements.roleTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');

            this.selectedRole = tab.dataset.role;

            this.updateRoleDescription(this.selectedRole);

            this.toggleAdminCodeField(this.selectedRole === 'administrador');
        }

        
        updateRoleDescription(role) {
            if (!this.elements.roleDescription) return;

            const descriptions = {
                empleado: 'Ingrese sus credenciales para acceder como empleado.',
                administrador: 'Ingrese sus credenciales y código de administrador.'
            };

            this.elements.roleDescription.textContent = descriptions[role] || descriptions.empleado;
        }

      
        toggleAdminCodeField(show) {
            if (!this.elements.adminCodeGroup) return;

            this.elements.adminCodeGroup.style.display = show ? 'block' : 'none';
            
            if (this.elements.adminCode) {
                this.elements.adminCode.required = show;
                if (!show) {
                    this.elements.adminCode.value = '';
                }
            }
        }

        togglePasswordVisibility(show) {
            this.elements.password.type = show ? 'text' : 'password';
        }

        async handleSubmit(e) {
            e.preventDefault();
            console.log(' === SUBMIT DEL FORMULARIO ===');

            if (this.isLoading) {
                console.log(' Ya hay un login en proceso');
                return;
            }

            try {
                console.log(' Validando formulario...');
                if (!this.validateForm()) {
                    console.log(' Validación de formulario fallida');
                    return;
                }

                console.log(' Formulario válido, iniciando login...');
                this.setLoadingState(true);

                const formData = this.getFormData();
                console.log(' Datos del formulario:', { ...formData, password: '***' });

                await this.processLogin(formData);

            } catch (error) {
                this.showErrorMessage(CONFIG.errorMessage);
                console.error('Login error:', error);
            } finally {
                this.setLoadingState(false);
            }
        }

        async processLogin(formData) {
            try {
                console.log(' Iniciando proceso de login:', formData);
                
                // Construir URL del backend
                const backendUrl = '/api/auth/login';
                
                // Preparar datos para enviar
                const loginData = {
                    correoElectronico: formData.email,
                    password: formData.password
                };

                // Si es administrador, incluir código
                if (formData.adminCode) {
                    loginData.codigoAdmin = formData.adminCode;
                }

                console.log(' Enviando credenciales al backend:', backendUrl);
                console.log(' Datos a enviar:', { ...loginData, password: '***' });
                
                // Realizar petición al backend
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });

                console.log(' Respuesta HTTP status:', response.status);
                
                const data = await response.json();
                console.log(' Datos recibidos:', data);

                if (response.ok && data.success) {
                    const user = data.user;
                    const token = data.token;

                    console.log(' Login exitoso');
                    console.log(' Usuario:', user.nombreCompleto);
                    console.log(' Token:', token ? 'Recibido' : 'No recibido');

                    // Guardar token y sesión
                    console.log(' Guardando sesión...');
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('token', token);
                    this.saveSession(user);
                    
                    console.log(' Mostrando mensaje de éxito...');
                    this.showSuccessMessage('¡Login exitoso! Redirigiendo...');
                    
                    console.log('⏱ Programando redirección...');
                    setTimeout(() => {
                        console.log(' Redirigiendo al dashboard...');
                        this.redirectToDashboard();
                    }, CONFIG.redirectDelay);
                } else {
                    console.log(' Login fallido');
                    console.log(' Mensaje:', data.message);
                    this.showErrorMessage(data.message || 'Credenciales incorrectas');
                }
            } catch (error) {
                console.error(' Error en login:', error);
                this.showErrorMessage('Error: ' + error.message);
            }
        }
        
        saveSession(user) {
            if (typeof SessionManager !== 'undefined') {
                SessionManager.createSession(user);
            } else {
                const sessionData = {
                    id: user.id,
                    nombreCompleto: user.nombreCompleto,
                    correoElectronico: user.correoElectronico,
                    tipoUsuario: user.tipoUsuario,
                    lastLogin: new Date().toISOString()
                };
                
                localStorage.setItem('currentSession', JSON.stringify(sessionData));
            }
        }

        getFormData() {
            const data = {
                email: this.elements.email.value.trim(),
                password: this.elements.password.value,
                role: this.selectedRole
            };

            if (this.selectedRole === 'administrador' && this.elements.adminCode) {
                data.adminCode = this.elements.adminCode.value.trim();
            }

            return data;
        }

        validateForm() {
            let isValid = true;

            if (!this.validateField(this.elements.email, 'email')) {
                isValid = false;
            }

            if (!this.validateField(this.elements.password, 'password')) {
                isValid = false;
            }

            if (this.selectedRole === 'administrador' && this.elements.adminCode) {
                if (!this.validateField(this.elements.adminCode, 'adminCode')) {
                    isValid = false;
                }
            }

            return isValid;
        }

        validateField(element, type) {
            if (!element) return false;

            const value = element.value.trim();
            let isValid = true;
            let errorMessage = '';

            switch (type) {
                case 'email':
                    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!value) {
                        errorMessage = 'El email es obligatorio';
                        isValid = false;
                    } else if (!emailPattern.test(value)) {
                        errorMessage = 'Formato de email inválido';
                        isValid = false;
                    }
                    break;

                case 'password':
                    if (!value) {
                        errorMessage = 'La contraseña es obligatoria';
                        isValid = false;
                    } else if (value.length < CONFIG.minPasswordLength) {
                        errorMessage = `La contraseña debe tener al menos ${CONFIG.minPasswordLength} caracteres`;
                        isValid = false;
                    }
                    break;

                case 'adminCode':
                    if (!value) {
                        errorMessage = 'El código de administrador es obligatorio';
                        isValid = false;
                    } else if (!/^[0-9]{1,4}$/.test(value)) {
                        errorMessage = 'El código debe ser un número de máximo 4 dígitos';
                        isValid = false;
                    }
                    break;
            }

            if (!isValid) {
                this.showFieldError(element, errorMessage);
            } else {
                this.clearFieldError(element);
            }

            return isValid;
        }

        showFieldError(element, message) {

            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showFieldError(element, message);
                return;
            }
            
            this.clearFieldError(element);

            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            errorDiv.setAttribute('role', 'alert');

            element.parentElement.appendChild(errorDiv);
            element.classList.add('error');
            element.setAttribute('aria-invalid', 'true');
        }

        clearFieldError(element) {

            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.clearFieldError(element);
                return;
            }

            const errorDiv = element.parentElement.querySelector('.error-message');
            if (errorDiv) {
                errorDiv.remove();
            }
            element.classList.remove('error');
            element.setAttribute('aria-invalid', 'false');
        }

        setLoadingState(isLoading) {
            this.isLoading = isLoading;
            
            if (!this.elements.submitButton) return;

            this.elements.submitButton.disabled = isLoading;

            if (!this._loader) this._loader = null;
            
            if (isLoading) {
                if (typeof NotificationManager !== 'undefined') {
                    this._loader = NotificationManager.showLoader(CONFIG.loadingText);
                }
                
                this.elements.submitButton.innerHTML = `
                    <span class="spinner"></span>
                    <span>${CONFIG.loadingText}</span>
                `;
            } else {
                if (this._loader && typeof this._loader.hide === 'function') {
                    this._loader.hide();
                    this._loader = null;
                }
                
                this.elements.submitButton.innerHTML = `
                    <span class="btn-icon"><i class="fas fa-sign-in-alt"></i></span>
                    <span class="btn-text">Iniciar Sesión</span>
                `;
            }
        }

        showSuccessMessage(message) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showToast(message, 'success');
                return;
            }
            this.showMessage(message, 'success');
        }

        showErrorMessage(message) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showToast(message, 'error');
                return;
            }

            this.showMessage(message, 'error');
        }

        showMessage(message, type) {
            if (typeof NotificationManager !== 'undefined') {
                NotificationManager.showToast(message, type);
                return;
            }

            if (!this.elements.resultMessage) return;

            this.elements.resultMessage.className = `result-message ${type}`;
            this.elements.resultMessage.textContent = message;
            this.elements.resultMessage.setAttribute('role', 'alert');

            setTimeout(() => {
                this.elements.resultMessage.textContent = '';
                this.elements.resultMessage.className = 'result-message';
            }, 3000);
        }

        redirectToDashboard() {
            console.log(' Login: Redirigiendo al dashboard...', this.selectedRole);

            if (typeof PathManager !== 'undefined' && PathManager.navigateToDashboard) {
                console.log(' Login: Usando PathManager para redirección');
                PathManager.navigateToDashboard(this.selectedRole);
            } else if (typeof SessionManager !== 'undefined' && SessionManager.redirectToDashboard) {
                console.log(' Login: PathManager no disponible, usando SessionManager');
                SessionManager.redirectToDashboard(this.selectedRole);
            } else {
                console.log(' Login: Usando fallback con rutas relativas');
                const dashboardUrls = {
                    empleado: '../empleado/dashboard-empleado.html',
                    administrador: '../admin/dashboard-admin.html'
                };

                const url = dashboardUrls[this.selectedRole] || dashboardUrls.empleado;
                console.log(' Login: Redirigiendo a:', url);
                window.location.href = url;
            }
        }
    }

    const loginModule = new LoginModule();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => loginModule.init());
    } else {
        loginModule.init();
    }

})();
