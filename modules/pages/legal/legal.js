/* =============================================
   legal.js — Funcionalidad para páginas legales
   DESBANWA - Cookies, Privacidad, Términos
============================================= */

document.addEventListener('DOMContentLoaded', () => {
  
  // =============================================
  // MENÚ MÓVIL
  // =============================================
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const nav = document.querySelector('.nav');
  
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      
      // Toggle aria-expanded
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
    });
    
    // Cerrar menú al hacer click en un enlace
    const navLinksItems = navLinks.querySelectorAll('a');
    navLinksItems.forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  
  // =============================================
  // ANIMACIONES SCROLL (Fade Up)
  // =============================================
  const revealElements = document.querySelectorAll('.anim-fade');
  
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 100;
    
    revealElements.forEach((element) => {
      const elementTop = element.getBoundingClientRect().top;
      
      if (elementTop < windowHeight - elementVisible) {
        element.classList.add('visible');
      }
    });
  };
  
  // Trigger on load
  revealOnScroll();
  
  // Trigger on scroll
  window.addEventListener('scroll', revealOnScroll);
  
  // =============================================
  // NAV SCROLL EFFECT (Cambiar fondo al scrollear)
  // =============================================
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      nav.style.background = 'rgba(13, 13, 13, 0.98)';
      nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
      nav.style.background = 'rgba(13, 13, 13, 0.92)';
      nav.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
  });
  
  // =============================================
  // SMOOTH SCROLL PARA LINKS INTERNOS
  // =============================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Ignorar enlaces vacíos o externos
      if (href === '#' || href.startsWith('#!')) return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // =============================================
  // ACTUALIZAR AÑO EN FOOTER AUTOMÁTICAMENTE
  // =============================================
  const yearElements = document.querySelectorAll('.current-year');
  yearElements.forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  
  // =============================================
  // FAQ ACCORDION (Si existe en la página)
  // =============================================
  const faqQuestions = document.querySelectorAll('.faq-q');
  
  faqQuestions.forEach((question) => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      const isExpanded = question.getAttribute('aria-expanded') === 'true';
      
      // Cerrar todos los demás
      faqQuestions.forEach((q) => {
        q.setAttribute('aria-expanded', 'false');
        q.nextElementSibling.classList.remove('open');
      });
      
      // Toggle actual
      if (!isExpanded) {
        question.setAttribute('aria-expanded', 'true');
        answer.classList.add('open');
      }
    });
  });
  
  // =============================================
  // EXTERNAL LINKS (Abrir en nueva pestaña)
  // =============================================
  const externalLinks = document.querySelectorAll('a[href^="http"]');
  externalLinks.forEach((link) => {
    if (!link.href.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  
  // =============================================
  // COPY EMAIL TO CLIPBOARD (Si existe botón)
  // =============================================
  const copyEmailBtn = document.querySelector('[data-copy-email]');
  
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = copyEmailBtn.getAttribute('data-copy-email');
      
      navigator.clipboard.writeText(email).then(() => {
        const originalText = copyEmailBtn.textContent;
        copyEmailBtn.textContent = '¡Copiado!';
        copyEmailBtn.style.color = 'var(--green)';
        
        setTimeout(() => {
          copyEmailBtn.textContent = originalText;
          copyEmailBtn.style.color = '';
        }, 2000);
      }).catch((err) => {
        console.error('Error al copiar:', err);
      });
    });
  }
  
  // =============================================
  // FORM VALIDATION (Si existe formulario)
  // =============================================
  const legalForm = document.querySelector('.legal-form');
  
  if (legalForm) {
    legalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const inputs = legalForm.querySelectorAll('input[required]');
      let isValid = true;
      
      inputs.forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = 'var(--red)';
        } else {
          input.style.borderColor = 'var(--border)';
        }
      });
      
      if (isValid) {
        // Aquí iría la lógica de envío
        console.log('Formulario válido');
      }
    });
  }
  
  // =============================================
  // BACK BUTTON (Si existe)
  // =============================================
  const backBtn = document.querySelector('[data-back]');
  
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.history.back();
    });
  }
  
  // =============================================
  // CONSOLE LOG (DEBUG)
  // =============================================
  console.log('⚡ DESBANWA Legal JS loaded');
  console.log('📄 Página:', window.location.pathname);
  console.log('🕐 Fecha:', new Date().toLocaleDateString('es-ES'));
  
});

// =============================================
// UTILIDADES GLOBALES
// =============================================

// Debounce para resize
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Detectar si es móvil
function isMobile() {
  return window.innerWidth <= 768;
}

// Exportar utilidades (si se usa como módulo)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debounce, isMobile };
}