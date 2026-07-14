/**
 * Email Service (Nodemailer)
 * Envío de emails con templates y queue
 */

import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { EMAIL_CONFIG, isDevelopment } from './constants.js';
import logger from './logger.js';
import { ExternalServiceError } from './errors.js';
import path from 'path';
import fs from 'fs';

class MailerService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.queue = [];
    this.processing = false;
    
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * Inicializar transporter de Nodemailer
   */
  initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.SMTP.HOST,
      port: EMAIL_CONFIG.SMTP.PORT,
      secure: EMAIL_CONFIG.SMTP.SECURE,
      auth: EMAIL_CONFIG.SMTP.AUTH,
      tls: {
        rejectUnauthorized: isDevelopment() ? false : true
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    });

    // Verificar conexión
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('Error al configurar email:', error.message);
      } else {
        logger.info('✅ Servicio de email configurado correctamente');
      }
    });
  }

  /**
   * Cargar templates de email
   */
  loadTemplates() {
    const templatesDir = path.join(process.cwd(), 'emails', 'templates');
    
    if (!fs.existsSync(templatesDir)) {
      logger.warn('Directorio de templates no encontrado:', templatesDir);
      return;
    }

    const files = fs.readdirSync(templatesDir);
    
    files.forEach(file => {
      if (file.endsWith('.hbs')) {
        const templateName = file.replace('.hbs', '');
        const templatePath = path.join(templatesDir, file);
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        
        const template = handlebars.compile(templateContent);
        this.templates.set(templateName, template);
        
        logger.debug(`Template cargado: ${templateName}`);
      }
    });
  }

  /**
   * Enviar email
   * @param {Object} options - Opciones de email
   * @returns {Promise<Object>} Resultado
   */
  async send(options) {
    const {
      to,
      cc,
      bcc,
      subject,
      template,
      data = {},
      html,
      text,
      attachments = [],
      priority = 'normal'
    } = options;

    try {
      // Compilar template si existe
      let finalHtml = html;
      if (template && this.templates.has(template)) {
        const compileTemplate = this.templates.get(template);
        finalHtml = compileTemplate({
          ...data,
          baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          appName: EMAIL_CONFIG.FROM.NAME,
          year: new Date().getFullYear()
        });
      }

      const mailOptions = {
        from: `"${EMAIL_CONFIG.FROM.NAME}" <${EMAIL_CONFIG.FROM.ADDRESS}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
        subject,
        html: finalHtml,
        text: text || this.htmlToText(finalHtml),
        attachments,
        priority,
        headers: {
          'X-Mailer': 'DesbanWA Mailer',
          'X-Priority': priority === 'high' ? '1' : '3'
        }
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email enviado: ${subject}`, {
        to,
        messageId: info.messageId,
        template
      });

      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      };
    } catch (error) {
      logger.error('Error al enviar email:', {
        to,
        subject,
        error: error.message
      });
      
      throw new ExternalServiceError('Email', error.message, {
        originalError: error,
        to,
        subject
      });
    }
  }

  /**
   * Agregar email a la queue (para envío asíncrono)
   * @param {Object} options 
   */
  async queueEmail(options) {
    this.queue.push({
      options,
      timestamp: Date.now(),
      attempts: 0
    });

    logger.debug(`Email encolado: ${options.subject}`);

    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Procesar queue de emails
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const email = this.queue[0];
      
      try {
        await this.send(email.options);
        this.queue.shift(); // Remover si fue exitoso
      } catch (error) {
        email.attempts++;
        
        if (email.attempts >= 3) {
          logger.error('Email falló después de 3 intentos:', email.options);
          this.queue.shift(); // Remover después de 3 intentos
        } else {
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, 5000 * email.attempts));
        }
      }
    }

    this.processing = false;
  }

  /**
   * Convertir HTML a texto plano
   * @param {string} html 
   * @returns {string}
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();
  }

  // ============================================
  // MÉTODOS ESPECÍFICOS PARA DESBANWA
  // ============================================

  /**
   * Email de bienvenida
   * @param {string} email 
   * @param {string} name 
   */
  async sendWelcomeEmail(email, name) {
    return await this.send({
      to: email,
      subject: '¡Bienvenido a DesbanWA!',
      template: EMAIL_CONFIG.TEMPLATES.WELCOME,
      data: {
        name,
        ctaUrl: `${process.env.FRONTEND_URL}/solicitud`,
        supportEmail: EMAIL_CONFIG.FROM.ADDRESS
      }
    });
  }

  /**
   * Email de solicitud creada
   * @param {Object} solicitud 
   */
  async sendSolicitudCreada(solicitud) {
    return await this.send({
      to: solicitud.email,
      subject: `Solicitud de Desbaneo Creada - ${solicitud.reference_code}`,
      template: EMAIL_CONFIG.TEMPLATES.SOLICITUD_CREADA,
      data: {
        nombre: solicitud.nombre_completo,
        referenceCode: solicitud.reference_code,
        plan: solicitud.plan_nombre,
        numero: solicitud.numero_whatsapp,
        estadoUrl: `${process.env.FRONTEND_URL}/estado/${solicitud.reference_code}`
      }
    });
  }

  /**
   * Email de estado actualizado
   * @param {Object} solicitud 
   */
  async sendEstadoActualizado(solicitud) {
    return await this.send({
      to: solicitud.email,
      subject: `Actualización de tu solicitud - ${solicitud.reference_code}`,
      template: EMAIL_CONFIG.TEMPLATES.ESTADO_ACTUALIZADO,
      data: {
        nombre: solicitud.nombre_completo,
        referenceCode: solicitud.reference_code,
        estadoAnterior: solicitud.estado_anterior,
        estadoNuevo: solicitud.estado_nuevo,
        notas: solicitud.notas,
        fecha: new Date().toLocaleString('es-EC')
      }
    });
  }

  /**
   * Email de pago confirmado
   * @param {Object} pago 
   */
  async sendPagoConfirmado(pago) {
    return await this.send({
      to: pago.email,
      subject: 'Pago Confirmado - DesbanWA',
      template: EMAIL_CONFIG.TEMPLATES.PAGO_CONFIRMADO,
      data: {
        nombre: pago.nombre,
        amount: pago.amount,
        currency: pago.currency.toUpperCase(),
        referenceCode: pago.reference_code,
        fecha: new Date().toLocaleString('es-EC')
      }
    });
  }

  /**
   * Email de reembolso procesado
   * @param {Object} reembolso 
   */
  async sendReembolsoProcesado(reembolso) {
    return await this.send({
      to: reembolso.email,
      subject: 'Reembolso Procesado - DesbanWA',
      template: EMAIL_CONFIG.TEMPLATES.REEMBOLSO_PROCESADO,
      data: {
        nombre: reembolso.nombre,
        amount: reembolso.amount,
        referenceCode: reembolso.reference_code,
        motivo: reembolso.motivo,
        diasEstimados: 5
      }
    });
  }

  /**
   * Email de recuperación de contraseña
   * @param {string} email 
   * @param {string} token 
   */
  async sendPasswordReset(email, token) {
    return await this.send({
      to: email,
      subject: 'Recuperación de Contraseña - DesbanWA',
      template: EMAIL_CONFIG.TEMPLATES.PASSWORD_RESET,
      data: {
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
        expiresHours: 1
      }
    });
  }

  /**
   * Verificar salud del servicio de email
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      await this.transporter.verify();
      return {
        status: 'healthy',
        service: 'email',
        smtp: EMAIL_CONFIG.SMTP.HOST
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'email',
        error: error.message
      };
    }
  }
}

// Instancia singleton
const mailer = new MailerService();

export { mailer };
export default mailer;