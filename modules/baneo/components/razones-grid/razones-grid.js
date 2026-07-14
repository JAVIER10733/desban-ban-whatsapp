/**
 * razones-grid.js — Componente Grid de Razones
 * Módulo: Baneo / Components
 *
 * Uso:
 *   import RazonesGrid from './razones-grid.js'
 *   const grid = new RazonesGrid()
 *   grid.init()
 */

'use strict';

class RazonesGrid {
  constructor(options = {}) {
    this._onCardClick  = options.onCardClick  || null;
    this._filtroActivo = options.filtro       || null;
    this._animDelay    = options.animDelay    || 80;
  }

  // =============================================
  // INIT
  // =============================================
  init() {
    this._initReveal();
    this._bindCards();
    this._initFiltro();
    if (this._filtroActivo) this.filtrar(this._filtroActivo);
    return this;
  }

  // =============================================
  // REVEAL ON SCROLL
  // =============================================
  _initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * this._animDelay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('#razonesGrid .reveal')
      .forEach(el => observer.observe(el));
  }

  // =============================================
  // CLICK EN CARD
  // =============================================
  _bindCards() {
    document.querySelectorAll('.rg-card').forEach(card => {
      // Click en la card completa (excepto el CTA que tiene su propio href)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.rg-card-cta')) return;
        const razon = card.dataset.razon;
        if (typeof this._onCardClick === 'function') {
          this._onCardClick(razon, card);
        }
      });

      // Efecto hover con borde rojo
      card.addEventListener('mouseenter', () => {
        card.style.outline = '.5px solid rgba(226,75,74,.25)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.outline = '';
      });
    });
  }

  // =============================================
  // FILTRO — resaltar una razón específica
  // =============================================
  _initFiltro() {
    const razon = new URLSearchParams(window.location.search).get('razon');
    if (razon) this.filtrar(razon);
  }

  filtrar(razon) {
    document.querySelectorAll('.rg-card').forEach(card => {
      const isMatch = card.dataset.razon === razon;
      card.style.opacity = isMatch || !razon ? '1' : '.4';
      if (isMatch) {
        card.style.outline = '1px solid rgba(226,75,74,.4)';
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => { card.style.outline = ''; }, 2000);
        }, 400);
      }
    });
    this._filtroActivo = razon;
    return this;
  }

  limpiarFiltro() {
    document.querySelectorAll('.rg-card').forEach(card => {
      card.style.opacity = '1';
      card.style.outline = '';
    });
    this._filtroActivo = null;
    return this;
  }

  // =============================================
  // API PÚBLICA
  // =============================================

  /** Obtiene todas las razones disponibles */
  get razones() {
    return Array.from(document.querySelectorAll('.rg-card'))
      .map(c => c.dataset.razon);
  }

  /** Registra callback al hacer click en una card */
  onCardClick(fn) {
    this._onCardClick = fn;
    return this;
  }
}

if (typeof module !== 'undefined') module.exports = RazonesGrid;
else window.RazonesGrid = RazonesGrid;