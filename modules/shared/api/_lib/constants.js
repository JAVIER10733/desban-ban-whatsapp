/**
 * Constantes Globales de la Aplicación
 * Configuración centralizada y valores constantes
 */

// ============================================
// JWT CONFIGURATION
// ============================================
export const JWT_CONFIG = {
  EXPIRES_IN: '24h',
  REFRESH_EXPIRES_IN: '7d',
  ALGORITHM: 'HS256'
};

// ============================================
// BCRYPT CONFIGURATION
// ============================================
export const BCRYPT_CONFIG = {
  SALT_ROUNDS: 10,
  MIN_PASSWORD_LENGTH: 8
};

// ============================================
// RATE LIMITING
// ============================================
export const RATE_LIMIT_CONFIG = {
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // 100 requests
  },
  STRICT: {
    windowMs: 15 * 60 * 1000,
    max: 20 // 20 requests
  },
  AUTH: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5 // 5 intentos de login
  },
  API: {
    windowMs: 60 * 1000, // 1 minuto
    max: 30 // 30 requests por minuto
  }
};

// ============================================
// CORS CONFIGURATION
// ============================================
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://desbanwa.com'
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
  EXPOSED_HEADERS: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  CREDENTIALS: true,
  MAX_AGE: 86400 // 24 horas
};

// ============================================
// DATABASE CONFIGURATION
// ============================================
export const DB_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT) || 3306,
  USER: process.env.DB_USER || 'root',
  PASSWORD: process.env.DB_PASSWORD || '',
  DATABASE: process.env.DB_NAME || 'desbanwa_db',
  CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  TIMEOUT: parseInt(process.env.DB_TIMEOUT) || 60000,
  CHARSET: 'utf8mb4',
  TIMEZONE: 'Z' // UTC
};

// ============================================
// EMAIL CONFIGURATION
// ============================================
export const EMAIL_CONFIG = {
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT) || 587,
    SECURE: process.env.SMTP_SECURE === 'true',
    AUTH: {
      USER: process.env.SMTP_USER,
      PASS: process.env.SMTP_PASS
    }
  },
  FROM: {
    NAME: process.env.EMAIL_FROM_NAME || 'DesbanWA',
    ADDRESS: process.env.EMAIL_FROM_ADDRESS || 'noreply@desbanwa.com'
  },
  TEMPLATES: {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password-reset',
    SOLICITUD_CREADA: 'solicitud-creada',
    ESTADO_ACTUALIZADO: 'estado-actualizado',
    PAGO_CONFIRMADO: 'pago-confirmado',
    REEMBOLSO_PROCESADO: 'reembolso-procesado'
  }
};

// ============================================
// STRIPE CONFIGURATION
// ============================================
export const STRIPE_CONFIG = {
  SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  CURRENCY: 'usd',
  PAYMENT_METHODS: ['card', 'paypal'],
  METADATA: {
    APPLICATION: 'desbanwa'
  }
};

// ============================================
// API CONFIGURATION
// ============================================
export const API_CONFIG = {
  VERSION: 'v1',
  PREFIX: '/api',
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  TIMEOUT: 30000, // 30 segundos
  MAX_BODY_SIZE: '10mb'
};

// ============================================
// LOGGING CONFIGURATION
// ============================================
export const LOG_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || 'info',
  FORMAT: process.env.LOG_FORMAT || 'json', // json | combined
  DIRECTORY: process.env.LOG_DIRECTORY || './logs',
  MAX_FILES: 5,
  MAX_SIZE: '10m',
  COLORS: process.env.NODE_ENV !== 'production'
};

