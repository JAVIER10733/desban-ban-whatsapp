/**
 * baneo.api.js — Capa HTTP compartida del módulo Baneo (frontend)
 * Usada por baneo.service, estado.service y planes.service.
 * @see modules/baneo/docs/api-baneo.md
 */
'use strict';

(function (global) {
  var BASE =
    (typeof global.__BANEO_API_BASE__ === 'string' && global.__BANEO_API_BASE__) ||
    '/api/baneo';

  function BaneoApiError(message, status, body) {
    this.name = 'BaneoApiError';
    this.message = message || 'Error de API';
    this.status = status;
    this.body = body || {};
    if (Error.captureStackTrace) Error.captureStackTrace(this, BaneoApiError);
  }
  BaneoApiError.prototype = Object.create(Error.prototype);
  BaneoApiError.prototype.constructor = BaneoApiError;

  /**
   * @param {string} method
   * @param {string} path - ej. "/solicitud" (sin base)
   * @param {{ body?: object, query?: Record<string, string|number|boolean|null|undefined> }} [opts]
   * @returns {Promise<object>}
   */
  function request(method, path, opts) {
    opts = opts || {};
    var url = BASE.replace(/\/$/, '') + path;
    var q = opts.query;
    if (q) {
      var params = new URLSearchParams();
      Object.keys(q).forEach(function (k) {
        var v = q[k];
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
      var qs = params.toString();
      if (qs) url += '?' + qs;
    }

    var init = {
      method: method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin'
    };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

    return fetch(url, init).then(function (res) {
      return res.text().then(function (text) {
        var json = {};
        if (text) {
          try {
            json = JSON.parse(text);
          } catch (_) {
            json = { raw: text };
          }
        }
        if (!res.ok) {
          var msg =
            json.error ||
            (json.errors && json.errors.join && json.errors.join(', ')) ||
            res.statusText ||
            'Error HTTP';
          throw new BaneoApiError(msg, res.status, json);
        }
        return json;
      });
    });
  }

  global.BaneoApiError = BaneoApiError;
  global.BaneoApi = {
    request: request,
    getBase: function () {
      return BASE;
    },
    setBase: function (url) {
      BASE = url;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.BaneoApi;
    module.exports.BaneoApiError = BaneoApiError;
  }
})(typeof window !== 'undefined' ? window : global);
