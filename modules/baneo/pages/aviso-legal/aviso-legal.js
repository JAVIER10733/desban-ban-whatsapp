/**
 * aviso-legal.js — Módulo Baneo / Aviso Legal
 */
'use strict';

// NAV scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Reveal on scroll
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// TOC — scroll suave + marcar sección activa
document.querySelectorAll('.toc-list a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// Marcar link activo del TOC según sección visible
const sections = document.querySelectorAll('.legal-section[id]');
const tocLinks = document.querySelectorAll('.toc-list a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      tocLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${entry.target.id}`
          ? 'var(--red)'
          : '';
      });
    }
  });
}, { threshold: 0.4, rootMargin: '-80px 0px -60% 0px' });

sections.forEach(s => sectionObserver.observe(s));

// Leer tiempo de lectura real
(function calcReadTime() {
  const text  = document.querySelector('.legal-doc')?.textContent || '';
  const words = text.trim().split(/\s+/).length;
  const mins  = Math.ceil(words / 200);
  const el    = document.querySelector('.doc-meta-val');
  if (el) el.textContent = `~${mins} minutos`;
})();