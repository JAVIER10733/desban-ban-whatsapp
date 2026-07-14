/**
 * planes.service.js — Listado de planes del módulo baneo
 * GET /api/baneo/planes
 * Requiere: baneo.api.js antes de este script.
 * @see modules/baneo/docs/api-baneo.md
 */
'use strict';

(function (global) {
  function api() {
    if (!global.BaneoApi) {
      throw new Error('Carga baneo.api.js antes de planes.service.js');
    }
    return global.BaneoApi;
  }

  /**
   * @param {{ tipo?: 'personal'|'business' }} [params]
   * @returns {Promise<{ success: boolean, data?: array }>}
   */
  function listar(params) {
    params = params || {};
    return api().request('GET', '/planes', {
      query: { tipo: params.tipo || 'personal' }
    });
  }

  function personal() {
    return listar({ tipo: 'personal' });
  }

  function business() {
    return listar({ tipo: 'business' });
  }

  global.PlanesBaneoService = {
    listar: listar,
    personal: personal,
    business: business
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.PlanesBaneoService;
  }
})(typeof window !== 'undefined' ? window : global);
