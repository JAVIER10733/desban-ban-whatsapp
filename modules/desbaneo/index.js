/**
 * Desbaneo Test Suite - Index
 * Punto de entrada centralizado para todos los tests y utilidades
 */

// ============================================
// CONFIGURACIÓN
// ============================================
export { default as testConfig, createTestConfig, testConfig as config } from './desbaneo.config.js';

// ============================================
// ROUTERS & ROUTES
// ============================================
export {
  routers,
  createDesbaneoRouter,
  createPagoRouter,
  createAuthRouter,
  mockServices
} from './desbaneo.routers.js';

export {
  apiRoutes,
  buildUrl,
  testHeaders,
  testRequest,
  http,
  desbaneoAPI,
  authAPI,
  pagoAPI,
  testUtils
} from './desbaneo.routes.js';

// ============================================
// FIXTURES
// ============================================
export { default as fixtures, generators } from './desbaneo.fixture.js';

// ============================================
// SETUP GLOBAL
// ============================================

// Configurar entorno de test
if (typeof process !== 'undefined') {
  // Variables de entorno para tests
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';
  
  // Base URL por defecto
  if (!process.env.TEST_BASE_URL) {
    process.env.TEST_BASE_URL = 'http://localhost:3000';
  }
}

// ============================================
// HELPERS GLOBALES
// ============================================

/**
 * Crear instancia de test con configuración personalizada
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Instancia de test configurada
 */
export function createTestInstance(options = {}) {
  const config = createTestConfig(options);
  
  return {
    config,
    api: desbaneoAPI,
    auth: authAPI,
    pago: pagoAPI,
    utils: testUtils,
    routes: apiRoutes,
    fixtures
  };
}

/**
 * Setup inicial para cada test suite
 */
export async function setupTest() {
  // Limpiar localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  
  // Resetear mocks
  if (typeof vi !== 'undefined') {
    vi.clearAllMocks();
  }
  
  // Configurar timeout
  if (typeof setTimeout !== 'undefined') {
    // Aumentar timeout para tests async
  }
}

/**
 * Teardown después de cada test suite
 */
export async function teardownTest() {
  // Limpiar recursos
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  
  // Resetear mocks
  if (typeof vi !== 'undefined') {
    vi.resetAllMocks();
  }
}

/**
 * Ejecutar test con setup y teardown automáticos
 * @param {Function} testFn - Función de test a ejecutar
 * @returns {Promise<any>} Resultado del test
 */
export async function runTest(testFn) {
  try {
    await setupTest();
    const result = await testFn();
    return result;
  } finally {
    await teardownTest();
  }
}

// ============================================
// ASSERTIONS PERSONALIZADAS
// ============================================

/**
 * Verificar que una respuesta de API sea exitosa
 * @param {Object} response - Respuesta de la API
 * @param {number} expectedStatus - Status HTTP esperado
 */
export function expectSuccess(response, expectedStatus = 200) {
  if (typeof expect !== 'undefined') {
    expect(response.ok).toBe(true);
    expect(response.status).toBe(expectedStatus);
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
  }
}

/**
 * Verificar que una respuesta de API falle
 * @param {Object} response - Respuesta de la API
 * @param {string} expectedCode - Código de error esperado
 * @param {number} expectedStatus - Status HTTP esperado
 */
export function expectError(response, expectedCode, expectedStatus = 400) {
  if (typeof expect !== 'undefined') {
    expect(response.ok).toBe(false);
    expect(response.status).toBe(expectedStatus);
    expect(response.data.error).toBeDefined();
    expect(response.data.error.code).toBe(expectedCode);
  }
}

/**
 * Verificar estructura de solicitud
 * @param {Object} solicitud - Objeto de solicitud
 * @param {Array} requiredFields - Campos requeridos
 */
export function expectValidSolicitud(solicitud, requiredFields = []) {
  if (typeof expect !== 'undefined') {
    expect(solicitud.numero_whatsapp).toBeDefined();
    expect(solicitud.email).toBeDefined();
    expect(solicitud.nombre_completo).toBeDefined();
    expect(solicitud.plan).toBeDefined();
    
    requiredFields.forEach(field => {
      expect(solicitud[field]).toBeDefined();
    });
  }
}

/**
 * Verificar estructura de plan
 * @param {Object} plan - Objeto de plan
 */
export function expectValidPlan(plan) {
  if (typeof expect !== 'undefined') {
    expect(plan.id).toBeDefined();
    expect(plan.codigo).toBeDefined();
    expect(plan.nombre).toBeDefined();
    expect(plan.precio).toBeDefined();
    expect(typeof plan.precio).toBe('number');
  }
}

// ============================================
// MOCKS UTILITARIOS
// ============================================

