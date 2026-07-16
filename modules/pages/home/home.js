/* =============================================
   home.js — Funcionalidad página principal
   DESBANWA
============================================= */

document.addEventListener('DOMContentLoaded', () => {
  
  // === MENÚ MÓVIL ===
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
    
    const navLinksItems = navLinks.querySelectorAll('a');
    navLinksItems.forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  
  // === ANIMACIÓN MOCKUP ===
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');
  const logItems = document.querySelectorAll('.log-item');
  
  setTimeout(() => {
    if (progressBar) {
      progressBar.style.width = '100%';
    }
    
    if (statusText) {
      statusText.textContent = '✓ Completado';
      statusText.classList.add('success');
    }
    
    logItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.remove('active');
        item.classList.add('done');
        item.textContent = '✓ ' + item.textContent.substring(2);
      }, index * 800);
    });
  }, 1500);
  
  // === REVEAL ON SCROLL ===
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 150;
    
    revealElements.forEach((element) => {
      const elementTop = element.getBoundingClientRect().top;
      
      if (elementTop < windowHeight - elementVisible) {
        element.classList.add('visible');
      }
    });
  };
  
  revealOnScroll();
  window.addEventListener('scroll', revealOnScroll);
  
  // === NAV SCROLL EFFECT ===
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
  
  // === FAQ ACCORDION ===
  const faqQuestions = document.querySelectorAll('.faq-q');
  
  faqQuestions.forEach((question) => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      const isExpanded = question.getAttribute('aria-expanded') === 'true';
      
      faqQuestions.forEach((q) => {
        q.setAttribute('aria-expanded', 'false');
        q.nextElementSibling.classList.remove('open');
      });
      
      if (!isExpanded) {
        question.setAttribute('aria-expanded', 'true');
        answer.classList.add('open');
      }
    });
  });
  
  // === SMOOTH SCROLL ===
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
  
  // === ACTUALIZAR AÑO ===
  const yearElements = document.querySelectorAll('.current-year');
  yearElements.forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
  
  // === COUNTER ANIMATION ===
  const statNums = document.querySelectorAll('.stat-num');
  
  const animateCounter = (el) => {
    const target = el.textContent;
    const isNumber = !isNaN(parseInt(target.replace(/,/g, '')));
    
    if (isNumber) {
      el.style.opacity = '0';
      
      setTimeout(() => {
        el.style.transition = 'opacity 0.5s';
        el.style.opacity = '1';
      }, 100);
    }
  };
  
  statNums.forEach((stat) => {
    animateCounter(stat);
  });
  
  console.log('⚡ DESBANWA Home JS loaded');
  
});