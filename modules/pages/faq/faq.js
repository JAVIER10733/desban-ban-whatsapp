/* =============================================
   faq.js — Funcionalidad para página de FAQ
   DESBANWA
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
  // FAQ ACCORDION
  // =============================================
  const faqQuestions = document.querySelectorAll('.faq-q');
  
  faqQuestions.forEach((question) => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      const isExpanded = question.getAttribute('aria-expanded') === 'true';
      
      // Cerrar todos los demás (opcional - quita esto si quieres múltiples abiertos)
      faqQuestions.forEach((q) => {
        if (q !== question) {
          q.setAttribute('aria-expanded', 'false');
          q.nextElementSibling.classList.remove('open');
        }
      });
      
      // Toggle actual
      if (!isExpanded) {
        question.setAttribute('aria-expanded', 'true');
        answer.classList.add('open');
      } else {
        question.setAttribute('aria-expanded', 'false');
        answer.classList.remove('open');
      }
    });
  });
  
  // =============================================
  // ANIMACIONES SCROLL
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
  // NAV SCROLL EFFECT
  // =============================================
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      nav.style.background = 'rgba(13, 13, 13, 0.98)';
      nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
      nav.style.background = 'rgba(13, 13, 13, 0.92)';
      nav.style.boxShadow = 'none';
    }
  });
  
  // =============================================
  // ACTUALIZAR AÑO EN FOOTER
  // =============================================
  const yearElements = document.querySelectorAll('.current-year');
  yearElements.forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  
  // =============================================
  // SMOOTH SCROLL PARA LINKS INTERNOS
  // =============================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
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
  // EXTERNAL LINKS
  // =============================================
  const externalLinks = document.querySelectorAll('a[href^="http"]');
  externalLinks.forEach((link) => {
    if (!link.href.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  
  // =============================================
  // SEARCH FUNCTIONALITY (Opcional - Si agregas buscador)
  // =============================================
  const searchInput = document.querySelector('.faq-search');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const faqItems = document.querySelectorAll('.faq-item');
      
      faqItems.forEach((item) => {
        const question = item.querySelector('.faq-q span').textContent.toLowerCase();
        const answer = item.querySelector('.faq-a').textContent.toLowerCase();
        
        if (question.includes(searchTerm) || answer.includes(searchTerm)) {
          item.style.display = 'block';
        } else {
          item.style.display = searchTerm === '' ? 'block' : 'none';
        }
      });
    });
  }
  
  // =============================================
  // CONSOLE LOG
  // =============================================
  console.log('⚡ DESBANWA FAQ JS loaded');
  console.log('📄 Total preguntas:', faqQuestions.length);
  
});