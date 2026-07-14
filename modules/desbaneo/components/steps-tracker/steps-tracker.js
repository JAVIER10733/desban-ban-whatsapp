/**
 * steps-tracker.js — Componente de seguimiento de pasos
 * Versión profesional con navegación y animaciones
 */
'use strict';

class StepsTracker {
  constructor(element, options = {}) {
    this.container = element;
    this.options = {
      currentStep: 1,
      totalSteps: 4,
      clickable: true,
      animated: true,
      showTooltip: true,
      ...options
    };
    
    this.steps = [];
    this.init();
  }

  init() {
    this.cacheElements();
    this.bindEvents();
    this.updateSteps();
    this.setupTooltips();
  }

  cacheElements() {
    this.stepItems = this.container.querySelectorAll('.step-item, .step-vertical, .step-compact');
    this.progressFill = this.container.querySelector('.progress-fill, .progress-compact-fill');
    this.tooltip = this.container.querySelector('.step-tooltip');
  }

  bindEvents() {
    if (this.options.clickable) {
      this.stepItems.forEach((step, index) => {
        const marker = step.querySelector('.step-marker');
        if (marker) {
          marker.addEventListener('click', () => this.goToStep(index + 1));
          marker.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.goToStep(index + 1);
            }
          });
        }
      });
    }

    // Tooltip events
    if (this.options.showTooltip) {
      this.stepItems.forEach((step, index) => {
        step.addEventListener('mouseenter', (e) => this.showTooltip(e, index + 1));
        step.addEventListener('mouseleave', () => this.hideTooltip());
        step.addEventListener('focus', (e) => this.showTooltip(e, index + 1));
        step.addEventListener('blur', () => this.hideTooltip());
      });
    }
  }

  setupTooltips() {
    const tooltipTexts = [
      'Información del número',
      'Tus datos personales',
      'Selecciona tu plan',
      'Confirmación y pago'
    ];

    this.stepItems.forEach((step, index) => {
      step.dataset.tooltip = tooltipTexts[index] || `Paso ${index + 1}`;
    });
  }

  updateSteps() {
    const { currentStep, totalSteps } = this.options;

    this.stepItems.forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.remove('completed', 'active');

      if (stepNumber < currentStep) {
        step.classList.add('completed');
      } else if (stepNumber === currentStep) {
        step.classList.add('active');
      }

      // Update ARIA
      const marker = step.querySelector('.step-marker');
      if (marker) {
        marker.setAttribute('aria-label', `Paso ${stepNumber}: ${step.dataset.tooltip || ''} - ${stepNumber < currentStep ? 'completado' : stepNumber === currentStep ? 'paso actual' : 'pendiente'}`);
        marker.setAttribute('tabindex', stepNumber <= currentStep ? '0' : '-1');
      }
    });

    // Update progress bar
    if (this.progressFill) {
      const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
      this.progressFill.style.width = `${progress}%`;
    }

    // Update ARIA on container
    this.container.setAttribute('aria-valuenow', currentStep);
  }

  goToStep(stepNumber) {
    const { currentStep } = this.options;
    
    // Solo permitir navegación hacia atrás o a pasos completados
    if (stepNumber > currentStep + 1) return;

    this.options.currentStep = stepNumber;
    this.updateSteps();

    // Dispatch custom event
    this.container.dispatchEvent(new CustomEvent('stepChange', {
      detail: { step: stepNumber, previousStep: currentStep },
      bubbles: true
    }));

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'step_navigation', {
        event_category: 'Form',
        event_label: `Step ${stepNumber}`
      });
    }
  }

  nextStep() {
    if (this.options.currentStep < this.options.totalSteps) {
      this.goToStep(this.options.currentStep + 1);
    }
  }

  prevStep() {
    if (this.options.currentStep > 1) {
      this.goToStep(this.options.currentStep - 1);
    }
  }

  showTooltip(event, stepNumber) {
    if (!this.tooltip || !this.options.showTooltip) return;

    const step = this.stepItems[stepNumber - 1];
    const text = step.dataset.tooltip || `Paso ${stepNumber}`;
    
    this.tooltip.querySelector('.tooltip-content').textContent = text;
    this.tooltip.hidden = false;
    
    // Position tooltip
    const rect = step.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    this.tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
    this.tooltip.classList.add('active');
  }

  hideTooltip() {
    if (!this.tooltip) return;
    this.tooltip.classList.remove('active');
    setTimeout(() => {
      if (!this.tooltip.classList.contains('active')) {
        this.tooltip.hidden = true;
      }
    }, 300);
  }

  // Método para actualizar progreso con animación
  setProgress(percent, animate = true) {
    if (this.progressFill) {
      if (animate) {
        this.progressFill.style.transition = 'width 0.5s ease';
      } else {
        this.progressFill.style.transition = 'none';
      }
      this.progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
  }

  // Reset tracker
  reset() {
    this.options.currentStep = 1;
    this.updateSteps();
  }

  // Destroy instance
  destroy() {
    this.steps = null;
    this.stepItems = null;
  }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.steps-tracker').forEach(tracker => {
    const currentStep = parseInt(tracker.dataset.current || tracker.getAttribute('aria-valuenow') || 1, 10);
    const totalSteps = parseInt(tracker.dataset.steps || 4, 10);
    
    new StepsTracker(tracker, {
      currentStep,
      totalSteps,
      clickable: tracker.classList.contains('clickable'),
      showTooltip: !tracker.classList.contains('no-tooltip')
    });
  });
});

// Exponer globalmente
if (window.location.hostname === 'localhost') {
  window.StepsTracker = StepsTracker;
}