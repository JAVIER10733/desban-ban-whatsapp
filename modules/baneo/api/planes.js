/**
 * planes.js — Handler principal
 * GET /api/desbaneo/planes
 */
const { corsHeaders } = require('../_shared/cors');
const { rateLimit }   = require('../_shared/rateLimit');
const { response }    = require('../_shared/response');
const { logger }      = require('../_shared/logger');
const controller      = require('./planes.controller');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }
  if (event.httpMethod !== 'GET') {
    return response(405, { error: 'Método no permitido' });
  }

  const ip      = event.headers['x-forwarded-for'] || 'unknown';
  const limited = await rateLimit(ip, 'desbaneo-planes', 60, 60);
  if (limited) return response(429, { error: 'Demasiadas solicitudes.' });

  try {
    const tipo = event.queryStringParameters?.tipo || 'personal';
    const planes = await controller.obtenerPlanes(tipo);
    return response(200, { success: true, data: planes });
  } catch (err) {
    logger.error('planes_desbaneo_error', { error: err.message });
    return response(500, { error: 'Error al obtener planes.' });
  }
};