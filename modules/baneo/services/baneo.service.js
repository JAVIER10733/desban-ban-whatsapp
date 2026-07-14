/**
 * baneo.service.js — Solicitudes de baneo (POST /solicitud)
 * Requiere: baneo.api.js antes de este script.
 * @see modules/baneo/docs/api-baneo.md
 */
'use strict';

(function (global) {
  function api() {
    if (!global.BaneoApi) {
      throw new Error('Carga baneo.api.js antes de baneo.service.js');
    }
    return global.BaneoApi;
  }

  /**
   * POST /api/baneo/solicitud
   * @param {object} payload
   * @returns {Promise<{ success: boolean, data?: object }>}
   */
  function crearSolicitud(payload) {
    return api().request('POST', '/solicitud', { body: payload });
  }

  /** Misma petición que EstadoBaneoService.consultar */
  function getEstado(params) {
    params = params || {};
    return api().request('GET', '/estado', { query: { id: params.id, email: params.email } });
  }

  /** Misma petición que PlanesBaneoService.listar */
  function getPlanes(params) {
    params = params || {};
    return api().request('GET', '/planes', { query: { tipo: params.tipo || 'personal' } });
  }

  global.BaneoService = {
    get BASE() {
      return api().getBase();
    },
    setBase: function (url) {
      api().setBase(url);
    },
    get BaneoApiError() {
      return global.BaneoApiError;
    },
    crearSolicitud: crearSolicitud,
    getEstado: getEstado,
    getPlanes: getPlanes
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.BaneoService;
  }
})(typeof window !== 'undefined' ? window : global);
