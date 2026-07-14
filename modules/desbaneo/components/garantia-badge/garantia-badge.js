/**
 * garantia-badge.js — Componente de garantía interactivo
 * Versión profesional con accesibilidad y animaciones
 */
'use strict';

class GarantiaBadge {
  constructor(container) {
    this.container = container;
    this.badge = container.querySelector('#garantia-badge');
    this.details = container.querySelector('#garantia-details');
    this.overlay = container.querySelector('.garantia-overlay');
    this.closeBtn = this.details?.querySelector('.details-close');
    this.isOpen = false;
    
    this.init();
  }

  init() {
    if (!this.badge || !this.details) return;

    this.bindEvents();
    this.setupAccessibility();
    this.setupAnimations();
  }

  bindEvents() {
    // Click en badge para abrir/cerrar
    this.badge.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });

    // Keyboard navigation
    this.badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Cerrar botón
    this.closeBtn?.addEventListener('click', () => this.close());

    // Click en overlay
    this.overlay?.addEventListener('click', () => this.close());

    // Click fuera del modal
    document.addEventListener('click', (e) => {
      if (this.isOpen && 
          !this.container.contains(e.target) && 
          !e.target.closest('.garantia-details')) {
        this.close();
      }
    });

    // Escape key global
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.isOpen) {
          this.updatePosition();
        }
      }, 250);
    });
  }

  setupAccessibility() {
    // Configurar ARIA
    this.badge.setAttribute('aria-expanded', 'false');
    this.badge.setAttribute('role', 'button');
    
    // Configurar focus trap
    this.focusableElements = this.details?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (this.focusableElements?.length) {
      this.firstFocusable = this.focusableElements[0];
      this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    }
  }

  setupAnimations() {
    // Animación de entrada escalonada para features
    const features = this.details?.querySelectorAll('.guarantee-feature');
    if (features) {
      features.forEach((feature, index) => {
        feature.style.opacity = '0';
        feature.style.transform = 'translateX(-10px)';
        feature.style.transition = `all 0.3s ease ${index * 0.1}s`;
      });
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.badge.setAttribute('aria-expanded', 'true');
    this.details.hidden = false;
    
    // Forzar reflow
    this.details.offsetHeight;
    
    // Activar animaciones
    this.details.classList.add('active');
    this.overlay?.classList.add('active');
    
    // Animar features
    const features = this.details.querySelectorAll('.guarantee-feature');
    features.forEach(feature => {
      feature.style.opacity = '1';
      feature.style.transform = 'translateX(0)';
    });

    // Actualizar posición
    this.updatePosition();

    // Focus trap
    if (this.firstFocusable) {
      setTimeout(() => this.firstFocusable.focus(), 100);
    }

    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';

    // Analytics event
    this.trackEvent('guarantee_view');
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.badge.setAttribute('aria-expanded', 'false');
    this.details.classList.remove('active');
    this.overlay?.classList.remove('active');

    // Esperar animación
    setTimeout(() => {
      if (!this.isOpen) {
        this.details.hidden = true;
      }
    }, 300);

    // Restaurar scroll
    document.body.style.overflow = '';

    // Retornar foco al badge
    this.badge.focus();
  }

  updatePosition() {
    if (!this.details) return;

    const badgeRect = this.badge.getBoundingClientRect();
    const detailsRect = this.details.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = badgeRect.left + (badgeRect.width / 2) - (detailsRect.width / 2);
    let top = badgeRect.bottom + 10;

    // Ajustar si se sale por la derecha
    if (left + detailsRect.width > viewportWidth) {
      left = viewportWidth - detailsRect.width - 16;
    }

    // Ajustar si se sale por la izquierda
    if (left < 16) {
      left = 16;
    }

    // Ajustar si se sale por abajo (mostrar arriba del badge)
    if (top + detailsRect.height > viewportHeight) {
      top = badgeRect.top - detailsRect.height - 10;
    }

    this.details.style.left = `${left}px`;
    this.details.style.top = `${top}px`;
    this.details.style.transform = 'none';
  }

  trackEvent(action) {
    if (typeof gtag === 'function') {
      gtag('event', action, {
        event_category: 'Garantia',
        event_label: 'badge_interaction'
      });
    }
  }

  // Método público para mostrar el badge con delay
  showDelayed(delay = 3000) {
    setTimeout(() => {
      if (!this.isOpen && this.isInViewport()) {
        this.open();
      }
    }, delay);
  }

  // Verificar si está en viewport
  isInViewport() {
    const rect = this.badge.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Destruir instancia
  destroy() {
    this.close();
    // Remover event listeners si es necesario
  }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar todos los badges
  document.querySelectorAll('.garantia-badge-container').forEach(container => {
    new GarantiaBadge(container);
  });

  // Ejemplo: mostrar badge flotante después de 5 segundos en página de planes
  if (window.location.pathname.includes('/planes/')) {
    setTimeout(() => {
      const badge = document.querySelector('.garantia-badge-container');
      if (badge && !badge.classList.contains('no-auto-show')) {
        const instance = window.garantiaBadgeInstance || new GarantiaBadge(badge);
        instance.showDelayed(5000);
      }
    }, 5000);
  }
});

// Exponer globalmente si es necesario
if (window.location.hostname === 'localhost') {
  window.GarantiaBadge = GarantiaBadge;
}