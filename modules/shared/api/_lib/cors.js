/**
 * Configuración de CORS (Cross-Origin Resource Sharing)
 * Manejo seguro de orígenes permitidos
 */

import cors from 'cors';
import { CORS_CONFIG, isDevelopment } from './constants.js';
import logger from './logger.js';

class CorsConfig {
  constructor() {
    this.allowedOrigins = CORS_CONFIG.ALLOWED_ORIGINS;
    this.options = {
      origin: this.validateOrigin.bind(this),
      methods: CORS_CONFIG.ALLOWED_METHODS,
      allowedHeaders: CORS_CONFIG.ALLOWED_HEADERS,
      exposedHeaders: CORS_CONFIG.EXPOSED_HEADERS,
      credentials: CORS_CONFIG.CREDENTIALS,
      maxAge: CORS_CONFIG.MAX_AGE
    };
  }

  /**
   * Validar origen solicitado
   * @param {string} origin - Origen de la request
   * @param {Function} callback - Callback de CORS
   */
  validateOrigin(origin, callback) {
    // Permitir sin origin (mobile apps, curl, etc)
    if (!origin) {
      logger.debug('CORS: Request sin origin permitida');
      return callback(null, true);
    }

    // Verificar si el origen está en la lista permitida
    if (this.allowedOrigins.includes(origin)) {
      logger.debug(`CORS: Origen permitido: ${origin}`);
      return callback(null, true);
    }

    // En desarrollo, permitir localhost con cualquier puerto
    if (isDevelopment() && /^http:\/\/localhost:\d+$/.test(origin)) {
      logger.debug(`CORS: localhost permitido en desarrollo: ${origin}`);
      return callback(null, true);
    }

    // Rechazar origen no permitido
    logger.warn(`CORS: Origen rechazado: ${origin}`);
    return callback(new Error('Origen no permitido por CORS'), false);
  }

  /**
   * Agregar origen dinámicamente (para admin panel)
   * @param {string} origin - Origen a agregar
   */
  addAllowedOrigin(origin) {
    if (!this.allowedOrigins.includes(origin)) {
      this.allowedOrigins.push(origin);
      logger.info(`CORS: Origen agregado: ${origin}`);
    }
  }

  /**
   * Remover origen dinámicamente
   * @param {string} origin - Origen a remover
   */
  removeAllowedOrigin(origin) {
    const index = this.allowedOrigins.indexOf(origin);
    if (index > -1) {
      this.allowedOrigins.splice(index, 1);
      logger.info(`CORS: Origen removido: ${origin}`);
    }
  }

  /**
   * Obtener lista de orígenes permitidos
   * @returns {Array<string>}
   */
  getAllowedOrigins() {
    return [...this.allowedOrigins];
  }

  /**
   * Middleware de CORS configurado
   * @returns {Function} Middleware de Express
   */
  middleware() {
    return cors(this.options);
  }

  /**
   * Middleware de CORS para rutas específicas
   * @param {Object} customOptions - Opciones personalizadas
   * @returns {Function} Middleware
   */
  customMiddleware(customOptions = {}) {
    const options = {
      ...this.options,
      ...customOptions
    };

    return cors(options);
  }

  /**
   * Preflight handler personalizado
   * @param {Object} req - Request
   * @param {Object} res - Response
   * @param {Function} next - Next middleware
   */
  preflightHandler(req, res, next) {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', CORS_CONFIG.ALLOWED_METHODS.join(', '));
      res.header('Access-Control-Allow-Headers', CORS_CONFIG.ALLOWED_HEADERS.join(', '));
      res.header('Access-Control-Max-Age', CORS_CONFIG.MAX_AGE.toString());
      
      if (CORS_CONFIG.CREDENTIALS) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      return res.sendStatus(204);
    }
    
    next();
  }

  /**
   * Agregar headers CORS manuales
   * @param {Object} res - Response object
   * @param {string} origin - Origen específico
   */
  addManualHeaders(res, origin = '*') {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', CORS_CONFIG.ALLOWED_METHODS.join(', '));
    res.header('Access-Control-Allow-Headers', CORS_CONFIG.ALLOWED_HEADERS.join(', '));
    res.header('Access-Control-Expose-Headers', CORS_CONFIG.EXPOSED_HEADERS.join(', '));
    
    if (CORS_CONFIG.CREDENTIALS) {
      res.header('Access-Control-Allow-Credentials', 'true');
    }
  }
}

// Instancia singleton
const corsConfig = new CorsConfig();

// Exportar middleware listo para usar
export const corsMiddleware = corsConfig.middleware();

// Exportar configuración y métodos
export { corsConfig };
export default corsConfig;