/**
 * baneo.routes.js — Rutas públicas del sitio (páginas HTML) del módulo Baneo
 * Complementa baneo.routers.js (handlers /api/baneo/*).
 * Las publicPath coinciden con los redirects en netlify.toml cuando existan.
 */
'use strict';

const config = require('./baneo.config.js');

/**
 * Páginas del módulo: URL limpia y archivo bajo modules/baneo/
 * @type {Array<{
 *   id: string,
 *   publicPath: string,
 *   moduleFile: string,
 *   navLabel: string | null,
 *   inSitemap?: boolean
 * }>}
 */
const PAGES = [
  {
    id: 'landing',
    publicPath: '/baneo',
    moduleFile: 'pages/landing/index.html',
    navLabel: 'Baneo',
    inSitemap: true
  },
  {
    id: 'solicitud',
    publicPath: '/baneo/solicitud',
    moduleFile: 'pages/solicitud/index.html',
    navLabel: null,
    inSitemap: true
  },
  {
    id: 'planes',
    publicPath: '/baneo/planes',
    moduleFile: 'pages/planes/index.html',
    navLabel: 'Precios',
    inSitemap: true
  },
  {
    id: 'proceso',
    publicPath: '/baneo/proceso',
    moduleFile: 'pages/proceso/index.html',
    navLabel: 'Cómo funciona',
    inSitemap: true
  },
  {
    id: 'razones',
    publicPath: '/baneo/razones',
    moduleFile: 'pages/razones/index.html',
    navLabel: 'Por qué banear',
    inSitemap: true
  },
  {
    id: 'avisoLegal',
    publicPath: '/baneo/aviso-legal',
    moduleFile: 'pages/aviso-legal/index.html',
    navLabel: null,
    inSitemap: true
  },
  {
    id: 'tiposBaneo',
    publicPath: '/baneo/tipos-baneo',
    moduleFile: 'pages/tipos-baneo/index.html',
    navLabel: 'Tipos de baneo',
    inSitemap: true
  },
  {
    id: 'estadoSolicitud',
    publicPath: '/estado',
    moduleFile: 'pages/estado-solicitud/index.html',
    navLabel: 'Estado del caso',
    inSitemap: true
  }
];

/**
 * URLs de API absolutas respecto al sitio (mismo origen).
 * @returns {Record<string, string>}
 */
function getApiPaths() {
  const out = {};
  Object.keys(config.RUTAS_API).forEach((k) => {
    out[k] = config.API_PREFIX + config.RUTAS_API[k];
  });
  return out;
}

/**
 * @param {string} id — id de PAGES
 * @returns {object | null}
 */
function getPage(id) {
  return PAGES.find((p) => p.id === id) || null;
}

/**
 * Busca página por pathname (sin query). Normaliza trailing slash.
 * @param {string} pathname — ej. "/baneo/solicitud" o "/baneo/solicitud/"
 * @returns {object | null}
 */
function getPageByPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const n = pathname.split('?')[0].replace(/\/$/, '') || '/';
  return PAGES.find((p) => p.publicPath.replace(/\/$/, '') === n) || null;
}

/**
 * Páginas marcadas para navegación o listados (navLabel no nulo).
 * @returns {object[]}
 */
function listNavPages() {
  return PAGES.filter((p) => p.navLabel);
}

/**
 * Páginas para sitemap (inSitemap !== false).
 * @returns {object[]}
 */
function listSitemapPages() {
  return PAGES.filter((p) => p.inSitemap !== false);
}

/**
 * baneo.routes.js — Rutas públicas del sitio (páginas HTML) del módulo Baneo
 * Complementa baneo.routers.js (handlers /api/baneo/*).
 * Las publicPath coinciden con los redirects en netlify.toml cuando existan.
 */
'use strict';

const config = require('./baneo.config.js');

// ============================================================
// Páginas del módulo
// ============================================================

/**
 * @typedef {Object} Page
 * @property {string}       id          - Identificador único
 * @property {string}       publicPath  - URL limpia pública
 * @property {string}       moduleFile  - Archivo bajo modules/baneo/
 * @property {string|null}  navLabel    - Texto en navegación (null = oculto)
 * @property {boolean}      inSitemap   - Incluir en sitemap.xml
 * @property {string|null}  title       - <title> de la página
 * @property {string|null}  description - Meta description
 */

