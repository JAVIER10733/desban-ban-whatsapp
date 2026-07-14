/**
 * Response Helpers
 * Utilidades para respuestas API consistentes
 */

import { HTTP_STATUS } from './constants.js';

/**
 * Clase para construir respuestas API
 */
export class ApiResponse {
  constructor(success, data = null, message = null, meta = {}) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.meta = {
      timestamp: new Date().toISOString(),
      ...meta
    };
  }

  /**
   * Agregar paginación
   * @param {Object} pagination 
   * @returns {ApiResponse}
   */
  withPagination(pagination) {
    this.meta.pagination = pagination;
    return this;
  }

  /**
   * Agregar links HATEOAS
   * @param {Object} links 
   * @returns {ApiResponse}
   */
  withLinks(links) {
    this.meta.links = links;
    return this;
  }

  /**
   * Agregar headers personalizados
   * @param {Object} headers 
   * @returns {ApiResponse}
   */
  withHeaders(headers) {
    this.meta.headers = headers;
    return this;
  }

  /**
   * Convertir a objeto
   * @returns {Object}
   */
  toJSON() {
    const obj = {
      success: this.success,
      message: this.message,
      meta: this.meta
    };

    if (this.data !== null && this.data !== undefined) {
      obj.data = this.data;
    }

    return obj;
  }
}

/**
 * Respuesta exitosa
 * @param {Object} res - Express response
 * @param {any} data - Datos
 * @param {string} message - Mensaje
 * @param {number} statusCode - Status code
 * @param {Object} meta - Metadata adicional
 */
export function success(res, data, message = 'OK', statusCode = HTTP_STATUS.OK, meta = {}) {
  const response = new ApiResponse(true, data, message, meta);
  return res.status(statusCode).json(response.toJSON());
}

/**
 * Respuesta de creación (201)
 * @param {Object} res 
 * @param {any} data 
 * @param {string} message 
 * @param {Object} meta 
 */
export function created(res, data, message = 'Recurso creado', meta = {}) {
  return success(res, data, message, HTTP_STATUS.CREATED, meta);
}

/**
 * Respuesta de aceptación (202)
 * @param {Object} res 
 * @param {any} data 
 * @param {string} message 
 */
export function accepted(res, data = null, message = 'Solicitud aceptada') {
  return success(res, data, message, HTTP_STATUS.ACCEPTED);
}

/**
 * Respuesta sin contenido (204)
 * @param {Object} res 
 */
export function noContent(res) {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}

/**
 * Respuesta de error
 * @param {Object} res 
 * @param {string} message 
 * @param {string} code 
 * @param {number} statusCode 
 * @param {any} details 
 */
export function error(res, message, code = 'ERROR', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) {
  const response = {
    success: false,
    error: {
      code,
      message,
      statusCode,
      timestamp: new Date().toISOString()
    }
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
}

/**
 * Respuesta de error de validación (400)
 * @param {Object} res 
 * @param {string} message 
 * @param {Array} errors 
 */
export function badRequest(res, message = 'Bad Request', errors = null) {
  return error(res, message, 'BAD_REQUEST', HTTP_STATUS.BAD_REQUEST, errors);
}

/**
 * Respuesta de no autorizado (401)
 * @param {Object} res 
 * @param {string} message 
 */
export function unauthorized(res, message = 'No autorizado') {
  return error(res, message, 'UNAUTHORIZED', HTTP_STATUS.UNAUTHORIZED);
}

/**
 * Respuesta de prohibido (403)
 * @param {Object} res 
 * @param {string} message 
 */
export function forbidden(res, message = 'Acceso denegado') {
  return error(res, message, 'FORBIDDEN', HTTP_STATUS.FORBIDDEN);
}

/**
 * Respuesta de no encontrado (404)
 * @param {Object} res 
 * @param {string} resource 
 */
export function notFound(res, resource = 'Recurso') {
  return error(res, `${resource} no encontrado`, 'NOT_FOUND', HTTP_STATUS.NOT_FOUND);
}

/**
 * Respuesta de conflicto (409)
 * @param {Object} res 
 * @param {string} message 
 */
export function conflict(res, message = 'Conflicto') {
  return error(res, message, 'CONFLICT', HTTP_STATUS.CONFLICT);
}

/**
 * Respuesta de rate limit (429)
 * @param {Object} res 
 * @param {number} retryAfter 
 */
export function tooManyRequests(res, retryAfter = 60) {
  return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes',
      retryAfter
    }
  });
}

/**
 * Respuesta paginada
 * @param {Object} res 
 * @param {Array} data 
 * @param {Object} pagination 
 * @param {string} message 
 */
export function paginated(res, data, pagination, message = 'OK') {
  const response = new ApiResponse(true, data, message);
  return res.status(HTTP_STATUS.OK).json(
    response.withPagination(pagination).toJSON()
  );
}

/**
 * Respuesta con links HATEOAS
 * @param {Object} res 
 * @param {any} data 
 * @param {Object} links 
 * @param {string} message 
 */
export function withLinks(res, data, links, message = 'OK') {
  const response = new ApiResponse(true, data, message);
  return res.status(HTTP_STATUS.OK).json(
    response.withLinks(links).toJSON()
  );
}

/**
 * Respuesta de redirección
 * @param {Object} res 
 * @param {string} url 
 */
export function redirect(res, url) {
  return res.redirect(url);
}

/**
 * Respuesta de archivo
 * @param {Object} res 
 * @param {Buffer} file 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function file(res, file, filename, mimeType = 'application/octet-stream') {
  res.set({
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': file.length
  });
  
  return res.send(file);
}

/**
 * Respuesta de stream
 * @param {Object} res 
 * @param {Stream} stream 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function stream(res, stream, filename, mimeType = 'application/octet-stream') {
  res.set({
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Transfer-Encoding': 'chunked'
  });
  
  return stream.pipe(res);
}

/**
 * Respuesta de health check
 * @param {Object} res 
 * @param {Object} services 
 */
export function healthCheck(res, services = {}) {
  const status = Object.values(services).every(s => s.status === 'healthy') 
    ? 'healthy' 
    : 'degraded';
  
  return res.status(HTTP_STATUS.OK).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services,
    version: process.env.npm_package_version || '1.0.0'
  });
}

/**
 * Respuesta de versión de API
 * @param {Object} res 
 */
export function apiVersion(res) {
  return res.status(HTTP_STATUS.OK).json({
    api: 'DesbanWA API',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
}

// Exportar todo como default
export default {
  ApiResponse,
  success,
  created,
  accepted,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  paginated,
  withLinks,
  redirect,
  file,
  stream,
  healthCheck,
  apiVersion
};  