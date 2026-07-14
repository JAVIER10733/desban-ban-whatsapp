/**
 * tipos.js — Módulo Desbaneo / Tipos de baneo
 */
'use strict';

// NAV scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// Reveal on scroll
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
// QUIZ DIAGNÓSTICO
// =============================================
const quizHistory = [];

function showQuizStep(id) {
  document.querySelectorAll('.quiz-step, .quiz-result').forEach(el => {
    el.classList.remove('active');
  });
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  updateProgress(id);
}

function updateProgress(id) {
  const bar = document.getElementById('quizBar');
  if (!bar) return;
  const map = { q1: 25, q2: 50 };
  bar.style.width = id.startsWith('result') ? '100%' : `${map[id] || 25}%`;
}

// Opciones del quiz
document.querySelectorAll('.quiz-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    const currentStep = document.querySelector('.quiz-step.active');
    if (currentStep) quizHistory.push(currentStep.id);
    showQuizStep(btn.dataset.next);
  });
});

// Reiniciar
document.querySelectorAll('.quiz-restart').forEach(btn => {
  btn.addEventListener('click', () => {
    quizHistory.length = 0;
    showQuizStep('q1');
  });
});

// =============================================
// SMOOTH SCROLL A SECCIONES
// =============================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
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

// =============================================
// LEER ?tipo= Y HACER SCROLL AL TIPO
// =============================================
(function initFromUrl() {
  const tipo = new URLSearchParams(window.location.search).get('tipo');
  if (!tipo) return;
  const target = document.getElementById(`tipo-${tipo}`);
  if (target) {
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.style.outline = '1.5px solid var(--green)';
      setTimeout(() => { target.style.outline = ''; }, 2000);
    }, 600);
  }
})();