// ============================================
// ERROR CODES
// ============================================
export const ERROR_CODES = {
  // Authentication
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Resource
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SOLICITUD_NOT_FOUND: 'SOLICITUD_NOT_FOUND',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  
  // Business Logic
  SOLICITUD_ALREADY_EXISTS: 'SOLICITUD_ALREADY_EXISTS',
  SOLICITUD_CANCELLED: 'SOLICITUD_CANCELLED',
  SOLICITUD_COMPLETED: 'SOLICITUD_COMPLETED',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

// ============================================
// HTTP STATUS CODES
// ============================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// ============================================
// PLANES
// ============================================
export const PLANES = {
  BASICO: 'basico',
  PRO: 'pro',
  PREMIUM: 'premium',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise'
};

export const PLAN_PRECIOS = {
  [PLANES.BASICO]: 19,
  [PLANES.PRO]: 39,
  [PLANES.PREMIUM]: 59,
  [PLANES.BUSINESS]: 99,
  [PLANES.ENTERPRISE]: 199
};

// ============================================
// TIPOS DE BANEO
// ============================================
export const TIPOS_BANEO = {
  TEMPORAL: 'temporal',
  PERMANENTE: 'permanente',
  SUSPICION: 'suspicion',
  SPAM: 'spam',
  VERIFICATION: 'verification',
  REPORTS: 'reports',
  OTRO: 'otro'
};

// ============================================
// ESTADOS DE SOLICITUD
// ============================================
export const ESTADOS_SOLICITUD = {
  PENDIENTE_PAGO: 'pendiente-pago',
  PAGADO_COLA: 'pagado-cola',
  EN_PROCESO: 'en-proceso',
  ESPERANDO_INFO: 'esperando-info',
  APELACION_ENVIADA: 'apelacion-enviada',
  EN_REVISION: 'en-revision',
  REINTENTO_REQUERIDO: 'reintento-requerido',
  COMPLETADO_EXITOSO: 'completado-exitoso',
  FALLIDO_NO_RECUPERABLE: 'fallido-no-recuperable',
  REEMBOLSADO: 'reembolsado',
  CANCELADO: 'cancelado'
};

// ============================================
// ROLES DE USUARIO
// ============================================
export const ROLES = {
  ADMIN: 'admin',
  ESPECIALISTA: 'especialista',
  USER: 'user',
  ENTERPRISE: 'enterprise'
};

// ============================================
// PAÍSES SOPORTADOS
// ============================================
export const PAISES = {
  EC: 'Ecuador',
  CO: 'Colombia',
  MX: 'México',
  AR: 'Argentina',
  CL: 'Chile',
  PE: 'Perú',
  ES: 'España',
  US: 'Estados Unidos',
  OTRO: 'Otro'
};

// ============================================
// MÉTODOS DE PAGO
// ============================================
export const METODOS_PAGO = {
  TARJETA: 'tarjeta',
  PAYPAL: 'paypal',
  TRANSFERENCIA: 'transferencia',
  CRYPTO: 'crypto',
  EFECTIVO: 'efectivo',
  YAPE_PLIN: 'yape_plin'
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtener configuración por ambiente
 * @param {string} key - Clave de configuración
 * @param {any} defaultValue - Valor por defecto
 * @returns {any} Valor de configuración
 */
export function getConfig(key, defaultValue = null) {
  return process.env[key] || defaultValue;
}

/**
 * Verificar si es ambiente de producción
 * @returns {boolean}
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Verificar si es ambiente de desarrollo
 * @returns {boolean}
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Verificar si es ambiente de test
 * @returns {boolean}
 */
export function isTest() {
  return process.env.NODE_ENV === 'test';
}

// Exportar todo como objeto default
export default {
  JWT_CONFIG,
  BCRYPT_CONFIG,
  RATE_LIMIT_CONFIG,
  CORS_CONFIG,
  DB_CONFIG,
  EMAIL_CONFIG,
  STRIPE_CONFIG,
  API_CONFIG,
  LOG_CONFIG,
  ERROR_CODES,
  HTTP_STATUS,
  PLANES,
  PLAN_PRECIOS,
  TIPOS_BANEO,
  ESTADOS_SOLICITUD,
  ROLES,
  PAISES,
  METODOS_PAGO,
  getConfig,
  isProduction,
  isDevelopment,
  isTest
};
