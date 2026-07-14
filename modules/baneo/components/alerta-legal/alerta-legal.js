/**
 * alerta-legal.js — Componente Alerta Legal
 * Módulo: Baneo / Components
 *
 * Uso:
 *   import AlertaLegal from './alerta-legal.js'
 *   const alerta = new AlertaLegal({ modo: 'inline' | 'expandida' | 'banner' })
 *   alerta.init()
 *   alerta.onAceptar(() => habilitarBotonCTA())
 */

'use strict';

class AlertaLegal {
  /**
   * @param {Object} options
   * @param {'inline'|'expandida'|'banner'} options.modo
   * @param {boolean} options.persistir — guardar en sessionStorage si fue cerrada
   * @param {Function} options.onAceptar — callback cuando el usuario acepta
   */
  constructor(options = {}) {
    this.modo      = options.modo      || 'inline';
    this.persistir = options.persistir !== false;
    this._onAceptar = options.onAceptar || null;
    this._aceptada  = false;
  }

  // =============================================
  // INICIALIZACIÓN
  // =============================================
  init() {
    this._mostrarModo(this.modo);
    this._bindEventos();

    // Restaurar estado desde sessionStorage
    if (this.persistir && sessionStorage.getItem('alerta_legal_cerrada') === '1') {
      this._cerrar('inline');
      this._cerrar('banner');
    }
    if (sessionStorage.getItem('alerta_legal_aceptada') === '1') {
      this._marcarAceptada();
    }

    return this;
  }

  // =============================================
  // MOSTRAR MODO ESPECÍFICO
  // =============================================
  _mostrarModo(modo) {
    const modos = {
      inline:    document.getElementById('alertaInline'),
      expandida: document.getElementById('alertaExpandida'),
      banner:    document.getElementById('alertaBanner'),
    };
    Object.entries(modos).forEach(([key, el]) => {
      if (!el) return;
      if (key === modo) el.classList.remove('hidden');
      else el.classList.add('hidden');
    });
  }

  // =============================================
  // BINDING DE EVENTOS
  // =============================================
  _bindEventos() {
    // Cerrar inline
    document.getElementById('alertaInlineClose')
      ?.addEventListener('click', () => this._cerrar('inline'));

    // Toggle expandida
    const toggle = document.getElementById('alertaToggle');
    toggle?.addEventListener('click', () => this._toggleExpandida());

    // Header expandida — también hace toggle
    document.querySelector('.ae-header')
      ?.addEventListener('click', (e) => {
        if (!e.target.closest('.ae-toggle')) this._toggleExpandida();
      });

    // Checkbox aceptación
    document.getElementById('aceptaAvisoLegal')
      ?.addEventListener('change', (e) => {
        if (e.target.checked) this._marcarAceptada();
        else this._desmarcarAceptada();
      });

    // Cerrar banner
    document.getElementById('alertaBannerClose')
      ?.addEventListener('click', () => this._cerrar('banner'));
  }

  // =============================================
  // TOGGLE CUERPO EXPANDIDA
  // =============================================
  _toggleExpandida() {
    const body   = document.getElementById('alertaBody');
    const toggle = document.getElementById('alertaToggle');
    if (!body || !toggle) return;

    const isOpen = body.classList.contains('open');
    body.classList.toggle('open', !isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
  }

  // =============================================
  // CERRAR VARIANTE
  // =============================================
  _cerrar(modo) {
    const ids = { inline: 'alertaInline', banner: 'alertaBanner' };
    document.getElementById(ids[modo])?.classList.add('hidden');
    if (this.persistir) sessionStorage.setItem('alerta_legal_cerrada', '1');
  }

  // =============================================
  // ACEPTAR AVISO
  // =============================================
  _marcarAceptada() {
    this._aceptada = true;
    document.getElementById('alertaLegal')?.classList.add('aceptada');
    if (this.persistir) sessionStorage.setItem('alerta_legal_aceptada', '1');
    if (typeof this._onAceptar === 'function') this._onAceptar(true);
  }

  _desmarcarAceptada() {
    this._aceptada = false;
    document.getElementById('alertaLegal')?.classList.remove('aceptada');
    if (this.persistir) sessionStorage.removeItem('alerta_legal_aceptada');
    if (typeof this._onAceptar === 'function') this._onAceptar(false);
  }

  // =============================================
  // API PÚBLICA
  // =============================================

  /** Registra callback que se dispara al aceptar/desaceptar */
  onAceptar(fn) {
    this._onAceptar = fn;
    return this;
  }

  /** Fuerza mostrar un modo en runtime */
  mostrar(modo) {
    this._mostrarModo(modo);
    return this;
  }

  /** Devuelve si el usuario aceptó el aviso */
  get aceptada() {
    return this._aceptada;
  }

  /** Valida y lanza error visual si no fue aceptada */
  validar() {
    if (this._aceptada) return true;
    const toggle = document.getElementById('alertaToggle');
    if (toggle && toggle.getAttribute('aria-expanded') === 'false') {
      this._toggleExpandida();
    }
    document.getElementById('aceptaAvisoLegal')
      ?.closest('.ae-check-wrap')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
}

// Exportar para uso con módulos ES
if (typeof module !== 'undefined') module.exports = AlertaLegal;
else window.AlertaLegal = AlertaLegal;