/**
 * Form Pago Component
 * Procesamiento de pagos con Stripe y validación
 */

class FormPago {
  constructor(formElement) {
    this.form = formElement;
    this.submitBtn = formElement.querySelector('#btn-pay');
    this.successSection = formElement.querySelector('#pago-success');
    this.errorSection = formElement.querySelector('#pago-error');
    
    this.apiUrl = '/api/pago/crear';
    this.isSubmitting = false;
    this.paymentMethod = 'card';
    this.stripe = null;
    this.cardElement = null;
    
    this.init();
  }

  async init() {
    this.bindEvents();
    this.setupValidation();
    this.loadOrderSummary();
    
    // Initialize Stripe if needed
    if (window.Stripe) {
      this.stripe = Stripe(process.env.STRIPE_PUBLIC_KEY || 'pk_test_xxx');
    }
  }

  bindEvents() {
    // Form submit
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Payment method change
    this.form.querySelectorAll('input[name="payment_method"]').forEach(radio => {
      radio.addEventListener('change', (e) => this.handleMethodChange(e.target.value));
    });

    // Real-time validation
    this.form.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          this.validateField(input);
        }
      });
    });

    // Card number formatting
    const cardNumber = this.form.querySelector('#card-number');
    cardNumber?.addEventListener('input', (e) => {
      e.target.value = this.formatCardNumber(e.target.value);
    });

    // Expiry formatting
    const cardExpiry = this.form.querySelector('#card-expiry');
    cardExpiry?.addEventListener('input', (e) => {
      e.target.value = this.formatExpiry(e.target.value);
    });

    // CVV - only numbers
    const cardCvv = this.form.querySelector('#card-cvv');
    cardCvv?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  setupValidation() {
    this.validators = {
      card_number: {
        required: true,
        pattern: /^\d{13,19}$/,
        message: {
          required: 'Número de tarjeta requerido',
          pattern: 'Número de tarjeta inválido'
        }
      },
      card_name: {
        required: true,
        minLength: 3,
        message: {
          required: 'Nombre del titular requerido',
          minLength: 'Mínimo 3 caracteres'
        }
      },
      card_expiry: {
        required: true,
        pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
        message: {
          required: 'Fecha de vencimiento requerida',
          pattern: 'Formato inválido (MM/AA)'
        }
      },
      card_cvv: {
        required: true,
        pattern: /^\d{3,4}$/,
        message: {
          required: 'CVV requerido',
          pattern: 'CVV inválido'
        }
      },
      billing_email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: {
          required: 'Email requerido',
          pattern: 'Email inválido'
        }
      },
      terms: {
        required: true,
        message: {
          required: 'Debes aceptar los términos'
        }
      }
    };
  }

  handleMethodChange(method) {
    this.paymentMethod = method;
    
    // Show/hide fields
    const cardFields = this.form.querySelector('#card-fields');
    const paypalFields = this.form.querySelector('#paypal-fields');
    const transferFields = this.form.querySelector('#transfer-fields');
    
    cardFields.hidden = method !== 'card';
    paypalFields.hidden = method !== 'paypal';
    transferFields.hidden = method !== 'transfer';
    
    // Update button text
    const amount = document.getElementById('summary-amount')?.textContent || '$39.00';
    this.updateButtonText(method, amount);
  }

  updateButtonText(method, amount) {
    const btnText = this.submitBtn.querySelector('.btn-text');
    
    switch(method) {
      case 'card':
        btnText.textContent = `Pagar ${amount}`;
        break;
      case 'paypal':
        btnText.textContent = 'Continuar a PayPal';
        break;
      case 'transfer':
        btnText.textContent = 'Generar Datos de Transferencia';
        break;
    }
  }

  validateField(field) {
    const fieldName = field.name;
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();
    const rules = this.validators[fieldName];
    
    if (!rules) return true;

    let isValid = true;
    let errorMessage = '';

    if (rules.required && !value) {
      isValid = false;
      errorMessage = rules.message.required;
    } else if (value) {
      if (rules.minLength && value.length < rules.minLength) {
        isValid = false;
        errorMessage = rules.message.minLength;
      } else if (rules.pattern && !rules.pattern.test(value)) {
        isValid = false;
        errorMessage = rules.message.pattern;
      }
    }

    this.updateFieldUI(field, isValid, errorMessage);
    return isValid;
  }

  updateFieldUI(field, isValid, errorMessage) {
    const errorElement = this.form.querySelector(`[data-field="${field.name}"]`);
    
    if (!isValid) {
      field.classList.add('error');
      field.classList.remove('success');
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.add('show');
      }
    } else {
      field.classList.remove('error');
      if (field.value || (field.type === 'checkbox' && field.checked)) {
        field.classList.add('success');
      }
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
      }
    }
  }

  validateForm() {
    const fields = this.form.querySelectorAll('[name]');
    let isValid = true;
    let firstErrorField = null;

    fields.forEach(field => {
      // Only validate visible fields
      if (field.closest('[hidden]')) return;
      
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

  loadOrderSummary() {
    // Get data from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference') || 'DSB-2025-ABC123';
    const plan = urlParams.get('plan') || 'Plan Pro';
    const amount = urlParams.get('amount') || '39.00';
    const number = urlParams.get('number') || '+593 99 *** ****';

    // Update summary
    document.getElementById('pago-reference').textContent = reference;
    document.getElementById('summary-plan').textContent = plan;
    document.getElementById('summary-amount').textContent = `$${amount} USD`;
    document.getElementById('transfer-amount').textContent = `$${amount}`;
    document.getElementById('summary-number').textContent = number;
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
      switch(this.paymentMethod) {
        case 'card':
          await this.processCardPayment();
          break;
        case 'paypal':
          await this.processPayPalPayment();
          break;
        case 'transfer':
          await this.processTransferPayment();
          break;
      }
    } catch (error) {
      console.error('Error en pago:', error);
      this.showError(error.message || 'Error al procesar el pago');
    } finally {
      this.isSubmitting = false;
      this.setLoading(false);
    }
  }

  async processCardPayment() {
    // Get form data
    const formData = {
      card_number: this.form.querySelector('#card-number').value.replace(/\s/g, ''),
      card_name: this.form.querySelector('#card-name').value,
      card_expiry: this.form.querySelector('#card-expiry').value,
      card_cvv: this.form.querySelector('#card-cvv').value,
      billing_email: this.form.querySelector('#billing-email').value,
      save_card: this.form.querySelector('#save-card').checked,
      reference: document.getElementById('pago-reference').textContent
    };

    // Simulate API call (in production, use Stripe Elements)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock success
    const transactionId = 'pi_' + Math.random().toString(36).substring(7);
    
    this.showSuccess({
      transactionId,
      amount: document.getElementById('summary-amount').textContent
    });

    this.trackEvent('pago_exitoso', {
      method: 'card',
      amount: formData.card_number.slice(-4)
    });
  }

  async processPayPalPayment() {
    // Redirect to PayPal
    const paypalUrl = `https://www.paypal.com/checkout?reference=${document.getElementById('pago-reference').textContent}`;
    
    // Simulate redirect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production: window.location.href = paypalUrl;
    alert(`Redirigiendo a PayPal...\n\nEn producción, serías redirigido a: ${paypalUrl}`);
    
    this.trackEvent('pago_paypal_iniciado', {
      reference: document.getElementById('pago-reference').textContent
    });
  }

  async processTransferPayment() {
    // Show transfer details
    alert(`Datos de transferencia generados:\n\nBanco: Banco Pichincha\nCuenta: 1234567890\nMonto: ${document.getElementById('summary-amount').textContent}\n\nEnvía el comprobante a pagos@desbanwa.com`);
    
    this.trackEvent('pago_transferencia_generado', {
      reference: document.getElementById('pago-reference').textContent
    });
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

  showSuccess(data) {
    // Hide form
    this.form.querySelectorAll('.pago-header, .order-summary, .payment-methods, .payment-fields, .billing-info, .btn-pay, .security-badges').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-10px)';
      el.style.transition = 'all 0.3s ease';
      setTimeout(() => el.hidden = true, 300);
    });

    setTimeout(() => {
      this.errorSection.hidden = true;
      this.successSection.hidden = false;
      
      document.getElementById('success-transaction-id').textContent = data.transactionId;
      document.getElementById('success-amount').textContent = data.amount;
      
      this.successSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  formatCardNumber(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  }

  formatExpiry(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    
    return v;
  }

  trackEvent(eventName, data) {
    // Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'Pago',
        ...data
      });
    }

    // Facebook Pixel
    if (typeof fbq === 'function') {
      fbq('track', 'Purchase', {
        value: parseFloat(data.amount) || 39,
        currency: 'USD',
        ...data
      });
    }

    console.log(`💳 [Pago] ${eventName}:`, data);
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
    
    this.form.querySelectorAll('.form-input').forEach(input => {
      input.classList.remove('error', 'success');
    });
    
    this.form.querySelectorAll('.form-error').forEach(error => {
      error.textContent = '';
      error.classList.remove('show');
    });
  }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  const formElement = document.getElementById('form-pago');
  if (formElement) {
    window.formPago = new FormPago(formElement);
  }
});

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormPago;
}