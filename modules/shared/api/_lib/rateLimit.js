/**
 * Rate Limiting Service
 * Protección contra abuso y DDoS
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { RATE_LIMIT_CONFIG, isProduction } from './constants.js';
import logger from './logger.js';
import { RateLimitError } from './errors.js';

class RateLimitService {
  constructor() {
    this.client = null;
    this.limits = new Map();
    
    if (isProduction()) {
      this.initializeRedis();
    }
  }

  /**
   * Inicializar Redis para rate limiting distribuido
   */
  initializeRedis() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err.message);
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis conectado para rate limiting');
      });
    } catch (error) {
      logger.warn('No se pudo conectar a Redis, usando memoria local');
      this.client = null;
    }
  }

  /**
   * Crear middleware de rate limiting
   * @param {Object} options - Opciones personalizadas
   * @returns {Function} Middleware
   */
  createLimiter(options = {}) {
    const config = {
      windowMs: options.windowMs || RATE_LIMIT_CONFIG.STANDARD.windowMs,
      max: options.max || RATE_LIMIT_CONFIG.STANDARD.max,
      message: options.message || 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: options.keyGenerator || this.getKeyGenerator(),
      skip: options.skip || this.getSkipCondition(),
      handler: this.getHandler()
    };

    // Usar Redis store si está disponible
    if (this.client && options.useRedis !== false) {
      config.store = new RedisStore({
        sendCommand: (...args) => this.client.call(...args),
        prefix: options.prefix || 'ratelimit:'
      });
    }

    const limiter = rateLimit(config);
    
    // Guardar referencia para stats
    const id = options.id || `limiter_${Date.now()}`;
    this.limits.set(id, { config, limiter });

    return limiter;
  }

  /**
   * Generador de key por IP + User ID
   * @returns {Function}
   */
  getKeyGenerator() {
    return (req) => {
      const userId = req.user?.userId || req.user?.id;
      const ip = req.ip || req.connection.remoteAddress;
      
      // Si está autenticado, usar userId, sino IP
      return userId ? `user:${userId}` : `ip:${ip}`;
    };
  }

  /**
   * Condición para saltar rate limit
   * @returns {Function}
   */
  getSkipCondition() {
    return (req) => {
      // Skip para localhost en desarrollo
      if (!isProduction() && (req.ip === '127.0.0.1' || req.ip === '::1')) {
        return true;
      }
      
      // Skip para health checks
      if (req.path === '/health' || req.path === '/api/health') {
        return true;
      }
      
      // Skip para admin/superuser
      if (req.user?.role === 'admin' || req.user?.role === 'superuser') {
        return true;
      }
      
      return false;
    };
  }

  /**
   * Handler personalizado para rate limit exceeded
   * @returns {Function}
   */
  getHandler() {
    return (req, res, next, options) => {
      const error = new RateLimitError(options.message, {
        retryAfter: Math.ceil(options.windowMs / 1000),
        limit: options.max,
        windowMs: options.windowMs
      });
      
      logger.warn('Rate limit excedido:', {
        ip: req.ip,
        userId: req.user?.userId,
        path: req.path,
        method: req.method
      });
      
      next(error);
    };
  }

  // ============================================
  // LIMITERS PREDEFINIDOS
  // ============================================

  /**
   * Rate limit estándar (100 req / 15 min)
   */
  standard() {
    return this.createLimiter({
      id: 'standard',
      ...RATE_LIMIT_CONFIG.STANDARD
    });
  }

  /**
   * Rate limit estricto (20 req / 15 min)
   */
  strict() {
    return this.createLimiter({
      id: 'strict',
      ...RATE_LIMIT_CONFIG.STRICT
    });
  }

  /**
   * Rate limit para auth (5 intentos / hora)
   */
  auth() {
    return this.createLimiter({
      id: 'auth',
      ...RATE_LIMIT_CONFIG.AUTH,
      message: 'Demasiados intentos. Inténtalo de nuevo en una hora.',
      keyGenerator: (req) => {
        // Limitar por IP para login
        return `auth:${req.ip}`;
      }
    });
  }

  /**
   * Rate limit para API (30 req / min)
   */
  api() {
    return this.createLimiter({
      id: 'api',
      ...RATE_LIMIT_CONFIG.API,
      message: 'Límite de API excedido. Máximo 30 requests por minuto.'
    });
  }

  /**
   * Rate limit para creación de solicitudes
   */
  solicitudes() {
    return this.createLimiter({
      id: 'solicitudes',
      windowMs: 24 * 60 * 60 * 1000, // 24 horas
      max: 5, // 5 solicitudes por día
      message: 'Máximo 5 solicitudes por día. Contacta soporte si necesitas más.'
    });
  }

  /**
   * Rate limit para envío de emails
   */
  email() {
    return this.createLimiter({
      id: 'email',
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 10, // 10 emails por hora
      message: 'Demasiados emails enviados. Espera una hora.'
    });
  }

  /**
   * Rate limit para uploads
   */
  upload() {
    return this.createLimiter({
      id: 'upload',
      windowMs: 60 * 60 * 1000, // 1 hora
      max: 20, // 20 uploads por hora
      message: 'Límite de uploads excedido.'
    });
  }

  // ============================================
  // UTILIDADES
  // ============================================

  /**
   * Obtener estadísticas de rate limits
   * @returns {Object}
   */
  getStats() {
    const stats = {
      total: this.limits.size,
      limits: {}
    };

    this.limits.forEach((value, key) => {
      stats.limits[key] = {
        windowMs: value.config.windowMs,
        max: value.config.max,
        current: 0 // Esto requeriría Redis para ser preciso
      };
    });

    return stats;
  }

  /**
   * Resetear rate limit para una key específica
   * @param {string} key 
   */
  async resetLimit(key) {
    if (this.client) {
      const keys = await this.client.keys(`ratelimit:*${key}*`);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.info(`Rate limit reseteado para: ${key}`);
      }
    }
  }

  /**
   * Verificar si Redis está conectado
   * @returns {boolean}
   */
  isRedisConnected() {
    return this.client && this.client.status === 'ready';
  }

  /**
   * Health check
   * @returns {Object}
   */
  healthCheck() {
    return {
      status: this.isRedisConnected() ? 'healthy' : 'degraded',
      redis: this.isRedisConnected() ? 'connected' : 'disconnected',
      activeLimiters: this.limits.size
    };
  }
}

// Instancia singleton
const rateLimitService = new RateLimitService();

// Exportar middlewares predefinidos
export const rateLimiters = {
  standard: rateLimitService.standard.bind(rateLimitService),
  strict: rateLimitService.strict.bind(rateLimitService),
  auth: rateLimitService.auth.bind(rateLimitService),
  api: rateLimitService.api.bind(rateLimitService),
  solicitudes: rateLimitService.solicitudes.bind(rateLimitService),
  email: rateLimitService.email.bind(rateLimitService),
  upload: rateLimitService.upload.bind(rateLimitService)
};

export { rateLimitService };
export default rateLimitService;