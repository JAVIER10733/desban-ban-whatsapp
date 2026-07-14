/**
 * confirmacion.js — Componente Confirmación de Baneo
 * Módulo: Baneo / Components
 *
 * Uso:
 *   import Confirmacion from './confirmacion.js'
 *   const conf = new Confirmacion()
 *   conf.iniciar(datos)      // Arranca el estado processing
 *   conf.exito(datos)        // Muestra éxito con los datos del caso
 *   conf.error(mensaje)      // Muestra pantalla de error
 */

'use strict';

class Confirmacion {
  constructor(options = {}) {
    this._onReintentar = options.onReintentar || null;
    this._delay        = options.delay || 400;
  }

  // =============================================
  // MOSTRAR PROCESSING
  // =============================================
  iniciar(datos = {}) {
    this._mostrarEstado('processing');
    this._animarSteps(datos);
    return this;
  }

  // =============================================
  // MOSTRAR ÉXITO
  // =============================================
  exito(datos = {}) {
    this._mostrarEstado('success');
    this._rellenarDatos(datos);
    this._actualizarEnlaceEstado(datos.casoId);
    return this;
  }

  // =============================================
  // MOSTRAR ERROR
  // =============================================
  error(mensaje = 'Hubo un error al procesar tu solicitud.') {
    this._mostrarEstado('error');
    const msgEl = document.getElementById('confErrorMsg');
    if (msgEl) msgEl.textContent = mensaje;

    document.getElementById('confBtnReintentar')
      ?.addEventListener('click', () => {
        if (typeof this._onReintentar === 'function') this._onReintentar();
        else this._mostrarEstado('processing');
      });
    return this;
  }

  // =============================================
  // REGISTRAR CALLBACK REINTENTAR
  // =============================================
  onReintentar(fn) {
    this._onReintentar = fn;
    return this;
  }

  // =============================================
  // PRIVADOS
  // =============================================

  _mostrarEstado(estado) {
    const ids = {
      processing: 'confProcessing',
      success:    'confSuccess',
      error:      'confError'
    };
    Object.values(ids).forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
    document.getElementById(ids[estado])?.classList.remove('hidden');
    document.getElementById('confirmacion')?.scrollIntoView({
      behavior: 'smooth', block: 'start'
    });
  }

  _animarSteps(datos) {
    const steps = [
      { id: 'pss1', label: 'Verificando pago',      delay: 0    },
      { id: 'pss2', label: 'Registrando reporte',   delay: 1000 },
      { id: 'pss3', label: 'Asignando asesor',       delay: 2000 },
    ];

    steps.forEach(({ id, delay }) => {
      setTimeout(() => {
        const prev = steps.find(s => s.delay < delay);
        if (prev) {
          const prevEl = document.getElementById(prev.id);
          prevEl?.classList.remove('active');
          prevEl?.classList.add('done');
        }
        document.getElementById(id)?.classList.add('active');
      }, delay);
    });

    // Transición a éxito tras simular el proceso
    const duracion = datos.duracion || 3200;
    setTimeout(() => {
      if (datos && Object.keys(datos).length > 0) {
        // Marcar último paso como done
        document.getElementById('pss3')?.classList.remove('active');
        document.getElementById('pss3')?.classList.add('done');
        setTimeout(() => this.exito(datos), this._delay);
      }
    }, duracion);
  }

  _rellenarDatos(datos) {
    const motivoLabels = {
      acoso:            'Acoso o amenazas',
      spam:             'Spam masivo',
      estafa:           'Estafa o fraude',
      suplantacion:     'Suplantación',
      'contenido-ilegal': 'Contenido ilegal',
      otro:             'Otro motivo'
    };
    const planLabels = {
      basico:     'Básico — $29 USD',
      pro:        'Pro — $49 USD',
      enterprise: 'Enterprise — $89 USD'
    };

    this._setText('confCasoId',  datos.casoId  || '#BAN-0000');
    this._setText('confNumero',  datos.numero  || '—');
    this._setText('confMotivo',  motivoLabels[datos.motivo] || datos.motivo || '—');
    this._setText('confPlan',    planLabels[datos.plan]     || datos.plan   || '—');
    this._setText('confEmail',   datos.email   || '—');
  }

  _actualizarEnlaceEstado(casoId) {
    const btn = document.getElementById('confBtnEstado');
    if (!btn || !casoId) return;
    const base = btn.getAttribute('href') || '../../pages/estado-solicitud/';
    btn.setAttribute('href', `${base}?caso=${casoId}`);
  }

  _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

// Exportar
if (typeof module !== 'undefined') module.exports = Confirmacion;
else window.Confirmacion = Confirmacion;