/** @type {Page[]} */
const PAGES = [
  {
    id         : 'landing',
    publicPath : '/baneo',
    moduleFile : 'pages/landing/index.html',
    navLabel   : 'Baneo',
    inSitemap  : true,
    title      : 'Reportar número de WhatsApp',
    description: 'Reporta un número de WhatsApp de forma rápida, segura y con garantía de devolución.',
  },
  {
    id         : 'solicitud',
    publicPath : '/baneo/solicitud',
    moduleFile : 'pages/solicitud/index.html',
    navLabel   : null,
    inSitemap  : true,
    title      : 'Nueva solicitud de baneo',
    description: 'Completa el formulario para iniciar tu solicitud de baneo.',
  },
  {
    id         : 'planes',
    publicPath : '/baneo/planes',
    moduleFile : 'pages/planes/index.html',
    navLabel   : 'Precios',
    inSitemap  : true,
    title      : 'Planes y precios',
    description: 'Elige el plan que mejor se adapta a tu caso. Todos incluyen seguimiento en tiempo real.',
  },
  {
    id         : 'proceso',
    publicPath : '/baneo/proceso',
    moduleFile : 'pages/proceso/index.html',
    navLabel   : 'Cómo funciona',
    inSitemap  : true,
    title      : 'Cómo funciona el proceso de baneo',
    description: 'Conoce cada paso del proceso: desde el reporte hasta la confirmación.',
  },
  {
    id         : 'razones',
    publicPath : '/baneo/razones',
    moduleFile : 'pages/razones/index.html',
    navLabel   : 'Por qué banear',
    inSitemap  : true,
    title      : 'Razones para reportar un número',
    description: 'Acoso, spam, estafas y suplantación son motivos válidos para iniciar un reporte.',
  },
  {
    id         : 'tiposBaneo',
    publicPath : '/baneo/tipos-baneo',
    moduleFile : 'pages/tipos-baneo/index.html',
    navLabel   : 'Tipos de baneo',
    inSitemap  : true,
    title      : 'Tipos de baneo en WhatsApp',
    description: 'Aprende a identificar si un número tiene ban temporal, permanente o de verificación.',
  },
  {
    id         : 'avisoLegal',
    publicPath : '/baneo/aviso-legal',
    moduleFile : 'pages/aviso-legal/index.html',
    navLabel   : null,
    inSitemap  : true,
    title      : 'Aviso legal',
    description: 'Términos y condiciones del servicio de reporte de números de WhatsApp.',
  },
  {
    id         : 'estadoSolicitud',
    publicPath : '/estado',
    moduleFile : 'pages/estado-solicitud/index.html',
    navLabel   : 'Estado del caso',
    inSitemap  : true,
    title      : 'Consultar estado de tu solicitud',
    description: 'Ingresa tu número de caso o email para ver el estado actual de tu reporte.',
  },
];

// ============================================================
// Prefijo del módulo en el repo
// ============================================================

const MODULE_ROOT = 'modules/baneo';

// ============================================================
// Mapas derivados para consulta O(1)
// ============================================================

/** { landing: { ...page }, solicitud: { ...page }, ... } */
const PAGE_BY_ID = PAGES.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

/** { '/baneo': { ...page }, '/baneo/solicitud': { ...page }, ... } */
const PAGE_BY_PATH = PAGES.reduce((acc, p) => {
  acc[p.publicPath.replace(/\/$/, '') || '/'] = p;
  return acc;
}, {});

// ============================================================
// Consultas de páginas
// ============================================================

/**
 * Busca una página por su id.
 * @param {string} id
 * @returns {Page|null}
 */
function getPage(id) {
  return PAGE_BY_ID[id] ?? null;
}

/**
 * Busca una página por pathname. Normaliza trailing slash y query string.
 * @param {string} pathname — ej. "/baneo/solicitud" o "/baneo/solicitud/"
 * @returns {Page|null}
 */
function getPageByPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return null;
  const normalized = pathname.split('?')[0].replace(/\/$/, '') || '/';
  return PAGE_BY_PATH[normalized] ?? null;
}

/**
 * Páginas visibles en navegación (navLabel no nulo).
 * @returns {Page[]}
 */
function listNavPages() {
  return PAGES.filter((p) => p.navLabel !== null);
}

/**
 * Páginas para sitemap.xml.
 * @returns {Page[]}
 */
function listSitemapPages() {
  return PAGES.filter((p) => p.inSitemap !== false);
}

/**
 * Genera entradas de sitemap con baseUrl.
 * @param {string} baseUrl — ej. "https://tusitio.com"
 * @returns {Array<{ url: string, publicPath: string, id: string }>}
 */
function buildSitemapEntries(baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  return listSitemapPages().map((p) => ({
    id        : p.id,
    publicPath: p.publicPath,
    url       : `${base}${p.publicPath}`,
  }));
}

// ============================================================
// Rutas de API
// ============================================================

/**
 * URLs de API absolutas respecto al mismo origen.
 * @returns {Record<string, string>}
 */
function getApiPaths() {
  return Object.fromEntries(
    Object.entries(config.RUTAS_API).map(([k, v]) => [
      k,
      config.API_PREFIX + v,
    ])
  );
}

// ============================================================
// Resolución de archivos
// ============================================================

/**
 * Ruta absoluta en el repo hacia un HTML del módulo.
 * @param {string} moduleFile — ej. "pages/landing/index.html"
 * @returns {string}
 */
function resolveModuleFile(moduleFile) {
  return `${MODULE_ROOT}/${moduleFile}`.replace(/\\/g, '/');
}

/**
 * Resuelve el archivo HTML de una página por su id.
 * @param {string} id
 * @returns {string|null}
 */
function resolvePageFile(id) {
  const page = getPage(id);
  return page ? resolveModuleFile(page.moduleFile) : null;
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  PAGES,
  PAGE_BY_ID,
  PAGE_BY_PATH,
  MODULE_ROOT,
  config,
  getPage,
  getPageByPath,
  listNavPages,
  listSitemapPages,
  buildSitemapEntries,
  getApiPaths,
  resolveModuleFile,
  resolvePageFile,
};