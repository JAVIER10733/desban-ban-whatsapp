/**
 * landing.js — Módulo Desbaneo
 * Lógica exclusiva de la página landing
 */

'use strict';

// =============================================
// NAV — scroll effect + toggle móvil
// =============================================
const nav        = document.getElementById('nav');
const navToggle  = document.getElementById('navToggle');
const navLinks   = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

navToggle?.addEventListener('click', () => {
  navLinks?.classList.toggle('nav-open');
});

// =============================================
// REVEAL ON SCROLL
// =============================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${i * 0.08}s`;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// =============================================
// COUNTER — números animados en stats bar
// =============================================
function animateCounter(el) {
  const target  = parseInt(el.dataset.target, 10);
  const suffix  = el.dataset.suffix || '';
  const duration = 1800;
  const step     = 16;
  const steps    = duration / step;
  const inc      = target / steps;
  let current    = 0;

  const timer = setInterval(() => {
    current += inc;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString('es') + suffix;
  }, step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.stat-num[data-target]').forEach(animateCounter);
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

// =============================================
// PHONE MOCKUP — animación de recuperación
// =============================================
const phoneStatus    = document.getElementById('phoneStatus');
const recoveringMsg  = document.getElementById('recoveringMsg');
const successMsg     = document.getElementById('successMsg');
const progressBar    = document.getElementById('progressBar');

function runPhoneAnimation() {
  if (!progressBar) return;

  // Reset
  progressBar.style.width   = '0';
  progressBar.style.transition = 'none';
  if (phoneStatus)   { phoneStatus.textContent = '● Número baneado'; phoneStatus.className = 'phone-status banned'; }
  if (recoveringMsg) { recoveringMsg.style.display = 'block'; recoveringMsg.textContent = 'Iniciando recuperación...'; }
  if (successMsg)    { successMsg.style.display = 'none'; }

  // Progreso
  setTimeout(() => {
    progressBar.style.transition = 'width 3s ease';
    progressBar.style.width = '100%';
    if (recoveringMsg) recoveringMsg.textContent = 'Gestionando apelación...';
  }, 500);

  // Éxito
  setTimeout(() => {
    if (phoneStatus)   { phoneStatus.textContent = '● En línea'; phoneStatus.className = 'phone-status success'; }
    if (recoveringMsg) { recoveringMsg.style.display = 'none'; }
    if (successMsg)    { successMsg.style.display = 'block'; }
  }, 3800);

  // Loop cada 7s
  setTimeout(runPhoneAnimation, 7000);
}

// Iniciar cuando el hero sea visible
const heroObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    setTimeout(runPhoneAnimation, 1200);
    heroObserver.disconnect();
  }
}, { threshold: 0.3 });

const hero = document.getElementById('hero');
if (hero) heroObserver.observe(hero);

// =============================================
// FAQ — acordeón
// =============================================
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen  = btn.getAttribute('aria-expanded') === 'true';
    const answer  = btn.nextElementSibling;
    const parent  = btn.closest('.faq-item');

    // Cerrar todos
    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling?.classList.remove('open');
      b.closest('.faq-item')?.classList.remove('faq-active');
    });

    // Abrir el clickeado si estaba cerrado
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      answer?.classList.add('open');
      parent?.classList.add('faq-active');
    }
  });
});

// =============================================
// PLAN PARAMS — leer ?plan= de la URL
// =============================================
(function highlightPlan() {
  const params   = new URLSearchParams(window.location.search);
  const planName = params.get('plan');
  if (!planName) return;

  const cards = document.querySelectorAll('.plan-card');
  cards.forEach(card => {
    const name = card.querySelector('.plan-name')?.textContent?.toLowerCase().trim();
    if (name === planName.toLowerCase()) {
      card.style.borderColor = 'var(--green)';
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
})();

// =============================================
// SMOOTH SCROLL — links de la misma página
// =============================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// =============================================
// NAV ACTIVE — marcar link activo por sección
// =============================================
const sections  = document.querySelectorAll('section[id]');
const navItems  = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navItems.forEach(a => {
        a.classList.toggle(
          'active',
          a.getAttribute('href') === `#${entry.target.id}`
        );
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));