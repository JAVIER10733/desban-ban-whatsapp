/* =============================================
   articulo.js — Funcionalidad para artículos
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
  
  // === FAQ ACCORDION ===
  const faqQuestions = document.querySelectorAll('.faq-q');
  
  faqQuestions.forEach((question) => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      const isExpanded = question.getAttribute('aria-expanded') === 'true';
      
      // Cerrar todos los demás
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
  
  // === REVEAL ON SCROLL ===
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
  
  // === SMOOTH SCROLL PARA TOC ===
  document.querySelectorAll('.toc-list a').forEach((anchor) => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      
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
  
  // === PROGRESO DE LECTURA ===
  const createReadingProgress = () => {
    const article = document.querySelector('.article-content');
    if (!article) return;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--green), var(--red));
      z-index: 101;
      transition: width 0.1s;
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrolled = window.pageYOffset;
      
      let progress = 0;
      
      if (scrolled > articleTop) {
        progress = ((scrolled - articleTop) / (articleHeight - windowHeight)) * 100;
        progress = Math.max(0, Math.min(100, progress));
      }
      
      progressBar.style.width = progress + '%';
    });
  };
  
  createReadingProgress();
  
  // === COPY LINK ===
  const addCopyLinkButton = () => {
    const header = document.querySelector('.article-header');
    if (!header) return;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-link-btn';
    copyBtn.innerHTML = '🔗 Copiar enlace';
    copyBtn.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: var(--bg2);
      border: 0.5px solid var(--border);
      color: var(--text);
      padding: 0.8rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      z-index: 99;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        copyBtn.innerHTML = '✓ ¡Copiado!';
        copyBtn.style.background = 'var(--green)';
        copyBtn.style.color = '#fff';
        
        setTimeout(() => {
          copyBtn.innerHTML = '🔗 Copiar enlace';
          copyBtn.style.background = 'var(--bg2)';
          copyBtn.style.color = 'var(--text)';
        }, 2000);
      });
    });
    
    document.body.appendChild(copyBtn);
  };
  
  addCopyLinkButton();
  
  // === EXTERNAL LINKS ===
  const externalLinks = document.querySelectorAll('a[href^="http"]');
  externalLinks.forEach((link) => {
    if (!link.href.includes(window.location.hostname)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  
  console.log('⚡ DESBANWA Article JS loaded');
  
});