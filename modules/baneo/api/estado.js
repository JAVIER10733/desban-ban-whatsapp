/**
 * estado.js — Handler principal
 * GET /api/desbaneo/estado?id=DES-4821
 */
const { corsHeaders } = require('../_shared/cors');
const { rateLimit }   = require('../_shared/rateLimit');
const { response }    = require('../_shared/response');
const { logger }      = require('../_shared/logger');
const controller      = require('./estado.controller');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }
  if (event.httpMethod !== 'GET') {
    return response(405, { error: 'Método no permitido' });
  }

  const ip      = event.headers['x-forwarded-for'] || 'unknown';
  const limited = await rateLimit(ip, 'desbaneo-estado', 30, 60);
  if (limited) return response(429, { error: 'Demasiadas solicitudes.' });

  const { id, email } = event.queryStringParameters || {};

  if (!id && !email) {
    return response(400, { error: 'Se requiere "id" o "email" como parámetro.' });
  }

  try {
    if (email) {
      const casos = await controller.obtenerPorEmail(email);
      return response(200, { success: true, data: casos });
    }

    const caso = await controller.obtenerEstado(id);
    if (!caso) return response(404, { error: 'Caso no encontrado.' });

    logger.info('estado_consultado', { id });
    return response(200, { success: true, data: caso });
  } catch (err) {
    logger.error('estado_desbaneo_error', { error: err.message });
    return response(500, { error: 'Error al obtener el estado.' });
  }
};