/**
 * Error Handling & Custom Error Classes
 * Sistema centralizado de manejo de errores
 */

import { HTTP_STATUS, ERROR_CODES, isDevelopment } from './constants.js';
import logger from './logger.js';

/**
 * Clase base para errores personalizados de API
 */
export class ApiError extends Error {
  constructor(code, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convertir a objeto serializable
   * @returns {Object}
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
        ...(isDevelopment() && { stack: this.stack })
      }
    };
  }
}

/**
 * Error de validación
 */
export class ValidationError extends ApiError {
  constructor(message, details = null) {
    super(ERROR_CODES.VALIDATION_ERROR, message, HTTP_STATUS.BAD_REQUEST, details);
  }
}

/**
 * Error de autenticación
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'No autorizado', details = null) {
    super(ERROR_CODES.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED, details);
  }
}

/**
 * Error de autorización
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'No tienes permisos', details = null) {
    super(ERROR_CODES.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN, details);
  }
}

/**
 * Error de recurso no encontrado
 */
export class NotFoundError extends ApiError {
  constructor(resource = 'Recurso', details = null) {
    super(ERROR_CODES.NOT_FOUND, `${resource} no encontrado`, HTTP_STATUS.NOT_FOUND, details);
  }
}

/**
 * Error de conflicto
 */
export class ConflictError extends ApiError {
  constructor(message, details = null) {
    super(ERROR_CODES.CONFLICT, message, HTTP_STATUS.CONFLICT, details);
  }
}

/**
 * Error de rate limit
 */
export class RateLimitError extends ApiError {
  constructor(message = 'Demasiadas solicitudes', details = null) {
    super(ERROR_CODES.RATE_LIMIT_EXCEEDED, message, HTTP_STATUS.TOO_MANY_REQUESTS, details);
  }
}

/**
 * Error de base de datos
 */
export class DatabaseError extends ApiError {
  constructor(message, details = null) {
    super(ERROR_CODES.DATABASE_ERROR, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, details);
  }
}

/**
 * Error de servicio externo
 */
export class ExternalServiceError extends ApiError {
  constructor(service, message, details = null) {
    super(
      ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      `Error en servicio externo (${service}): ${message}`,
      HTTP_STATUS.BAD_GATEWAY,
      details
    );
  }
}

/**
 * Error de pago
 */
export class PaymentError extends ApiError {
  constructor(message, details = null) {
    super(ERROR_CODES.PAYMENT_FAILED, message, HTTP_STATUS.PAYMENT_REQUIRED, details);
  }
}

/**
 * Middleware de manejo de errores para Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Error en request:', {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    userId: req.user?.userId
  });

  // Si ya es un ApiError, usar su response
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Error de MySQL
  if (err.code && err.code.startsWith('ER_')) {
    const dbError = new DatabaseError('Error en base de datos', {
      mysqlCode: err.code,
      sqlMessage: err.sqlMessage
    });
    return res.status(dbError.statusCode).json(dbError.toJSON());
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const validationError = new ValidationError('JSON inválido', {
      originalError: err.message
    });
    return res.status(validationError.statusCode).json(validationError.toJSON());
  }

  // Error por defecto - Internal Server Error
  const internalError = new ApiError(
    ERROR_CODES.INTERNAL_ERROR,
    isDevelopment() ? err.message : 'Error interno del servidor',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isDevelopment() ? { stack: err.stack } : null
  );

  res.status(internalError.statusCode).json(internalError.toJSON());
}

/**
 * Async handler wrapper para evitar try-catch en cada route
 * @param {Function} fn - Async function
 * @returns {Function} Express middleware
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Crear error de validación con múltiples campos
 * @param {Object} fieldErrors - { fieldName: errorMessage }
 * @returns {ValidationError}
 */
export function createValidationError(fieldErrors) {
  const errors = Object.entries(fieldErrors).map(([field, message]) => ({
    field,
    message
  }));

  return new ValidationError('Error de validación', errors);
}

/**
 * Validar que un campo exista
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @throws {ValidationError}
 */
export function validateRequired(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    throw createValidationError({ [fieldName]: `${fieldName} es requerido` });
  }
}

/**
 * Validar email
 * @param {string} email 
 * @throws {ValidationError}
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError({ email: 'Email inválido' });
  }
}

/**
 * Validar teléfono
 * @param {string} phone 
 * @throws {ValidationError}
 */
export function validatePhone(phone) {
  const phoneRegex = /^\+?[0-9\s]{10,15}$/;
  if (!phoneRegex.test(phone)) {
    throw createValidationError({ phone: 'Número de teléfono inválido' });
  }
}

/**
 * Manejador de promesas no manejadas
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise.toString(),
    reason: reason?.stack || reason
  });
});

/**
 * Manejador de excepciones no capturadas
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack
  });
  
  // Graceful shutdown
  process.exit(1);
});

// Exportar todo
export default {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  PaymentError,
  errorHandler,
  asyncHandler,
  createValidationError,
  validateRequired,
  validateEmail,
  validatePhone
};