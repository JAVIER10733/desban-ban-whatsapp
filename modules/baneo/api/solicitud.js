/**
 * solicitud.js — Handler principal
 * POST /api/desbaneo/solicitud
 */
const { corsHeaders }      = require('../_shared/cors');
const { rateLimit }        = require('../_shared/rateLimit');
const { response }         = require('../_shared/response');
const { logger }           = require('../_shared/logger');
const controller           = require('./solicitud.controller');
const { validateSolicitud } = require('./solicitud.validator');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }
  if (event.httpMethod !== 'POST') {
    return response(405, { error: 'Método no permitido' });
  }

  const ip = event.headers['x-forwarded-for'] || 'unknown';
  const limited = await rateLimit(ip, 'desbaneo-solicitud', 5, 3600);
  if (limited) return response(429, { error: 'Demasiadas solicitudes. Intenta más tarde.' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return response(400, { error: 'JSON inválido' });
  }

  const errors = validateSolicitud(body);
  if (errors.length > 0) return response(422, { errors });

  try {
    const result = await controller.crearSolicitud(body, ip);
    logger.info('solicitud_desbaneo_creada', { id: result.id, plan: body.plan });
    return response(201, { success: true, data: result });
  } catch (err) {
    logger.error('solicitud_desbaneo_error', { error: err.message });
    return response(500, { error: 'Error interno. Intenta de nuevo.' });
  }
};