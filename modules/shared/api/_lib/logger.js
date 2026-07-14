/**
 * Logger Service
 * Sistema de logging estructurado con Winston
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LOG_CONFIG, isDevelopment, isProduction } from './constants.js';
import path from 'path';
import fs from 'fs';

// Crear directorio de logs si no existe
const logDir = LOG_CONFIG.DIRECTORY;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Colores para consola
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'cyan',
  silly: 'magenta'
};

winston.addColors(colors);

// Formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  LOG_CONFIG.FORMAT === 'json' 
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, metadata, ...rest }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          
          if (Object.keys(metadata).length > 0) {
            msg += ` | ${JSON.stringify(metadata)}`;
          }
          
          if (Object.keys(rest).length > 0) {
            msg += ` | ${JSON.stringify(rest)}`;
          }
          
          return msg;
        })
      )
);

// Transports
const transports = [
  // Consola
  new winston.transports.Console({
    level: LOG_CONFIG.LEVEL,
    format: logFormat
  })
];

// En producción, agregar file rotation
if (isProduction()) {
  // Error logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: LOG_CONFIG.MAX_SIZE,
      maxFiles: LOG_CONFIG.MAX_FILES,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );

  // Combined logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_CONFIG.MAX_SIZE,
      maxFiles: LOG_CONFIG.MAX_FILES,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: LOG_CONFIG.LEVEL,
  defaultMeta: { 
    service: 'desbanwa-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  exitOnError: false
});

// ============================================
// MÉTODOS PERSONALIZADOS
// ============================================

/**
 * Log de request HTTP
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {number} startTime - Start time
 */
export function logRequest(req, res, startTime) {
  const duration = Date.now() - startTime;
  
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId
  });
  
  if (duration > 1000) {
    logger.warn(`Request lenta: ${req.method} ${req.url} (${duration}ms)`);
  }
}

/**
 * Log de auditoría
 * @param {string} action - Acción realizada
 * @param {Object} user - Usuario
 * @param {Object} details - Detalles adicionales
 */
export function auditLog(action, user, details = {}) {
  logger.info(`AUDIT: ${action}`, {
    userId: user?.id,
    userEmail: user?.email,
    action,
    details,
    timestamp: new Date().toISOString(),
    ip: details.ip
  });
}

/**
 * Log de base de datos
 * @param {string} query - SQL query
 * @param {Array} params - Query params
 * @param {number} duration - Duration in ms
 */
export function logQuery(query, params, duration) {
  if (duration > 1000) {
    logger.warn(`Query lenta (${duration}ms): ${query.substring(0, 200)}`, {
      params,
      duration
    });
  } else {
    logger.debug(`Query ejecutada (${duration}ms): ${query.substring(0, 100)}`);
  }
}

/**
 * Log de email enviado
 * @param {string} to - Destinatario
 * @param {string} subject - Asunto
 * @param {string} template - Template usado
 */
export function logEmail(to, subject, template) {
  logger.info(`Email enviado: ${subject}`, {
    to,
    subject,
    template
  });
}

/**
 * Log de pago procesado
 * @param {Object} payment - Payment data
 */
export function logPayment(payment) {
  logger.info(`Pago procesado: ${payment.id}`, {
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    method: payment.method
  });
}

/**
 * Crear child logger con contexto
 * @param {Object} context - Contexto adicional
 * @returns {Object} Child logger
 */
export function createChildLogger(context) {
  return logger.child(context);
}

// ============================================
// STREAM PARA Morgan (HTTP logs)
// ============================================
export const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Agregar nivel 'http' si no existe
if (!winston.config.npm.levels.http) {
  winston.logLevels = {
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      verbose: 4,
      debug: 5,
      silly: 6
    },
    colors: {
      error: 'red',
      warn: 'yellow',
      info: 'green',
      http: 'magenta',
      verbose: 'cyan',
      debug: 'blue',
      silly: 'magenta'
    }
  };
}

// Exportar logger
export { logger };
export default logger;
