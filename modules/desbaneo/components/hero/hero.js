/**
 * hero.js — Componente Hero con animaciones avanzadas
 * Versión profesional con contadores animados y efectos
 */
'use strict';

class HeroComponent {
  constructor(element) {
    this.hero = element;
    this.statsAnimated = false;
    
    this.init();
  }

  init() {
    this.cacheElements();
    this.setupCounters();
    this.setupParallax();
    this.setupMouseGlow();
    this.observeScroll();
  }

  cacheElements() {
    this.statNumbers = this.hero.querySelectorAll('.stat-number[data-count]');
    this.floatingIcons = this.hero.querySelectorAll('.float-icon');
    this.heroBg = this.hero.querySelector('.hero-bg');
  }

  setupCounters() {
    // Configuración de contadores
    this.counters = Array.from(this.statNumbers).map(stat => ({
      element: stat,
      target: parseInt(stat.dataset.count, 10),
      duration: 2000,
      started: false
    }));
  }

  animateCounter(counter) {
    const { element, target, duration } = counter;
    const startTime = performance.now();
    const suffix = target >= 1000 ? '+' : '%';
    
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = Math.floor(target * eased);
      
      element.textContent = current >= 1000 
        ? (current / 1000).toFixed(0) + 'k'
        : current + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = target >= 1000 
          ? (target / 1000).toFixed(0) + 'k+'
          : target + suffix;
      }
    };
    
    requestAnimationFrame(animate);
  }

  setupParallax() {
    let ticking = false;
    
    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * 0.5;
      
      // Parallax en glows
      this.heroBg?.querySelectorAll('.hero-bg-glow').forEach((glow, index) => {
        const speed = 0.2 + (index * 0.1);
        glow.style.transform = `translateY(${rate * speed}px)`;
      });
      
      // Parallax en floating icons
      this.floatingIcons.forEach((icon, index) => {
        const speed = 0.3 + (index * 0.05);
        icon.style.transform = `translateY(${scrolled * speed}px)`;
      });
      
      // Opacidad del título
      const title = this.hero.querySelector('.hero-title');
      if (title) {
        const opacity = 1 - (scrolled / 600);
        title.style.opacity = Math.max(opacity, 0.3);
      }
      
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  setupMouseGlow() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // No en mobile
    
    const glow = document.createElement('div');
    glow.className = 'mouse-glow';
    glow.style.cssText = `
      position: fixed;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(37,211,102,0.15), transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(glow);
    
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      glow.style.opacity = '1';
    });
    
    const animateGlow = () => {
      glowX += (mouseX - glowX) * 0.1;
      glowY += (mouseY - glowY) * 0.1;
      
      glow.style.left = `${glowX - 150}px`;
      glow.style.top = `${glowY - 150}px`;
      
      requestAnimationFrame(animateGlow);
    };
    
    animateGlow();
  }

  observeScroll() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.statsAnimated) {
            this.statsAnimated = true;
            this.counters.forEach(counter => {
              setTimeout(() => {
                this.animateCounter(counter);
              }, 300);
            });
          }
        });
      },
      { threshold: 0.5 }
    );
    
    const statsSection = this.hero.querySelector('.hero-stats');
    if (statsSection) {
      observer.observe(statsSection);
    }
  }

  // Método para destacar CTA específico
  highlightCTA(selector) {
    const cta = this.hero.querySelector(selector);
    if (!cta) return;
    
    cta.style.transform = 'scale(1.05)';
    cta.style.boxShadow = '0 0 30px rgba(37, 211, 102, 0.6)';
    
    setTimeout(() => {
      cta.style.transform = '';
      cta.style.boxShadow = '';
    }, 2000);
  }

  // Destruir instancia
  destroy() {
    // Cleanup si es necesario
    this.counters = null;
    this.floatingIcons = null;
  }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  const heroElement = document.querySelector('.hero');
  if (heroElement) {
    window.heroInstance = new HeroComponent(heroElement);
  }
});

// Exponer globalmente en desarrollo
if (window.location.hostname === 'localhost') {
  window.HeroComponent = HeroComponent;
}