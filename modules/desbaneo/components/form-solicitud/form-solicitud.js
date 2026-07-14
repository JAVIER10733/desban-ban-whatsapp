/**
 * form-solicitud.js — Formulario de solicitud de desbaneo
 * Versión profesional con validación, multi-step y UX avanzada
 */
'use strict';

class FormSolicitud {
  constructor(formElement) {
    this.form = formElement;
    this.currentStep = 1;
    this.totalSteps = 4;
    this.formData = {};
    this.plans = {
      'pro': 39,
      'premium': 59,
      'business-pro': 99,
      'enterprise': 199
    };
    this.discount = 0;
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.setupValidation();
    this.loadPlanFromURL();
  }

  cacheElements() {
    this.steps = this.form.querySelectorAll('.form-step');
    this.nextButtons = this.form.querySelectorAll('.btn-next');
    this.prevButtons = this.form.querySelectorAll('.btn-prev');
    this.submitButton = this.form.querySelector('#btn-submit');
    this.successSection = this.form.querySelector('#form-success');
    this.paymentModal = this.form.querySelector('#payment-modal');
  }

  bindEvents() {
    // Navegación entre pasos
    this.nextButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextStep = parseInt(btn.dataset.next);
        if (this.validateStep(this.currentStep)) {
          this.goToStep(nextStep);
        }
      });
    });

    this.prevButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const prevStep = parseInt(btn.dataset.prev);
        this.goToStep(prevStep);
      });
    });

    // Submit del formulario
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Validación en tiempo real
    this.form.querySelectorAll('.form-input, .form-select').forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          this.validateField(input);
        }
      });
    });

    // Modal de pago
    const modalClose = this.paymentModal?.querySelector('.modal-close');
    const modalOverlay = this.paymentModal?.querySelector('.modal-overlay');
    
    modalClose?.addEventListener('click', () => this.closeModal());
    modalOverlay?.addEventListener('click', () => this.closeModal());

    // Métodos de pago
    this.form.querySelectorAll('.payment-method').forEach(method => {
      method.addEventListener('click', () => this.selectPaymentMethod(method.dataset.method));
    });

    // Aplicar descuento
    const discountBtn = this.form.querySelector('#apply-discount');
    discountBtn?.addEventListener('click', () => this.applyDiscount());

    // Tecla Escape para cerrar modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.paymentModal.hidden) {
        this.closeModal();
      }
    });

    // Plan selection update
    this.form.querySelectorAll('.plan-input').forEach(input => {
      input.addEventListener('change', () => this.updateReview());
    });
  }

  setupValidation() {
    this.validators = {
      phone: (value) => {
        const phoneRegex = /^\+?[0-9\s]{10,15}$/;
        return {
          valid: phoneRegex.test(value),
          message: 'Ingresa un número válido con código de país (ej: +593 99 123 4567)'
        };
      },
      email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          valid: emailRegex.test(value),
          message: 'Ingresa un correo electrónico válido'
        };
      },
      required: (value) => ({
        valid: value.trim().length > 0,
        message: 'Este campo es obligatorio'
      }),
      minlength: (value, minLength) => ({
        valid: value.length >= minLength,
        message: `Debe tener al menos ${minLength} caracteres`
      })
    };
  }

  validateStep(step) {
    const currentStepElement = this.steps[step - 1];
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    // Validación especial para selección de plan en paso 3
    if (step === 3) {
      const planSelected = this.form.querySelector('input[name="plan"]:checked');
      if (!planSelected) {
        this.showError('plan-error', 'Por favor selecciona un plan');
        isValid = false;
      } else {
        this.clearError('plan-error');
      }
    }

    // Validación de términos en paso 4
    if (step === 4) {
      const terminos = this.form.querySelector('#terminos');
      if (!terminos.checked) {
        this.showError('terminos-error', 'Debes aceptar los términos y condiciones');
        isValid = false;
      } else {
        this.clearError('terminos-error');
      }
    }

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Validación required
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Este campo es obligatorio';
    }

    // Validación por tipo
    if (isValid && value) {
      const validationType = field.dataset.validation;
      if (validationType && this.validators[validationType]) {
        const result = this.validators[validationType](value);
        if (!result.valid) {
          isValid = false;
          errorMessage = result.message;
        }
      }

      // Validación email
      if (field.type === 'email' && value) {
        const result = this.validators.email(value);
        if (!result.valid) {
          isValid = false;
          errorMessage = result.message;
        }
      }

      // Validación minlength
      const minLength = parseInt(field.getAttribute('minlength'));
      if (minLength && value.length < minLength) {
        isValid = false;
        errorMessage = `Debe tener al menos ${minLength} caracteres`;
      }
    }

    // Actualizar UI
    const errorElement = this.form.querySelector(`#${field.id}-error`);
    if (errorElement) {
      if (!isValid) {
        field.classList.add('error');
        field.classList.remove('valid');
        errorElement.textContent = errorMessage;
      } else {
        field.classList.remove('error');
        field.classList.add('valid');
        errorElement.textContent = '';
      }
    }

    return isValid;
  }

  showError(elementId, message) {
    const errorElement = this.form.querySelector(`#${elementId}`);
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  clearError(elementId) {
    const errorElement = this.form.querySelector(`#${elementId}`);
    if (errorElement) {
      errorElement.textContent = '';
    }
  }

  goToStep(step) {
    // Ocultar paso actual
    this.steps[this.currentStep - 1].hidden = true;
    this.steps[this.currentStep - 1].classList.remove('active');

    // Mostrar nuevo paso
    this.currentStep = step;
    const newStepElement = this.steps[this.currentStep - 1];
    newStepElement.hidden = false;
    newStepElement.classList.add('active');

    // Si es paso 4, actualizar review
    if (this.currentStep === 4) {
      this.updateReview();
    }

    // Scroll al inicio del formulario en mobile
    if (window.innerWidth < 600) {
      this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Actualizar foco para accesibilidad
    const firstInput = newStepElement.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  updateReview() {
    // Recopilar datos
    const numero = this.form.querySelector('#numero-whatsapp').value;
    const baneo = this.form.querySelector('#tipo-baneo');
    const baneoText = baneo.options[baneo.selectedIndex]?.text || '-';
    const nombre = this.form.querySelector('#nombre').value;
    const email = this.form.querySelector('#email').value;
    const plan = this.form.querySelector('input[name="plan"]:checked');
    const planText = plan?.parentElement.querySelector('.plan-name-mini')?.textContent || '-';
    const planValue = plan ? this.plans[plan.value] : 0;
    const total = planValue - this.discount;

    // Actualizar DOM
    document.getElementById('review-numero').textContent = numero || '-';
    document.getElementById('review-baneo').textContent = baneoText;
    document.getElementById('review-nombre').textContent = nombre || '-';
    document.getElementById('review-email').textContent = email || '-';
    document.getElementById('review-plan').textContent = planText;
    document.getElementById('review-total').textContent = total > 0 ? `$${total} USD` : '-';
  }

  applyDiscount() {
    const codeInput = this.form.querySelector('#codigo-descuento');
    const hintElement = this.form.querySelector('#descuento-hint');
    const code = codeInput.value.trim().toUpperCase();

    if (!code) {
      hintElement.textContent = 'Ingresa un código de descuento';
      hintElement.style.color = 'var(--form-warning)';
      return;
    }

    // Simular validación de código (en producción sería API call)
    const validCodes = {
      'DESCUENTO10': 10,
      'BIENVENIDA15': 15,
      'VIP20': 20
    };

    if (validCodes[code]) {
      this.discount = validCodes[code];
      hintElement.textContent = `✓ Descuento del ${this.discount}% aplicado`;
      hintElement.style.color = 'var(--form-success)';
      codeInput.disabled = true;
      this.form.querySelector('#apply-discount').disabled = true;
    } else {
      hintElement.textContent = '✗ Código inválido o expirado';
      hintElement.style.color = 'var(--form-error)';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateStep(4)) {
      return;
    }

    // Mostrar loading
    this.submitButton.disabled = true;
    const btnText = this.submitButton.querySelector('.btn-text');
    const btnLoader = this.submitButton.querySelector('.btn-loader');
    btnText.hidden = true;
    btnLoader.hidden = false;

    // Recopilar datos del formulario
    this.collectFormData();

    try {
      // Simular envío a API (en producción sería fetch real)
      await this.submitToAPI();
      
      // Mostrar éxito
      this.showSuccess();
      
    } catch (error) {
      console.error('Error al enviar:', error);
      alert('Hubo un error al procesar tu solicitud. Por favor intenta de nuevo.');
      
      // Restaurar botón
      this.submitButton.disabled = false;
      btnText.hidden = false;
      btnLoader.hidden = true;
    }
  }

  collectFormData() {
    const formData = new FormData(this.form);
    this.formData = Object.fromEntries(formData.entries());
    this.formData.total = this.plans[this.formData.plan] - this.discount;
    this.formData.reference = this.generateReference();
  }

  generateReference() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DSB-${timestamp}-${random}`;
  }

  submitToAPI() {
    return new Promise((resolve, reject) => {
      // Simular delay de red
      setTimeout(() => {
        // En producción:
        // const response = await fetch('/api/desbaneo/solicitud', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(this.formData)
        // });
        // if (!response.ok) throw new Error('Error en la respuesta');
        // resolve(await response.json());
        
        console.log('Datos enviados:', this.formData);
        resolve({ success: true, reference: this.formData.reference });
      }, 2000);
    });
  }

  showSuccess() {
    // Ocultar formulario
    this.form.hidden = true;

    // Mostrar mensaje de éxito
    this.successSection.hidden = false;
    document.getElementById('success-email').textContent = this.formData.email;
    document.getElementById('reference-number').textContent = this.formData.reference;

    // Enviar evento de analytics
    if (typeof gtag === 'function') {
      gtag('event', 'form_submit', {
        event_category: 'Desbaneo',
        event_label: this.formData.plan,
        value: this.formData.total
      });
    }

    // Scroll al éxito
    this.successSection.scrollIntoView({ behavior: 'smooth' });
  }

  openModal() {
    if (this.paymentModal) {
      this.paymentModal.hidden = false;
      document.body.style.overflow = 'hidden';
      
      // Focus trap
      const focusableElements = this.paymentModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      this.firstFocusable = focusableElements[0];
      this.lastFocusable = focusableElements[focusableElements.length - 1];
      
      this.firstFocusable.focus();
    }
  }

  closeModal() {
    if (this.paymentModal) {
      this.paymentModal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  selectPaymentMethod(method) {
    console.log('Método seleccionado:', method);
    
    // Aquí iría la integración con pasarela de pago
    switch(method) {
      case 'card':
        // Integrar Stripe/PayPal Cards
        alert('Redirigiendo a pasarela de pago con tarjeta...');
        break;
      case 'paypal':
        // Integrar PayPal
        alert('Redirigiendo a PayPal...');
        break;
      case 'transfer':
        // Mostrar datos bancarios
        alert('Te enviaremos los datos de transferencia por email');
        break;
      case 'crypto':
        // Mostrar wallet crypto
        alert('Generando dirección de pago crypto...');
        break;
    }
  }

  loadPlanFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    
    if (planParam && this.plans[planParam]) {
      const planInput = this.form.querySelector(`#plan-${planParam}`);
      if (planInput) {
        planInput.checked = true;
        // Highlight visual
        planInput.closest('.plan-option')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }

  // Método público para resetear formulario
  reset() {
    this.form.reset();
    this.currentStep = 1;
    this.formData = {};
    this.discount = 0;
    this.successSection.hidden = true;
    this.form.hidden = false;
    this.goToStep(1);
    
    // Limpiar errores
    this.form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    this.form.querySelectorAll('.form-input, .form-select').forEach(el => {
      el.classList.remove('error', 'valid');
    });
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  const formElement = document.getElementById('form-solicitud');
  if (formElement) {
    window.formSolicitud = new FormSolicitud(formElement);
  }
});