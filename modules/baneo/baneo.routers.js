/**
 * baneo.routers.js — Mapa de rutas HTTP del módulo Baneo
 * Para despachar el splat en /.netlify/functions/baneo/:splat
 * @see modules/baneo/baneo.config.js
 */
'use strict';

const config = require('./baneo.config.js');

// ============================================================
// Definición de rutas
// ============================================================

const ROUTES = [
  {
    segment  : 'solicitud',
    methods  : ['POST', 'OPTIONS'],
    handler  : 'solicitud',
    rateLimit: config.RATE_LIMITS.solicitud,
    auth     : false,
    desc     : 'Crear nueva solicitud de baneo',
  },
  {
    segment  : 'estado',
    methods  : ['GET', 'OPTIONS'],
    handler  : 'estado',
    rateLimit: config.RATE_LIMITS.estado,
    auth     : false,
    desc     : 'Consultar estado de una solicitud por caso_numero o email',
  },
  {
    segment  : 'planes',
    methods  : ['GET', 'OPTIONS'],
    handler  : 'planes',
    rateLimit: config.RATE_LIMITS.planes,
    auth     : false,
    desc     : 'Listar planes activos por tipo',
  },
  {
    segment  : 'webhook',
    methods  : ['POST', 'OPTIONS'],
    handler  : 'webhook',
    rateLimit: config.RATE_LIMITS.webhook,
    auth     : false,
    desc     : 'Webhook de Stripe para confirmar pagos',
  },
];

// ============================================================
// Mapas derivados para consulta O(1)
// ============================================================

/** { solicitud: ['POST','OPTIONS'], ... } */
const METHODS_BY_SEGMENT = ROUTES.reduce((acc, r) => {
  acc[r.segment] = r.methods;
  return acc;
}, {});

/** { solicitud: { ...route }, ... } */
const ROUTE_BY_SEGMENT = ROUTES.reduce((acc, r) => {
  acc[r.segment] = r;
  return acc;
}, {});

// ============================================================
// Helpers de URL
// ============================================================

/**
 * Extrae el primer segmento tras "baneo" en una URL de request.
 *
 * Ejemplos:
 *   /api/baneo/solicitud              → "solicitud"
 *   /.netlify/functions/baneo/estado  → "estado"
 *   /baneo/planes?tipo=personal       → "planes"
 *   /baneo (sin segmento)             → null
 *
 * @param {string} rawPath
 * @returns {string|null}
 */
function extractSegment(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return null;
  const path  = rawPath.split('?')[0];
  const parts = path.split('/').filter(Boolean);
  const i     = parts.indexOf('baneo');
  if (i === -1) return null;
  const segment = parts[i + 1] || null;
  return segment ? segment.toLowerCase() : null;
}

/**
 * Extrae los query params de un rawPath como objeto plano.
 *
 * Ejemplo:
 *   /api/baneo/planes?tipo=business&activo=true
 *   → { tipo: 'business', activo: 'true' }
 *
 * @param {string} rawPath
 * @returns {Record<string, string>}
 */
function extractQueryParams(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return {};
  const qs = rawPath.split('?')[1];
  if (!qs) return {};
  return Object.fromEntries(new URLSearchParams(qs).entries());
}

// ============================================================
// Resolución de rutas
// ============================================================

/**
 * Resuelve qué handler usar para un evento Netlify.
 * Retorna null si el segmento no existe o el método no está permitido.
 *
 * @param {string} httpMethod
 * @param {string} path — event.path
 * @returns {{ handler: string, route: object, segment: string } | null}
 */
function matchRoute(httpMethod, path) {
  const segment = extractSegment(path);
  if (!segment) return null;

  const route = ROUTE_BY_SEGMENT[segment];
  if (!route) return null;
  if (!route.methods.includes(httpMethod.toUpperCase())) return null;

  return { handler: route.handler, route, segment };
}

/**
 * Devuelve la respuesta correcta para una preflight OPTIONS.
 * Retorna null si el segmento no existe.
 *
 * @param {string} segment
 * @returns {{ headers: object } | null}
 */
function buildOptionsResponse(segment) {
  const route = ROUTE_BY_SEGMENT[segment];
  if (!route) return null;

  return {
    headers: {
      'Access-Control-Allow-Origin' : '*',
      'Access-Control-Allow-Methods': route.methods.join(', '),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age'      : '86400',
    },
  };
}

// ============================================================
// Utilidades de diagnóstico
// ============================================================

/**
 * Indica si el método está permitido para el segmento.
 * Útil para construir respuestas 405 con el header Allow correcto.
 *
 * @param {string} segment
 * @param {string} httpMethod
 * @returns {boolean}
 */
function isMethodAllowed(segment, httpMethod) {
  const allowed = METHODS_BY_SEGMENT[segment];
  if (!allowed) return false;
  return allowed.includes(httpMethod.toUpperCase());
}

/**
 * Devuelve los métodos permitidos para un segmento.
 * Útil para el header Allow en respuestas 405.
 *
 * @param {string} segment
 * @returns {string[]}
 */
function getAllowedMethods(segment) {
  return METHODS_BY_SEGMENT[segment] ?? [];
}

/**
 * Lista de segmentos expuestos.
 * Útil para mensajes 404 claros.
 *
 * @returns {string[]}
 */
function listSegments() {
  return ROUTES.map((r) => r.segment);
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  ROUTES,
  ROUTE_BY_SEGMENT,
  METHODS_BY_SEGMENT,
  extractSegment,
  extractQueryParams,
  matchRoute,
  buildOptionsResponse,
  isMethodAllowed,
  getAllowedMethods,
  listSegments,
};