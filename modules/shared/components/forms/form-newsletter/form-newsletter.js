/**
 * Form Newsletter Component
 * Suscripción al newsletter con validación y doble opt-in
 */

class FormNewsletter {
  constructor(formElement) {
    this.form = formElement;
    this.emailInput = formElement.querySelector('#newsletter-email');
    this.privacyCheckbox = formElement.querySelector('#newsletter-privacidad');
    this.submitBtn = formElement.querySelector('#btn-subscribe');
    this.successSection = formElement.querySelector('#newsletter-success');
    this.errorSection = formElement.querySelector('#newsletter-error');
    
    this.apiUrl = '/api/newsletter/suscribir';
    this.isSubmitting = false;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupValidation();
  }

  bindEvents() {
    // Form submit
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Real-time validation
    this.emailInput.addEventListener('blur', () => this.validateEmail());
    this.emailInput.addEventListener('input', () => {
      if (this.emailInput.classList.contains('error')) {
        this.validateEmail();
      }
    });

    // Privacy checkbox validation
    this.privacyCheckbox.addEventListener('change', () => {
      this.validatePrivacy();
    });

    // Remove error on focus
    this.emailInput.addEventListener('focus', () => {
      const errorElement = this.form.querySelector('[data-field="email"]');
      if (errorElement) {
        errorElement.classList.remove('show');
      }
    });
  }

  setupValidation() {
    this.validators = {
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: {
          required: 'El correo es requerido',
          pattern: 'Ingresa un email válido'
        }
      },
      privacidad: {
        required: true,
        message: {
          required: 'Debes aceptar la política de privacidad'
        }
      }
    };
  }

  validateEmail() {
    const value = this.emailInput.value.trim();
    const rules = this.validators.email;
    let isValid = true;
    let errorMessage = '';

    if (rules.required && !value) {
      isValid = false;
      errorMessage = rules.message.required;
    } else if (value && !rules.pattern.test(value)) {
      isValid = false;
      errorMessage = rules.message.pattern;
    }

    this.updateFieldUI(this.emailInput, isValid, errorMessage, 'email');
    return isValid;
  }

  validatePrivacy() {
    const isChecked = this.privacyCheckbox.checked;
    const rules = this.validators.privacidad;
    let isValid = true;
    let errorMessage = '';

    if (rules.required && !isChecked) {
      isValid = false;
      errorMessage = rules.message.required;
    }

    this.updateFieldUI(this.privacyCheckbox, isValid, errorMessage, 'privacidad');
    return isValid;
  }

  updateFieldUI(field, isValid, errorMessage, fieldName) {
    const errorElement = this.form.querySelector(`[data-field="${fieldName}"]`);
    
    if (!isValid) {
      field.classList.add('error');
      field.classList.remove('success');
      field.setAttribute('aria-invalid', 'true');
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
      }
    } else {
      field.classList.remove('error');
      if (field.value || (field.type === 'checkbox' && field.checked)) {
        field.classList.add('success');
      }
      field.setAttribute('aria-invalid', 'false');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
      }
    }
  }

  validateForm() {
    const isEmailValid = this.validateEmail();
    const isPrivacyValid = this.validatePrivacy();
    
    if (!isEmailValid) {
      this.emailInput.focus();
    } else if (!isPrivacyValid) {
      this.privacyCheckbox.focus();
    }

    return isEmailValid && isPrivacyValid;
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (this.isSubmitting) return;

    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.setLoading(true);
    this.hideError();

    try {
      const formData = {
        email: this.emailInput.value.trim().toLowerCase(),
        aceptar_privacidad: this.privacyCheckbox.checked,
        metadata: {
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }
      };

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
        this.trackEvent('newsletter_suscripcion', {
          email: formData.email
        });
      } else {
        if (result.message?.includes('ya está suscrito')) {
          this.showError('Este email ya está suscrito al newsletter.');
        } else {
          this.showError(result.message || 'Error al suscribirse. Inténtalo de nuevo.');
        }
      }

    } catch (error) {
      console.error('Error en newsletter:', error);
      this.showError('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  setLoading(loading) {
    if (loading) {
      this.submitBtn.disabled = true;
      this.submitBtn.querySelector('.btn-text').hidden = true;
      this.submitBtn.querySelector('.btn-icon').hidden = true;
      this.submitBtn.querySelector('.btn-loader').hidden = false;
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.querySelector('.btn-text').hidden = false;
      this.submitBtn.querySelector('.btn-icon').hidden = false;
      this.submitBtn.querySelector('.btn-loader').hidden = true;
    }
  }

  showSuccess() {
    // Hide form with animation
    this.form.querySelectorAll('.newsletter-header, .form-group').forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        el.style.transition = 'all 0.3s ease';
        setTimeout(() => el.hidden = true, 300);
      }, index * 50);
    });

    setTimeout(() => {
      this.submitBtn.hidden = true;
      this.errorSection.hidden = true;
      this.successSection.hidden = false;
      
      // Scroll into view if needed
      this.successSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 400);
  }

  showError(message) {
    const errorText = this.errorSection.querySelector('.error-text');
    if (errorText) {
      errorText.textContent = message;
    }
    this.errorSection.hidden = false;
    this.errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  hideError() {
    this.errorSection.hidden = true;
  }

  trackEvent(eventName, data) {
    // Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'Newsletter',
        ...data
      });
    }

    // Facebook Pixel
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', {
        content_name: 'Newsletter Subscription',
        ...data
      });
    }

    console.log(`📊 [Newsletter] ${eventName}:`, data);
  }

  // Public method to reset
  reset() {
    this.form.reset();
    this.form.querySelectorAll('.form-group').forEach(group => {
      group.hidden = false;
      group.style.opacity = '1';
      group.style.transform = 'translateY(0)';
    });
    
    this.submitBtn.hidden = false;
    this.successSection.hidden = true;
    this.errorSection.hidden = true;
    
    this.emailInput.classList.remove('error', 'success');
    this.privacyCheckbox.classList.remove('error', 'success');
    
    this.form.querySelectorAll('.form-error').forEach(error => {
      error.textContent = '';
      error.classList.remove('show');
    });
  }

  // Public method to set email
  setEmail(email) {
    this.emailInput.value = email;
    this.validateEmail();
  }

  // Public method to get email
  getEmail() {
    return this.emailInput.value.trim();
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  // Initialize main newsletter form
  const formElement = document.getElementById('form-newsletter');
  if (formElement) {
    window.formNewsletter = new FormNewsletter(formElement);
  }

  // Initialize compact variant
  const compactForm = document.getElementById('form-newsletter-compact');
  if (compactForm) {
    window.formNewsletterCompact = new FormNewsletter(compactForm);
  }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormNewsletter;
}