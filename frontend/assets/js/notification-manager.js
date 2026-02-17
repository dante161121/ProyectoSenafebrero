/**
 * @version 1.0.0
 * @description 
 */

class NotificationManager {
  /**
   * @param {string} message 
   * @param {string} type 
   * @param {number} duration 
   */
  static showToast(message, type = 'info', duration = 3000) {

    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);

      toastContainer.style.position = 'fixed';
      toastContainer.style.bottom = '20px';
      toastContainer.style.right = '20px';
      toastContainer.style.zIndex = '9999';
      toastContainer.style.display = 'flex';
      toastContainer.style.flexDirection = 'column-reverse';
      toastContainer.style.gap = '10px';
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    const baseStyle = 'padding: 12px 20px; border-radius: 4px; box-shadow: 0 3px 10px rgba(0,0,0,0.2); ' +
                     'margin-bottom: 8px; font-size: 14px; display: flex; align-items: center; ' +
                     'min-width: 280px; max-width: 350px; opacity: 0; transform: translateX(50px); ' +
                     'transition: all 0.3s ease;';
    
    const typeStyles = {
      success: 'background-color: #dff2bf; color: #4F8A10; border-left: 4px solid #4F8A10;',
      error: 'background-color: #ffbaba; color: #D8000C; border-left: 4px solid #D8000C;',
      warning: 'background-color: #feefb3; color: #9F6000; border-left: 4px solid #9F6000;',
      info: 'background-color: #bde5f8; color: #00529B; border-left: 4px solid #00529B;'
    };
    
    toast.style.cssText = baseStyle + (typeStyles[type] || typeStyles.info);

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    toast.innerHTML = `
      <div style="margin-right: 10px; font-weight: bold; font-size: 18px;">${icons[type] || icons.info}</div>
      <div style="flex-grow: 1;">${message}</div>
      <div class="toast-close" style="cursor: pointer; margin-left: 10px;">×</div>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);
    const closeButton = toast.querySelector('.toast-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hideToast(toast));
    }

    if (duration > 0) {
      setTimeout(() => this.hideToast(toast), duration);
    }
    
    return toast;
  }
  
  /**
   * @param {HTMLElement} toast
   */
  static hideToast(toast) {
    if (!toast) return;
    
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    
    setTimeout(() => {
      toast.remove();
      const container = document.getElementById('toast-container');
      if (container && !container.hasChildNodes()) {
        container.remove();
      }
    }, 300);
  }
  
  /**
   * @param {string} message 
   * @param {string} title 
   * @param {string} okText 
   * @param {string} cancelText 
   * @returns {Promise<boolean>} 
   */
  static async confirm(message, title = 'Confirmar', okText = 'Aceptar', cancelText = 'Cancelar') {
    return new Promise((resolve) => {
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        resolve(confirm(message));
        return;
      }
      
      if ('showModal' in document.createElement('dialog')) {

        const dialog = document.createElement('dialog');
        dialog.className = 'confirm-dialog';

        dialog.style.cssText = 'padding: 0; border: none; border-radius: 8px; ' +
                              'box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-width: 400px; width: 90%;';

        dialog.innerHTML = `
          <div style="padding: 16px; border-bottom: 1px solid #eee;">
            <h3 style="margin: 0; font-size: 18px;">${title}</h3>
          </div>
          <div style="padding: 20px; font-size: 14px;">
            ${message}
          </div>
          <div style="padding: 16px; display: flex; justify-content: flex-end; gap: 8px; background: #f9f9f9;">
            <button id="cancelBtn" style="padding: 8px 16px; border: none; background: #e0e0e0; border-radius: 4px; cursor: pointer;">
              ${cancelText}
            </button>
            <button id="okBtn" style="padding: 8px 16px; border: none; background: #4285f4; color: white; border-radius: 4px; cursor: pointer;">
              ${okText}
            </button>
          </div>
        `;

        document.body.appendChild(dialog);
        const okBtn = dialog.querySelector('#okBtn');
        const cancelBtn = dialog.querySelector('#cancelBtn');
        
        okBtn.addEventListener('click', () => {
          dialog.close();
          dialog.remove();
          resolve(true);
        });
        cancelBtn.addEventListener('click', () => {
          dialog.close();
          dialog.remove();
          resolve(false);
        });
        dialog.showModal();
      } else {
        resolve(confirm(message));
      }
    });
  }
  
  /**
   * @param {HTMLElement} element 
   * @param {string} message 
   */
  static showFieldError(element, message) {
    if (!element) return;

    this.clearFieldError(element);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.style.cssText = 'color: #D8000C; font-size: 12px; margin-top: 4px;';
    element.classList.add('error');
    element.setAttribute('aria-invalid', 'true');
    if (element.parentElement) {
      element.parentElement.appendChild(errorDiv);
    }
  }
  
  /**
   * 
   * @param {HTMLElement} element
   */
  static clearFieldError(element) {
    if (!element || !element.parentElement) return;
    const errorDiv = element.parentElement.querySelector('.error-message');
    if (errorDiv) {
      errorDiv.remove();
    }
    element.classList.remove('error');
    element.setAttribute('aria-invalid', 'false');
  }
  
  /**
   * @param {string} message 
   * @returns {Object} 
   */
  static showLoader(message = 'Cargando...') {

    const overlay = document.createElement('div');
    overlay.className = 'loader-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; ' +
                          'background-color: rgba(0,0,0,0.5); z-index: 9999; display: flex; ' +
                          'align-items: center; justify-content: center; flex-direction: column;';
    

    const spinner = document.createElement('div');
    spinner.className = 'loader-spinner';
    spinner.style.cssText = 'border: 5px solid #f3f3f3; border-top: 5px solid #3498db; ' +
                           'border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite;';

    const messageDiv = document.createElement('div');
    messageDiv.className = 'loader-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = 'color: white; margin-top: 15px; font-size: 16px;';

    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);

    overlay.appendChild(spinner);
    overlay.appendChild(messageDiv);
    document.body.appendChild(overlay);
    
    return {
      hide: () => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          overlay.remove();
        }, 300);
      },
      updateMessage: (newMessage) => {
        messageDiv.textContent = newMessage;
      }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationManager;
}