/**
 * Crear mock de fetch
 * @param {Object} responseData - Datos a retornar
 * @param {number} status - Status HTTP
 * @param {boolean} ok - Si la respuesta es exitosa
 * @returns {Function} Mock de fetch
 */
export function createFetchMock(responseData, status = 200, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => responseData,
    headers: new Map()
  });
}

/**
 * Crear mock de localStorage
 * @returns {Object} Mock de localStorage
 */
export function createLocalStorageMock() {
  const store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]); }),
    store
  };
}

// ============================================
// GENERADORES DE DATOS DE TEST
// ============================================

export const testDataGenerators = {
  /**
   * Generar solicitud válida
   * @param {Object} overrides - Datos a sobrescribir
   * @returns {Object} Solicitud de test
   */
  createSolicitud: (overrides = {}) => ({
    numero_whatsapp: generators.generateNumeroWhatsapp(),
    tipo_baneo: 'permanente',
    dias_baneado: 5,
    mensaje_error: 'Tu número está baneado',
    nombre_completo: 'Test User',
    email: generators.generateEmail(),
    telefono_contacto: null,
    pais: 'EC',
    plan: 'pro',
    codigo_descuento: null,
    ...overrides
  }),

  /**
   * Generar plan válido
   * @param {Object} overrides - Datos a sobrescribir
   * @returns {Object} Plan de test
   */
  createPlan: (overrides = {}) => ({
    id: `plan_${testUtils.randomString()}`,
    codigo: testUtils.randomString(5),
    nombre: `Plan ${testUtils.randomString()}`,
    categoria: 'personal',
    precio: Math.floor(Math.random() * 100) + 19,
    moneda: 'USD',
    tiempo_respuesta_horas: 24,
    garantia_devolucion: true,
    activo: true,
    caracteristicas: [],
    ...overrides
  }),

  /**
   * Generar estado de solicitud
   * @param {Object} overrides - Datos a sobrescribir
   * @returns {Object} Estado de test
   */
  createEstado: (overrides = {}) => ({
    id: Math.floor(Math.random() * 10),
    nombre: 'En Proceso',
    slug: 'en-proceso',
    color: '#25D366',
    icono: '⚡',
    descripcion: 'Especialista trabajando',
    es_final: false,
    es_exitoso: false,
    requiere_accion: false,
    ...overrides
  }),

  /**
   * Generar usuario de test
   * @param {Object} overrides - Datos a sobrescribir
   * @returns {Object} Usuario de test
   */
  createUsuario: (overrides = {}) => ({
    id: `user_${testUtils.randomString()}`,
    nombre: 'Test User',
    email: generators.generateEmail(),
    pais: 'EC',
    ...overrides
  })
};

// ============================================
// CONSTANTES DE TEST
// ============================================

export const TEST_CONSTANTS = {
  // Timeouts
  TIMEOUT_SHORT: 1000,
  TIMEOUT_MEDIUM: 5000,
  TIMEOUT_LONG: 10000,
  TIMEOUT_E2E: 30000,
  
  // Status codes
  STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
  },
  
  // Error codes
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS'
  },
  
  // Tipos de baneo
  TIPOS_BANEO: {
    TEMPORAL: 'temporal',
    PERMANENTE: 'permanente',
    SUSPICION: 'suspicion',
    SPAM: 'spam',
    VERIFICATION: 'verification',
    REPORTS: 'reports'
  },
  
  // Estados de solicitud
  ESTADOS: {
    PENDIENTE_PAGO: 'pendiente-pago',
    EN_PROCESO: 'en-proceso',
    COMPLETADO_EXITOSO: 'completado-exitoso',
    FALLIDO: 'fallido-no-recuperable',
    REEMBOLSADO: 'reembolsado'
  }
};

// ============================================
// EXPORTAR TODO
// ============================================

export default {
  config: testConfig,
  createTestInstance,
  setupTest,
  teardownTest,
  runTest,
  
  // Assertions
  expectSuccess,
  expectError,
  expectValidSolicitud,
  expectValidPlan,
  
  // Mocks
  createFetchMock,
  createLocalStorageMock,
  mockServices,
  
  // Data generators
  testDataGenerators,
  generators,
  fixtures,
  
  // API helpers
  apiRoutes,
  buildUrl,
  http,
  desbaneoAPI,
  authAPI,
  pagoAPI,
  
  // Utils
  testUtils,
  TEST_CONSTANTS,
  
  // Routers
  routers,
  createDesbaneoRouter,
  createPagoRouter,
  createAuthRouter
};

// ============================================
// INFORMACIÓN DE VERSIÓN
// ============================================

export const version = {
  major: 1,
  minor: 0,
  patch: 0,
  full: '1.0.0',
  build: new Date().toISOString().split('T')[0]
};

console.log(`🧪 DesbanWA Test Suite v${version.full} loaded`);