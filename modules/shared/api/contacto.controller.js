/**
 * Contacto Controller
 * Manejo de mensajes de contacto
 */

import { ApiResponse } from './_lib/response.js';
import { mailer } from './_lib/mailer.js';
import logger from './_lib/logger.js';
import { auditLog } from './_lib/logger.js';

class ContactoController {
  /**
   * Enviar mensaje de contacto
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async enviarMensaje(req, res) {
    const { nombre, email, telefono, asunto, mensaje, categoria } = req.body;
    const ip = req.ip;
    const userAgent = req.get('user-agent');

    logger.info('Mensaje de contacto recibido', {
      nombre,
      email,
      asunto,
      categoria
    });

    // Preparar datos del email
    const emailData = {
      to: process.env.CONTACT_EMAIL || 'contacto@desbanwa.com',
      subject: `Nuevo mensaje de contacto: ${asunto}`,
      template: 'contacto',
      data: {
        nombre,
        email,
        telefono: telefono || 'No proporcionado',
        asunto,
        mensaje,
        categoria: categoria || 'General',
        fecha: new Date().toLocaleString('es-EC'),
        ip,
        userAgent
      },
      priority: categoria === 'urgente' ? 'high' : 'normal'
    };

    // Enviar email al equipo
    await mailer.send(emailData);

    // Enviar email de confirmación al cliente
    await mailer.send({
      to: email,
      subject: 'Hemos recibido tu mensaje - DesbanWA',
      template: 'contacto-confirmacion',
      data: {
        nombre,
        asunto,
        mensaje,
        tiempoRespuesta: '24 horas',
        supportEmail: process.env.CONTACT_EMAIL || 'contacto@desbanwa.com'
      }
    });

    // Log de auditoría
    auditLog('CONTACTO_ENVIADO', { email }, {
      asunto,
      categoria,
      ip
    });

    return ApiResponse.success(
      res,
      {
        enviado: true,
        timestamp: new Date().toISOString()
      },
      'Mensaje enviado correctamente. Te responderemos en menos de 24 horas.'
    );
  }

  /**
   * Obtener categorías de contacto
   * @param {Object} req 
   * @param {Object} res 
   */
  async obtenerCategorias(req, res) {
    const categorias = [
      {
        id: 'general',
        nombre: 'Consulta General',
        descripcion: 'Preguntas generales sobre nuestros servicios',
        icono: '💬',
        tiempoRespuesta: '24 horas'
      },
      {
        id: 'soporte',
        nombre: 'Soporte Técnico',
        descripcion: 'Problemas técnicos o consultas sobre tu solicitud',
        icono: '🔧',
        tiempoRespuesta: '12 horas'
      },
      {
        id: 'ventas',
        nombre: 'Ventas',
        descripcion: 'Información sobre planes y precios',
        icono: '💰',
        tiempoRespuesta: '6 horas'
      },
      {
        id: 'urgente',
        nombre: 'Urgente',
        descripcion: 'Casos urgentes que requieren atención inmediata',
        icono: '🚨',
        tiempoRespuesta: '2 horas',
        priority: 'high'
      },
      {
        id: 'empresas',
        nombre: 'Empresas',
        descripcion: 'Consultas para planes empresariales',
        icono: '🏢',
        tiempoRespuesta: '12 horas'
      }
    ];

    return ApiResponse.success(
      res,
      categorias,
      'Categorías de contacto obtenidas'
    );
  }
}

export default new ContactoController();