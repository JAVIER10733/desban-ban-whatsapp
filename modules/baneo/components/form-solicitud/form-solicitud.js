/**
 * form-solicitud.js — Componente Formulario de Baneo
 * Módulo: Baneo / Components
 *
 * Uso:
 *   import FormSolicitud from './form-solicitud.js'
 *   const form = new FormSolicitud({ onSubmit: async (datos) => { ... } })
 *   form.init()
 */

'use strict';

class FormSolicitud {
  constructor(options = {}) {
    this._onSubmit   = options.onSubmit   || null;
    this._onStepChange = options.onStepChange || null;
    this._currentStep  = 1;
    this._state        = {
      numero:       '',
      prefijo:      '+52',
      motivo:       '',
      descripcion:  '',
      nombre:       '',
      email:        '',
      pref:         'email',
      plan:         'pro',
      precio:       49,
      aceptaAviso:  false
    };
  }

  // =============================================
  // INIT
  // =============================================
  init() {
    this._bindNavegacion();
    this._bindMotivos();
    this._bindCountrySelect();
    this._bindUpload();
    this._bindDescripcion();
    this._bindPlanes();
    this._bindPreferencias();
    this._bindSubmit();
    this._initFromUrl();
    return this;
  }

  // =============================================
  // NAVEGACIÓN ENTRE PASOS
  // =============================================
  _bindNavegacion() {
    document.getElementById('btnNext1')?.addEventListener('click', () => {
      if (this._validarPaso1()) this._irPaso(2);
    });
    document.getElementById('btnNext2')?.addEventListener('click', () => {
      if (this._validarPaso2()) this._irPaso(3);
    });
    document.getElementById('btnBack2')?.addEventListener('click', () => this._irPaso(1));
    document.getElementById('btnBack3')?.addEventListener('click', () => this._irPaso(2));
  }

