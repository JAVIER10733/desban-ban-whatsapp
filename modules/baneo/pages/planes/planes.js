/**
 * planes.js — Módulo Desbaneo / Planes
 */
'use strict';

// =============================================
// TOGGLE PERSONAL / BUSINESS
// =============================================
const btnPersonal  = document.getElementById('btnPersonal');
const btnBusiness  = document.getElementById('btnBusiness');
const groupPersonal = document.getElementById('groupPersonal');
const groupBusiness = document.getElementById('groupBusiness');
const compareTable  = document.getElementById('compareTable');

function switchGroup(type) {
  const isPersonal = type === 'personal';

  btnPersonal.classList.toggle('active', isPersonal);
  btnBusiness.classList.toggle('active', !isPersonal);
  groupPersonal.classList.toggle('hidden', !isPersonal);
  groupBusiness.classList.toggle('hidden', isPersonal);

  // Actualizar tabla comparativa
  if (compareTable) {
    const headers = compareTable.querySelectorAll('thead th:not(.feat-col)');
    const lastRow  = compareTable.querySelectorAll('tbody tr:last-child td:not(:first-child) a');

    if (!isPersonal) {
      const names  = ['Business','Business Pro','Enterprise'];
      const prices = ['$69','$99','$149'];
      const plans  = ['business','business-pro','api-enterprise'];
      headers.forEach((th, i) => {
        th.innerHTML = `${names[i]}<br><span>${prices[i]}</span>`;
        th.classList.toggle('th-popular', i === 1);
      });
      lastRow.forEach((a, i) => {
        a.href = `../solicitud/?plan=${plans[i]}`;
        a.classList.toggle('btn-table-primary', i === 1);
      });
    } else {
      const names  = ['Básico','Pro','Premium'];
      const prices = ['$19','$39','$59'];
      const plans  = ['basico','pro','premium'];
      headers.forEach((th, i) => {
        th.innerHTML = `${names[i]}<br><span>${prices[i]}</span>`;
        th.classList.toggle('th-popular', i === 1);
      });
      lastRow.forEach((a, i) => {
        a.href = `../solicitud/?plan=${plans[i]}`;
        a.classList.toggle('btn-table-primary', i === 1);
      });
    }
  }

  // Re-observar nuevas tarjetas visibles
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    revealObserver.observe(el);
  });
}

btnPersonal?.addEventListener('click', () => switchGroup('personal'));
btnBusiness?.addEventListener('click', () => switchGroup('business'));

// =============================================
// REVEAL ON SCROLL
// =============================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${i * 0.1}s`;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// =============================================
// FAQ ACORDEÓN
// =============================================
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

// =============================================
// LEER ?plan= Y RESALTAR PLAN + TOGGLE
// =============================================
(function initFromParams() {
  const params = new URLSearchParams(window.location.search);
  const plan   = params.get('plan')?.toLowerCase();
  if (!plan) return;

  const businessPlans = ['business', 'business-pro', 'api-enterprise'];
  if (businessPlans.includes(plan)) switchGroup('business');

  // Scroll al plan correcto
  setTimeout(() => {
    document.querySelectorAll('.plan-card').forEach(card => {
      const name = card.querySelector('.plan-name')?.textContent
        ?.toLowerCase().trim().replace(/\s+/g, '-');
      if (name === plan || plan.includes(name)) {
        card.style.boxShadow = '0 0 0 2px var(--green)';
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, 300);
})();

// =============================================
// NAV SCROLL
// =============================================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });