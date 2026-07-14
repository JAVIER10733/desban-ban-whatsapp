/**
 * landing.js — Módulo Baneo
 */
'use strict';

// NAV scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Nav toggle móvil
document.getElementById('navToggle')?.addEventListener('click', () => {
  document.querySelector('.nav-links')?.classList.toggle('nav-open');
});

// Reveal on scroll
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

// Contadores animados
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const suffix   = el.dataset.suffix || '';
  const duration = 1800;
  const step     = 16;
  const inc      = target / (duration / step);
  let current    = 0;
  const timer = setInterval(() => {
    current += inc;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = Math.floor(current).toLocaleString('es') + suffix;
  }, step);
}
const statsObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    document.querySelectorAll('.stat-num[data-target]').forEach(animateCounter);
    statsObserver.disconnect();
  }
}, { threshold: 0.3 });
const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

// Animación mockup de reporte
function runReportAnimation() {
  const status   = document.getElementById('reportStatus');
  const progress = document.getElementById('reportProgress');
  const logs     = ['log1','log2','log3','log4'];
  const messages = ['Verificando datos...', 'Enviando a Meta...', 'Procesando respuesta...', '✓ Número baneado'];
  const statusMsg= ['Procesando...','Verificando...','Enviando a Meta...','Baneado'];

  if (!progress) return;

  // Reset
  progress.style.transition = 'none';
  progress.style.width = '0';
  logs.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'log-item'; el.style.animation = ''; }
  });
  if (status) { status.textContent = 'Procesando...'; status.className = 'report-status'; }

  const log1 = document.getElementById('log1');
  if (log1) { log1.classList.add('active'); }

  // Progreso
  setTimeout(() => {
    progress.style.transition = 'width 3.5s ease';
    progress.style.width = '100%';
  }, 400);

  // Logs secuenciales
  logs.forEach((id, i) => {
    setTimeout(() => {
      const prev = document.getElementById(logs[i - 1]);
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
      const curr = document.getElementById(id);
      if (curr) {
        curr.classList.add('active');
        curr.style.animation = 'logSlide .3s ease';
      }
      if (status) status.textContent = statusMsg[i];
    }, 800 + i * 900);
  });

  // Final
  setTimeout(() => {
    if (status) { status.textContent = '✓ Baneado'; status.classList.add('success'); }
    const last = document.getElementById('log4');
    if (last) { last.classList.remove('active'); last.classList.add('done'); }
  }, 4500);

  setTimeout(runReportAnimation, 8000);
}

const heroObs = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    setTimeout(runReportAnimation, 1000);
    heroObs.disconnect();
  }
}, { threshold: 0.3 });
const hero = document.getElementById('hero');
if (hero) heroObs.observe(hero);

// FAQ acordeón
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling?.classList.remove('open');
    });
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling?.classList.add('open');
    }
  });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(link.getAttribute('href'))
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});