/**
 * Configuración de Routes para Tests
 * Definición de rutas y endpoints para testing
 */

import { testConfig } from './desbaneo.config.js';

// Definición de rutas de la API
export const apiRoutes = {
  // Solicitudes de desbaneo
  solicitudes: {
    base: '/api/desbaneo/solicitudes',
    crear: '/api/desbaneo/solicitudes',
    consultar: (referenceCode) => `/api/desbaneo/solicitudes/${referenceCode}`,
    cancelar: (referenceCode) => `/api/desbaneo/solicitudes/${referenceCode}/cancelar`,
    listar: '/api/desbaneo/solicitudes'
  },
  
  // Planes
  planes: {
    base: '/api/desbaneo/planes',
    listar: '/api/desbaneo/planes',
    obtener: (planId) => `/api/desbaneo/planes/${planId}`,
    comparar: '/api/desbaneo/planes/comparar'
  },
  
  // Tipos de baneo
  tiposBaneo: {
    base: '/api/desbaneo/tipos-baneo',
    listar: '/api/desbaneo/tipos-baneo',
    obtener: (tipoId) => `/api/desbaneo/tipos-baneo/${tipoId}`
  },
  
  // Descuentos
  descuentos: {
    base: '/api/desbaneo/descuentos',
    validar: '/api/desbaneo/descuentos/validar'
  },
  
  // Estadísticas
  estadisticas: {
    base: '/api/desbaneo/estadisticas',
    generales: '/api/desbaneo/estadisticas/generales',
    porPlan: '/api/desbaneo/estadisticas/por-plan'
  },
  
  // Pagos
  pagos: {
    base: '/api/pagos',
    crear: '/api/pagos/crear',
    confirmar: (pagoId) => `/api/pagos/${pagoId}/confirmar`,
    reembolsar: (pagoId) => `/api/pagos/${pagoId}/reembolsar`,
    webhook: '/api/pagos/webhook'
  },
  
  // Autenticación
  auth: {
    base: '/api/auth',
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refreshToken: '/api/auth/refresh'
  }
};

// Helper para construir URLs completas
export function buildUrl(route, params = {}) {
  let url = typeof route === 'function' ? route(params) : route;
  
  // Agregar query params si existen
  const queryParams = Object.keys(params)
    .filter(key => !['referenceCode', 'planId', 'tipoId', 'pagoId'].includes(key))
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  if (queryParams) {
    url += `?${queryParams}`;
  }
  
  return `${testConfig.baseUrl}${url}`;
}

// Headers comunes para tests
export const testHeaders = {
  json: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  auth: (token) => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  }),
  
  form: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};

// Helper para hacer requests de test
export async function testRequest(method, url, options = {}) {
  const defaultOptions = {
    method,
    headers: testHeaders.json,
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
      headers: response.headers
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error.message,
      data: null,
      error
    };
  }
}

// Métodos HTTP helpers
export const http = {
  get: (url, options = {}) => 
    testRequest('GET', url, options),
  
  post: (url, body, options = {}) => 
    testRequest('POST', url, { body: JSON.stringify(body), ...options }),
  
  put: (url, body, options = {}) => 
    testRequest('PUT', url, { body: JSON.stringify(body), ...options }),
  
  delete: (url, options = {}) => 
    testRequest('DELETE', url, options),
  
  patch: (url, body, options = {}) => 
    testRequest('PATCH', url, { body: JSON.stringify(body), ...options })
};

// Helpers específicos para desbaneo
export const desbaneoAPI = {
  // Solicitudes
  crearSolicitud: (data, token) => 
    http.post(buildUrl(apiRoutes.solicitudes.crear), data, {
      headers: testHeaders.auth(token)
    }),
  
  consultarEstado: (referenceCode, token) => 
    http.get(buildUrl(apiRoutes.solicitudes.consultar(referenceCode)), {
      headers: testHeaders.auth(token)
    }),
  
  cancelarSolicitud: (referenceCode, motivo, token) => 
    http.delete(buildUrl(apiRoutes.solicitudes.cancelar(referenceCode)), {
      headers: testHeaders.auth(token),
      body: JSON.stringify({ motivo })
    }),
  
  // Planes
  obtenerPlanes: (params = {}) => 
    http.get(buildUrl(apiRoutes.planes.listar, params)),
  
  obtenerPlan: (planId) => 
    http.get(buildUrl(apiRoutes.planes.obtener(planId))),
  
  // Tipos de baneo
  obtenerTiposBaneo: () => 
    http.get(buildUrl(apiRoutes.tiposBaneo.listar)),
  
  // Descuentos
  validarDescuento: (codigo) => 
    http.post(buildUrl(apiRoutes.descuentos.validar), { codigo }),
  
  // Estadísticas
  obtenerEstadisticas: () => 
    http.get(buildUrl(apiRoutes.estadisticas.generales))
};

// Helpers para autenticación
export const authAPI = {
  login: (email, password) => 
    http.post(buildUrl(apiRoutes.auth.login), { email, password }),
  
  register: (userData) => 
    http.post(buildUrl(apiRoutes.auth.register), userData),
  
  logout: (token) => 
    http.post(buildUrl(apiRoutes.auth.logout), {}, {
      headers: testHeaders.auth(token)
    })
};

// Helpers para pagos
export const pagoAPI = {
  crearPago: (data, token) => 
    http.post(buildUrl(apiRoutes.pagos.crear), data, {
      headers: testHeaders.auth(token)
    }),
  
  confirmarPago: (pagoId, token) => 
    http.post(buildUrl(apiRoutes.pagos.confirmar(pagoId)), {}, {
      headers: testHeaders.auth(token)
    }),
  
  reembolsar: (pagoId, token) => 
    http.post(buildUrl(apiRoutes.pagos.reembolsar(pagoId)), {}, {
      headers: testHeaders.auth(token)
    })
};

// Utilidades para tests
export const testUtils = {
  // Esperar un tiempo
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generar string aleatorio
  randomString: (length = 10) => 
    Math.random().toString(36).substring(2, 2 + length),
  
  // Generar email aleatorio
  randomEmail: () => 
    `test_${testUtils.randomString()}@test.com`,
  
  // Generar número de teléfono
  randomPhone: () => 
    `+59399${testUtils.randomString(7)}`,
  
  // Generar reference code
  generateReferenceCode: () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DSB-${timestamp}-${random}`;
  },
  
  // Validar respuesta de API
  validateResponse: (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.data).toBeDefined();
    return response;
  },
  
  // Validar estructura de error
  validateError: (response, expectedCode) => {
    expect(response.ok).toBe(false);
    expect(response.data.error).toBeDefined();
    expect(response.data.error.code).toBe(expectedCode);
    return response;
  }
};

// Exportar todo
export default {
  apiRoutes,
  buildUrl,
  testHeaders,
  testRequest,
  http,
  desbaneoAPI,
  authAPI,
  pagoAPI,
  testUtils
};