  _irPaso(n) {
    const pasos = [1, 2, 3];
    pasos.forEach(i => {
      const el = document.getElementById(`fs${i}`);
      if (el) el.classList.toggle('hidden', i !== n);
    });
    this._currentStep = n;
    if (n === 3) this._actualizarResumen();
    if (typeof this._onStepChange === 'function') this._onStepChange(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =============================================
  // VALIDACIÓN PASO 1
  // =============================================
  _validarPaso1() {
    let ok = true;

    // Número
    const num = document.getElementById('fs-numero')?.value.trim();
    const numOk = /^\d{7,15}$/.test((num || '').replace(/\s/g, ''));
    this._toggleError('numero-error', !numOk);
    this._markInput('fs-numero', !numOk);
    if (!numOk) ok = false;
    else this._state.numero = this._state.prefijo + ' ' + num;

    // Motivo
    if (!this._state.motivo) {
      this._toggleError('motivo-error', true);
      ok = false;
    }

    // Descripción
    const desc = document.getElementById('fs-descripcion')?.value.trim();
    const descOk = desc && desc.length >= 20;
    this._toggleError('desc-error', !descOk);
    this._markInput('fs-descripcion', !descOk, true);
    if (!descOk) ok = false;
    else this._state.descripcion = desc;

    // Aviso legal
    const aviso = document.getElementById('fs-acepta-aviso')?.checked;
    this._toggleError('aviso-error', !aviso);
    if (!aviso) ok = false;
    else this._state.aceptaAviso = true;

    return ok;
  }

  // =============================================
  // VALIDACIÓN PASO 2
  // =============================================
  _validarPaso2() {
    let ok = true;

    const nombre = document.getElementById('fs-nombre')?.value.trim();
    const nombreOk = nombre && nombre.length >= 2;
    this._toggleError('nombre-error', !nombreOk);
    this._markInput('fs-nombre', !nombreOk);
    if (!nombreOk) ok = false;
    else this._state.nombre = nombre;

    const email = document.getElementById('fs-email')?.value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
    this._toggleError('email-error', !emailOk);
    this._markInput('fs-email', !emailOk);
    if (!emailOk) ok = false;
    else this._state.email = email;

    return ok;
  }

  // =============================================
  // MOTIVOS
  // =============================================
  _bindMotivos() {
    document.querySelectorAll('.motivo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.motivo-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        this._state.motivo = btn.dataset.value;
        this._toggleError('motivo-error', false);

        const otroGroup = document.getElementById('otroMotivoGroup');
        if (otroGroup) otroGroup.classList.toggle('hidden', this._state.motivo !== 'otro');
      });
    });
  }

  // =============================================
  // COUNTRY SELECT
  // =============================================
  _bindCountrySelect() {
    const btn      = document.getElementById('countryBtn');
    const dropdown = document.getElementById('countryDropdown');

    btn?.addEventListener('click', () => {
      dropdown?.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', String(!dropdown?.classList.contains('hidden')));
    });

    document.querySelectorAll('.country-dropdown li').forEach(li => {
      li.addEventListener('click', () => {
        this._state.prefijo = li.dataset.code;
        const flag = document.getElementById('countryFlag');
        const code = document.getElementById('countryCode');
        if (flag) flag.textContent = li.dataset.flag;
        if (code) code.textContent = li.dataset.code;
        dropdown?.classList.add('hidden');
        btn?.setAttribute('aria-expanded', 'false');
        document.getElementById('fs-numero')?.focus();
      });
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.country-select-wrap')) {
        dropdown?.classList.add('hidden');
        btn?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // =============================================
  // UPLOAD
  // =============================================
  _bindUpload() {
    const zone  = document.getElementById('uploadZone');
    const input = document.getElementById('evidenciaInput');
    const list  = document.getElementById('uploadFilesList');

    zone?.addEventListener('click', () => input?.click());
    zone?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') input?.click(); });

    zone?.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone?.addEventListener('dragleave', ()  => zone.classList.remove('drag-over'));
    zone?.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      this._agregarArchivos(e.dataTransfer.files, list);
    });

    input?.addEventListener('change', () => this._agregarArchivos(input.files, list));
  }

  _agregarArchivos(files, container) {
    if (!container) return;
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) return;
      const chip = document.createElement('div');
      chip.className = 'upload-file-chip';
      chip.innerHTML = `<span>📎 ${file.name}</span><span class="chip-remove" title="Quitar">✕</span>`;
      chip.querySelector('.chip-remove')?.addEventListener('click', () => chip.remove());
      container.appendChild(chip);
    });
  }

  // =============================================
  // CONTADOR DESCRIPCIÓN
  // =============================================
  _bindDescripcion() {
    document.getElementById('fs-descripcion')?.addEventListener('input', function () {
      const count = document.getElementById('descCount');
      if (count) count.textContent = this.value.length;
      if (this.value.length >= 20) {
        document.getElementById('desc-error')?.classList.add('hidden');
        this.classList.remove('error');
      }
    });
  }

  // =============================================
  // PLANES
  // =============================================
  _bindPlanes() {
    document.querySelectorAll('.plan-row').forEach(row => {
      row.addEventListener('click', () => this._seleccionarPlan(row));
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') this._seleccionarPlan(row);
      });
    });
  }

  _seleccionarPlan(row) {
    document.querySelectorAll('.plan-row').forEach(r => {
      r.classList.remove('selected');
      r.setAttribute('aria-checked', 'false');
      r.querySelector('.plan-radio-dot')?.classList.remove('checked');
    });
    row.classList.add('selected');
    row.setAttribute('aria-checked', 'true');
    row.querySelector('.plan-radio-dot')?.classList.add('checked');
    this._state.plan   = row.dataset.plan;
    this._state.precio = parseInt(row.dataset.price, 10);
    this._actualizarResumen();
    const txt = document.getElementById('btnSubmitTxt');
    if (txt) txt.textContent = `Ir al pago — $${this._state.precio} USD →`;
  }

  // =============================================
  // PREFERENCIAS DE CONTACTO
  // =============================================
  _bindPreferencias() {
    document.querySelectorAll('.pref-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pref-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        this._state.pref = btn.dataset.value;
      });
    });
  }

  // =============================================
  // RESUMEN
  // =============================================
  _actualizarResumen() {
    const motivoMap = {
      acoso:'Acoso',spam:'Spam',estafa:'Estafa',
      suplantacion:'Suplantación','contenido-ilegal':'C. ilegal',otro:'Otro'
    };
    const planMap = { basico:'Básico', pro:'Pro', enterprise:'Enterprise' };

    this._setText('osPlan',    planMap[this._state.plan]      || '—');
    this._setText('osNumero',  this._state.numero              || '—');
    this._setText('osMotivo',  motivoMap[this._state.motivo]  || '—');
    this._setText('osTotal',   `$${this._state.precio} USD`);
  }

  // =============================================
  // SUBMIT
  // =============================================
  _bindSubmit() {
    document.getElementById('formSolicitud')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this._handleSubmit();
    });
  }

  async _handleSubmit() {
    const btn     = document.getElementById('btnSubmit');
    const txt     = document.getElementById('btnSubmitTxt');
    const spinner = document.getElementById('submitSpinner');

    if (btn) btn.disabled = true;
    txt?.classList.add('hidden');
    spinner?.classList.remove('hidden');

    try {
      if (typeof this._onSubmit === 'function') {
        await this._onSubmit({ ...this._state });
      }
    } catch (err) {
      console.error('[FormSolicitud] Error en submit:', err);
    } finally {
      if (btn) btn.disabled = false;
      txt?.classList.remove('hidden');
      spinner?.classList.add('hidden');
    }
  }

  // =============================================
  // URL PARAMS
  // =============================================
  _initFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const plan   = params.get('plan');
    const tipo   = params.get('tipo');

    if (plan) {
      const row = document.querySelector(`.plan-row[data-plan="${plan}"]`);
      if (row) this._seleccionarPlan(row);
    }

    if (tipo) {
      const btn = document.querySelector(`.motivo-btn[data-value="${tipo}"]`);
      if (btn) btn.click();
    }
  }

  // =============================================
  // API PÚBLICA
  // =============================================

  /** Obtener datos actuales del formulario */
  get datos() { return { ...this._state }; }

  /** Resetear formulario */
  reset() {
    document.getElementById('formSolicitud')?.reset();
    this._state = { numero:'', prefijo:'+52', motivo:'', descripcion:'', nombre:'', email:'', pref:'email', plan:'pro', precio:49, aceptaAviso:false };
    this._irPaso(1);
  }

  // =============================================
  // HELPERS PRIVADOS
  // =============================================
  _toggleError(id, show) {
    document.getElementById(id)?.classList.toggle('hidden', !show);
  }

  _markInput(id, hasError, isTextarea = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('error', hasError);
  }

  _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

if (typeof module !== 'undefined') module.exports = FormSolicitud;
else window.FormSolicitud = FormSolicitud;