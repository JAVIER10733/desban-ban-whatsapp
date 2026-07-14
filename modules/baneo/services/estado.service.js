/**
 * estado.service.js — Consulta de estado de solicitudes baneo
 * GET /api/baneo/estado
 * Requiere: baneo.api.js antes de este script.
 * @see modules/baneo/docs/api-baneo.md
 */
'use strict';

(function (global) {
  function api() {
    if (!global.BaneoApi) {
      throw new Error('Carga baneo.api.js antes de estado.service.js');
    }
    return global.BaneoApi;
  }

  /**
   * @param {{ id?: string, email?: string }} params — exactamente uno obligatorio
   * @returns {Promise<object>}
   */
  function consultar(params) {
    params = params || {};
    if (!params.id && !params.email) {
      return Promise.reject(new Error('Debes indicar id (número de caso) o email.'));
    }
    return api().request('GET', '/estado', {
      query: { id: params.id, email: params.email }
    });
  }

  /**
   * @param {string} casoId — ej. BAN-abc123 o DES-4821
   */
  function porCaso(casoId) {
    if (!casoId || String(casoId).trim() === '') {
      return Promise.reject(new Error('Número de caso vacío.'));
    }
    return consultar({ id: String(casoId).trim() });
  }

  /**
   * @param {string} email
   */
  function porEmail(email) {
    if (!email || String(email).trim() === '') {
      return Promise.reject(new Error('Email vacío.'));
    }
    return consultar({ email: String(email).trim().toLowerCase() });
  }

  global.EstadoBaneoService = {
    consultar: consultar,
    porCaso: porCaso,
    porEmail: porEmail
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.EstadoBaneoService;
  }
})(typeof window !== 'undefined' ? window : global);
