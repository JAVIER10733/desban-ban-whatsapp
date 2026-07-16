/**
 * Form Contacto Component - Versión Mejorada
 * Con validación avanzada, animaciones y mejor UX
 */

class FormContacto {
  constructor(formElement) {
    this.form = formElement;
    this.submitBtn = formElement.querySelector('#btn-submit');
    this.successSection = formElement.querySelector('#form-success');
    this.errorGlobal = formElement.querySelector('#form-error-global');
    this.resetBtn = formElement.querySelector('#btn-reset');
    this.charCounter = formElement.querySelector('#char-count');
    this.textarea = formElement.querySelector('#contacto-mensaje');
    
    this.apiUrl = '/api/contacto';
    this.isSubmitting = false;
    this.validationState = {};
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupValidation();
    this.initializeFields();
  }

  bindEvents() {
    // Form submit
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Real-time validation con debounce
    this.form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      
      // Input validation con debounce para mejor performance
      let debounceTimer;
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (input.classList.contains('error')) {
            this.validateField(input);
          }
        }, 300);
      });
    });

    // Character counter con animación
    if (this.textarea && this.charCounter) {
      this.textarea.addEventListener('input', () => this.updateCharCounter());
    }

    // Reset button
    this.resetBtn?.addEventListener('click', () => this.resetForm());

    // Phone formatting
    const phoneInput = this.form.querySelector('#contacto-telefono');
    phoneInput?.addEventListener('input', (e) => {
      e.target.value = this.formatPhone(e.target.value);
    });

    // Email formatting (auto lowercase)
    const emailInput = this.form.querySelector('#contacto-email');
    emailInput?.addEventListener('blur', () => {
      emailInput.value = emailInput.value.toLowerCase().trim();
    });

    // Remove error on focus
    this.form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
      input.addEventListener('focus', () => {
        const errorElement = this.form.querySelector(`[data-field="${input.name}"]`);
        if (errorElement) {
          errorElement.classList.remove('show');
        }
      });
    });
  }

  setupValidation() {
    this.validators = {
      nombre: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
        message: {
          required: 'El nombre es requerido',
          minLength: 'Mínimo 2 caracteres',
          maxLength: 'Máximo 100 caracteres',
          pattern: 'Solo letras y espacios'
        }
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: {
          required: 'El email es requerido',
          pattern: 'Ingresa un email válido (ej: tu@email.com)'
        }
      },
      telefono: {
        required: false,
        pattern: /^\+?[0-9\s]{10,15}$/,
        message: {
          pattern: 'Número inválido. Ej: +593 99 123 4567'
        }
      },
      categoria: {
        required: true,
        message: {
          required: 'Selecciona una categoría'
        }
      },
      asunto: {
        required: true,
        minLength: 5,
        maxLength: 200,
        message: {
          required: 'El asunto es requerido',
          minLength: 'Mínimo 5 caracteres',
          maxLength: 'Máximo 200 caracteres'
        }
      },
      mensaje: {
        required: true,
        minLength: 10,
        maxLength: 2000,
        message: {
          required: 'El mensaje es requerido',
          minLength: 'Mínimo 10 caracteres',
          maxLength: 'Máximo 2000 caracteres'
        }
      },
      privacidad: {
        required: true,
        message: {
          required: 'Debes aceptar para continuar'
        }
      }
    };
  }

  initializeFields() {
    // Initialize character counter
    if (this.textarea && this.charCounter) {
      this.charCounter.textContent = '0';
    }

    // Set default category from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const categoriaParam = urlParams.get('categoria');
    if (categoriaParam) {
      const categoriaSelect = this.form.querySelector('#contacto-categoria');
      if (categoriaSelect) {
        categoriaSelect.value = categoriaParam;
      }
    }
  }

  validateField(field) {
    const fieldName = field.name;
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();
    const rules = this.validators[fieldName];
    
    if (!rules) return true;

    let isValid = true;
    let errorMessage = '';

    // Required validation
    if (rules.required && !value) {
      isValid = false;
      errorMessage = rules.message.required;
    }

    // Min length (only if has value)
    if (isValid && value && rules.minLength && value.length < rules.minLength) {
      isValid = false;
      errorMessage = rules.message.minLength;
    }

    // Max length
    if (isValid && value && rules.maxLength && value.length > rules.maxLength) {
      isValid = false;
      errorMessage = rules.message.maxLength;
    }

    // Pattern
    if (isValid && value && rules.pattern && !rules.pattern.test(value)) {
      isValid = false;
      errorMessage = rules.message.pattern;
    }

    // Update UI and state
    this.updateFieldUI(field, isValid, errorMessage);
    this.validationState[fieldName] = isValid;
    
    // Check if form is now valid
    this.checkFormValidity();
    
    return isValid;
  }

  updateFieldUI(field, isValid, errorMessage) {
    const errorElement = this.form.querySelector(`[data-field="${field.name}"]`);
    
    if (!isValid) {
      field.classList.add('error');
      field.classList.remove('success');
      field.setAttribute('aria-invalid', 'true');
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
        errorElement.setAttribute('aria-live', 'polite');
      }
    } else {
      field.classList.remove('error');
      if (field.value.trim()) {
        field.classList.add('success');
      } else {
        field.classList.remove('success');
      }
      field.setAttribute('aria-invalid', 'false');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
      }
    }
  }

  updateCharCounter() {
    if (!this.textarea || !this.charCounter) return;
    
    const count = this.textarea.value.length;
    const max = 2000;
    const warning = 1800;
    
    this.charCounter.textContent = `${count}/${max}`;
    
    // Update color based on length
    this.charCounter.classList.remove('warning', 'good');
    if (count > warning) {
      this.charCounter.classList.add('warning');
    } else if (count > 100) {
      this.charCounter.classList.add('good');
    }
  }

  checkFormValidity() {
    const allValid = Object.values(this.validationState).every(v => v === true);
    const allFilled = Object.keys(this.validators).every(key => {
      const field = this.form.querySelector(`[name="${key}"]`);
      if (!field) return true;
      if (this.validators[key].required) {
        const value = field.type === 'checkbox' ? field.checked : field.value.trim();
        return value;
      }
      return true;
    });

    this.submitBtn.disabled = !(allValid && allFilled);
  }

  validateForm() {
    const fields = this.form.querySelectorAll('[name]');
    let isValid = true;
    let firstErrorField = null;

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
        if (!firstErrorField) {
          firstErrorField = field;
        }
      }
    });

    if (firstErrorField) {
      firstErrorField.focus();
    }

    return isValid;
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (this.isSubmitting) return;

    // Validate form
    if (!this.validateForm()) {
      this.scrollToFirstError();
      return;
    }

    this.isSubmitting = true;
    this.setLoading(true);
    this.hideGlobalError();

    try {
      const formData = this.getFormData();
      
      // Add retry logic
      const response = await this.fetchWithRetry(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      }, 3);

      const result = await response.json();

      if (response.ok && result.success) {
        this.showSuccess();
        this.trackEvent('contacto_enviado', {
          categoria: formData.categoria,
          asunto: formData.asunto
        });
        
        // Save to localStorage for analytics
        this.saveToLocalStorage(formData);
      } else {
        this.showGlobalError(result.message || 'Error al enviar. Inténtalo de nuevo.');
      }

    } catch (error) {
      console.error('Error al enviar formulario:', error);
      
      let errorMessage = 'Error de conexión. ';
      
      if (error.name === 'TypeError') {
        errorMessage += 'Verifica tu conexión a internet.';
      } else {
        errorMessage += 'Inténtalo de nuevo en unos minutos.';
      }
      
      this.showGlobalError(errorMessage);
      
      this.trackEvent('contacto_error', {
        error: error.message,
        categoria: formData?.categoria
      });
    } finally {
      this.isSubmitting = false;
      this.setLoading(false);
    }
  }

  async fetchWithRetry(url, options, retries = 3) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (retries > 0) {
        console.log(`Reintentando... (${retries} intentos restantes)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  getFormData() {
    const formData = new FormData(this.form);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Add metadata
    data.metadata = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Add UTM parameters if present
    const urlParams = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      if (urlParams.has(param)) {
        data.metadata[param] = urlParams.get(param);
      }
    });

    return data;
  }

  setLoading(loading) {
    if (loading) {
      this.submitBtn.disabled = true;
      this.submitBtn.setAttribute('aria-busy', 'true');
      
      const btnText = this.submitBtn.querySelector('.btn-text');
      const btnIcon = this.submitBtn.querySelector('.btn-icon');
      const btnLoader = this.submitBtn.querySelector('.btn-loader');
      
      if (btnText) btnText.hidden = true;
      if (btnIcon) btnIcon.hidden = true;
      if (btnLoader) btnLoader.hidden = false;
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.setAttribute('aria-busy', 'false');
      
      const btnText = this.submitBtn.querySelector('.btn-text');
      const btnIcon = this.submitBtn.querySelector('.btn-icon');
      const btnLoader = this.submitBtn.querySelector('.btn-loader');
      
      if (btnText) btnText.hidden = false;
      if (btnIcon) btnIcon.hidden = false;
      if (btnLoader) btnLoader.hidden = true;
    }
  }

  showSuccess() {
    // Hide form fields with animation
    this.form.querySelectorAll('.form-group').forEach((group, index) => {
      setTimeout(() => {
        group.style.opacity = '0';
        group.style.transform = 'translateX(-20px)';
        group.style.transition = 'all 0.3s ease';
        setTimeout(() => group.hidden = true, 300);
      }, index * 50);
    });
    
    setTimeout(() => {
      this.submitBtn.hidden = true;
      this.errorGlobal.hidden = true;
      this.successSection.hidden = false;
      
      // Scroll to success message with smooth animation
      this.successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Trigger confetti effect (optional)
      this.triggerConfetti();
    }, 500);
  }

  triggerConfetti() {
    // Simple confetti effect (can be enhanced with library)
    const colors = ['#25D366', '#128C7E', '#f5f5f5'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-10px';
      confetti.style.zIndex = '9999';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      document.body.appendChild(confetti);
      
      const animation = confetti.animate([
        { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
        { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], {
        duration: 2000 + Math.random() * 2000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
      
      animation.onfinish = () => confetti.remove();
    }
  }

  showGlobalError(message) {
    const errorElement = this.errorGlobal.querySelector('.error-message');
    if (errorElement) {
      errorElement.textContent = message;
    }
    this.errorGlobal.hidden = false;
    this.errorGlobal.setAttribute('aria-live', 'assertive');
    
    this.errorGlobal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  hideGlobalError() {
    this.errorGlobal.hidden = true;
    this.errorGlobal.removeAttribute('aria-live');
  }

  scrollToFirstError() {
    const firstError = this.form.querySelector('.form-error.show');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add shake animation to the field
      const field = firstError.parentElement.querySelector('.form-input, .form-select, .form-textarea');
      if (field) {
        field.style.animation = 'shakeError 0.5s ease';
        setTimeout(() => field.style.animation = '', 500);
      }
    }
  }

  resetForm() {
    // Reset form data
    this.form.reset();
    
    // Show all fields
    this.form.querySelectorAll('.form-group').forEach(group => {
      group.hidden = false;
      group.style.opacity = '1';
      group.style.transform = 'translateX(0)';
    });
    
    this.submitBtn.hidden = false;
    this.successSection.hidden = true;
    this.errorGlobal.hidden = true;
    
    // Reset character counter
    if (this.charCounter) {
      this.charCounter.textContent = '0/2000';
      this.charCounter.classList.remove('warning', 'good');
    }

    // Clear validation states
    this.form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
      field.classList.remove('error', 'success');
      field.setAttribute('aria-invalid', 'false');
    });

    this.form.querySelectorAll('.form-error').forEach(error => {
      error.textContent = '';
      error.classList.remove('show');
    });

    // Reset validation state
    this.validationState = {};
    this.checkFormValidity();

    // Scroll to top with smooth animation
    this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  formatPhone(value) {
    // Remove non-numeric characters except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Add space after country code if present
    if (cleaned.startsWith('+')) {
      const countryCode = cleaned.slice(0, 4);
      const rest = cleaned.slice(4);
      if (rest.length > 0) {
        cleaned = `${countryCode} ${rest}`;
      }
    }
    
    return cleaned;
  }

  trackEvent(eventName, data) {
    // Google Analytics 4
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'Formulario',
        event_label: 'Contacto',
        ...data
      });
    }

    // Facebook Pixel
    if (typeof fbq === 'function') {
      fbq('track', 'Contact', {
        content_name: 'Formulario Contacto',
        ...data
      });
    }

    // Console log for development
    if (window.location.hostname === 'localhost') {
      console.log(`📊 [Analytics] ${eventName}:`, data);
    }
  }

  saveToLocalStorage(data) {
    try {
      const submissions = JSON.parse(localStorage.getItem('contacto_submissions') || '[]');
      submissions.push({
        ...data,
        submittedAt: new Date().toISOString()
      });
      
      // Keep only last 10 submissions
      if (submissions.length > 10) {
        submissions.shift();
      }
      
      localStorage.setItem('contacto_submissions', JSON.stringify(submissions));
    } catch (error) {
      console.warn('No se pudo guardar en localStorage:', error);
    }
  }

  // Public method to reset from outside
  reset() {
    this.resetForm();
  }

  // Public method to set field value
  setFieldValue(fieldName, value) {
    const field = this.form.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.value = value;
      this.validateField(field);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Public method to get form data without submitting
  getData() {
    return this.getFormData();
  }

  // Public method to check if form is valid
  isValid() {
    return this.validateForm();
  }

  // Public method to submit programmatically
  submit() {
    this.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  // Cleanup method
  destroy() {
    // Remove event listeners if needed
    this.form = null;
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const formElement = document.getElementById('form-contacto');
  if (formElement) {
    window.formContacto = new FormContacto(formElement);
    
    // Expose for debugging
    if (window.location.hostname === 'localhost') {
      console.log('✅ Form Contacto initialized');
    }
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormContacto;
}