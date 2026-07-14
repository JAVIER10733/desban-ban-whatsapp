/**
 * razones.js — Módulo Baneo / Razones
 */
'use strict';

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

if (typeof RazonesGrid !== 'undefined') {
  new RazonesGrid().init();
}
