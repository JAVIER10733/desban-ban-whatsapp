/**
 * Newsletter Controller
 * Manejo de suscripciones al newsletter
 */

import { ApiResponse } from './_lib/response.js';
import { mailer } from './_lib/mailer.js';
import { query } from './_lib/db.js';
import logger from './_lib/logger.js';

class NewsletterController {
  /**
   * Suscribirse al newsletter
   * @param {Object} req 
   * @param {Object} res 
   */
  async suscribir(req, res) {
    const { email, nombre } = req.body;

    // Verificar si ya está suscrito
    const existing = await query(
      'SELECT id FROM newsletter_suscriptores WHERE email = ? AND activo = ?',
      [email, 1]
    );

    if (existing.length > 0) {
      return ApiResponse.badRequest(
        res,
        'Este email ya está suscrito al newsletter',
        { email }
      );
    }

    // Insertar suscriptor
    const [result] = await query(
      `INSERT INTO newsletter_suscriptores (email, nombre, fecha_suscripcion, ip, confirmado) 
       VALUES (?, ?, NOW(), ?, ?)`,
      [email, nombre || null, req.ip, 0]
    );

    // Generar token de confirmación
    const token = Buffer.from(`${result.insertId}:${email}:${Date.now()}`).toString('base64');

    // Enviar email de confirmación
    const confirmUrl = `${process.env.FRONTEND_URL}/newsletter/confirmar?token=${token}`;
    
    await mailer.send({
      to: email,
      subject: 'Confirma tu suscripción al newsletter - DesbanWA',
      template: 'newsletter-confirmacion',
      data: {
        nombre: nombre || 'Suscriptor',
        confirmUrl,
        appName: 'DesbanWA'
      }
    });

    logger.info('Nueva suscripción al newsletter', {
      email,
      nombre,
      id: result.insertId
    });

    return ApiResponse.created(
      res,
      {
        suscrito: true,
        requiereConfirmacion: true,
        email
      },
      '¡Gracias por suscribirte! Por favor revisa tu email para confirmar.'
    );
  }

  /**
   * Confirmar suscripción
   * @param {Object} req 
   * @param {Object} res 
   */
  async confirmarSuscripcion(req, res) {
    const { token } = req.body;

    try {
      // Decodificar token
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [id, email, timestamp] = decoded.split(':');

      // Verificar que el token no sea muy viejo (24 horas)
      const hoursOld = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
      if (hoursOld > 24) {
        return ApiResponse.badRequest(res, 'El enlace de confirmación ha expirado');
      }

      // Actualizar suscriptor
      const [result] = await query(
        'UPDATE newsletter_suscriptores SET confirmado = ?, fecha_confirmacion = NOW() WHERE id = ? AND email = ?',
        [1, id, email]
      );

      if (result.affectedRows === 0) {
        return ApiResponse.notFound(res, 'Suscripción');
      }

      logger.info('Suscripción confirmada', { email, id });

      return ApiResponse.success(
        res,
        { confirmado: true, email },
        '¡Suscripción confirmada exitosamente!'
      );
    } catch (error) {
      logger.error('Error al confirmar suscripción:', error.message);
      return ApiResponse.badRequest(res, 'Token de confirmación inválido');
    }
  }

  /**
   * Desuscribirse del newsletter
   * @param {Object} req 
   * @param {Object} res 
   */
  async desuscribir(req, res) {
    const { email } = req.body;

    const [result] = await query(
      'UPDATE newsletter_suscriptores SET activo = ?, fecha_baja = NOW() WHERE email = ?',
      [0, email]
    );

    if (result.affectedRows === 0) {
      return ApiResponse.notFound(res, 'Suscripción');
    }

    logger.info('Suscripción cancelada', { email });

    return ApiResponse.success(
      res,
      { desuscrito: true, email },
      'Te has desuscrito exitosamente del newsletter.'
    );
  }

  /**
   * Obtener estadísticas del newsletter
   * @param {Object} req 
   * @param {Object} res 
   */
  async obtenerEstadisticas(req, res) {
    const [stats] = await query(`
      SELECT 
        COUNT(*) as total_suscriptores,
        SUM(CASE WHEN confirmado = 1 THEN 1 ELSE 0 END) as confirmados,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos,
        COUNT(CASE WHEN DATE(fecha_suscripcion) = CURDATE() THEN 1 END) as nuevos_hoy,
        COUNT(CASE WHEN DATE(fecha_suscripcion) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as nuevos_semana,
        COUNT(CASE WHEN DATE(fecha_suscripcion) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as nuevos_mes
      FROM newsletter_suscriptores
    `);

    return ApiResponse.success(
      res,
      stats[0],
      'Estadísticas del newsletter'
    );
  }
}

export default new NewsletterController();