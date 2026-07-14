/**
 * modules/baneo/index.js — Punto de entrada Node (barrel) del módulo Baneo
 * En el navegador cargar los scripts en pages/services directamente.
 */
'use strict';

const config   = require('./baneo.config.js');
const routers  = require('./baneo.routers.js');
const routes   = require('./baneo.routes.js');
const baneoApi = require('./services/baneo.api.js');
const baneo    = require('./services/baneo.service.js');
const estado   = require('./services/estado.service.js');
const planes   = require('./services/planes.service.js');

// ============================================================
// Validación de carga — falla rápido si falta algún servicio
// ============================================================

const REQUIRED = { config, routers, routes, baneoApi, baneo, estado, planes };

for (const [name, mod] of Object.entries(REQUIRED)) {
  if (!mod) throw new Error(`[baneo/index] No se pudo cargar el módulo: ${name}`);
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  config,
  routers,
  routes,

  services: {
    api          : baneoApi,
    BaneoApiError: baneoApi.BaneoApiError,
    baneo,
    estado,
    planes,
  },

  // Accesos directos a lo más usado desde handlers externos
  validar      : config.validar,
  ERRORES      : config.ERRORES,
  matchRoute   : routers.matchRoute,
  getPage      : routes.getPage,
  getPageByPath: routes.getPageByPath,
};