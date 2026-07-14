/**
 * hero.js — Componente Hero Baneo
 * Módulo: Baneo / Components
 *
 * Uso:
 *   import HeroBaneo from './hero.js'
 *   const hero = new HeroBaneo()
 *   hero.init()
 */

'use strict';

class HeroBaneo {
  constructor(options = {}) {
    this._termDelay  = options.termDelay  || 800;
    this._termLoop   = options.termLoop   !== false;
    this._loopDelay  = options.loopDelay  || 6000;
    this._statsDelay = options.statsDelay || 400;
  }

  // =============================================
  // INIT
  // =============================================
  init() {
    this._initTerminal();
    this._initStats();
    this._initScrollHint();
    return this;
  }

  // =============================================
  // TERMINAL ANIMADA
  // =============================================
  _initTerminal() {
    const hero = document.getElementById('heroBaneo');
    if (!hero) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTimeout(() => this._runTerminal(), this._termDelay);
        observer.disconnect();
      }
    }, { threshold: 0.3 });

    observer.observe(hero);
  }

  _runTerminal() {
    const steps = [
      { id: 'tl2',     delay: 600  },
      { id: 'tl3',     delay: 1200 },
      { id: 'tl4',     delay: 1900 },
      { id: 'tCursor', delay: 1900 },
    ];

    // Reset
    ['tl2','tl3','tl4','tl5','tCursor'].forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
    const loading = document.getElementById('tLoading');
    if (loading) loading.textContent = '◌';
    const loadingTxt = document.getElementById('tLoadingTxt');
    if (loadingTxt) loadingTxt.textContent = ' Enviando reporte a Meta...';

    // Mostrar líneas secuencialmente
    steps.forEach(({ id, delay }) => {
      setTimeout(() => {
        document.getElementById(id)?.classList.remove('hidden');
      }, delay);
    });

    // Animación de loading spinner
    let frame = 0;
    const frames = ['◌','◎','●','◎'];
    const spinInterval = setInterval(() => {
      const el = document.getElementById('tLoading');
      if (el) el.textContent = frames[frame % frames.length];
      frame++;
    }, 200);

    // Éxito
    setTimeout(() => {
      clearInterval(spinInterval);
      document.getElementById('tl4')?.classList.add('hidden');
      document.getElementById('tl5')?.classList.remove('hidden');
      document.getElementById('tCursor')?.classList.add('hidden');

      // Loop
      if (this._termLoop) {
        setTimeout(() => this._runTerminal(), this._loopDelay);
      }
    }, 4200);
  }

  // =============================================
  // STAT FLOATS — aparecen con delay
  // =============================================
  _initStats() {
    const stats = ['hbStat1', 'hbStat2', 'hbStat3'];
    stats.forEach((id, i) => {
      setTimeout(() => {
        document.getElementById(id)?.classList.add('visible');
      }, this._statsDelay + i * 200);
    });
  }

  // =============================================
  // SCROLL HINT — desaparece al hacer scroll
  // =============================================
  _initScrollHint() {
    const hint = document.querySelector('.hb-scroll-hint');
    if (!hint) return;

    const handleScroll = () => {
      const opacity = Math.max(0, 1 - window.scrollY / 200);
      hint.style.opacity = String(opacity);
      if (opacity === 0) window.removeEventListener('scroll', handleScroll);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // =============================================
  // API PÚBLICA
  // =============================================

  /** Actualizar texto del badge dinámicamente */
  setBadge(txt) {
    const el = document.querySelector('.hb-badge-txt');
    if (el) el.textContent = txt;
    return this;
  }

  /** Actualizar líneas del título */
  setTitulo(linea1, linea2, acento) {
    const map = { hbLine1: linea1, hbLine2: linea2, hbLine3: acento };
    Object.entries(map).forEach(([id, val]) => {
      if (val) { const el = document.getElementById(id); if (el) el.textContent = val; }
    });
    return this;
  }

  /** Actualizar href del botón CTA */
  setCTA(href) {
    const btn = document.getElementById('hbBtnPrimary');
    if (btn) btn.setAttribute('href', href);
    return this;
  }
}

if (typeof module !== 'undefined') module.exports = HeroBaneo;
else window.HeroBaneo = HeroBaneo;