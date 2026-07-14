/**
 * Webhook Controller
 * Manejo de webhooks de Stripe y otros servicios
 */

import { stripeService } from './_lib/stripe.js';
import { ApiResponse } from './_lib/response.js';
import { query } from './_lib/db.js';
import logger from './_lib/logger.js';

class WebhookController {
  /**
   * Procesar webhook de Stripe
   * @param {Object} req 
   * @param {Object} res 
   */
  async stripeWebhook(req, res) {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    try {
      // Verificar firma
      const verification = stripeService.verifyWebhookSignature(
        payload,
        signature
      );

      if (!verification.success) {
        logger.error('Webhook signature verification failed');
        return res.status(400).json({
          error: 'Invalid signature'
        });
      }

      const event = verification.event;

      // Procesar evento
      const result = await stripeService.processWebhook(event);

      // Actualizar base de datos según el tipo de evento
      if (result.handled) {
        await this.handleStripeEvent(result.type, result.data);
      }

      logger.info('Webhook procesado', {
        type: event.type,
        handled: result.handled
      });

      res.json({ received: true });

    } catch (error) {
      logger.error('Error procesando webhook de Stripe:', error.message);
      res.status(500).json({
        error: 'Webhook handler failed'
      });
    }
  }

  /**
   * Manejar evento de Stripe
   * @param {string} type 
   * @param {Object} data 
   */
  async handleStripeEvent(type, data) {
    switch (type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(data);
        break;
      
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(data);
        break;
      
      case 'charge.refunded':
        await this.handleChargeRefunded(data);
        break;
      
      default:
        logger.debug(`Evento de Stripe no requiere acción: ${type}`);
    }
  }

  /**
   * Handle payment succeeded
   * @param {Object} data 
   */
  async handlePaymentSucceeded(data) {
    const { paymentIntentId, metadata } = data;

    // Actualizar solicitud
    await query(
      `UPDATE solicitudes_desbaneo 
       SET estado_pago = 'pagado',
           fecha_pago = NOW(),
           estado_id = 2
       WHERE stripe_payment_intent_id = ?`,
      [paymentIntentId]
    );

    logger.info('Solicitud actualizada - Pago exitoso', {
      paymentIntentId,
      referenceCode: metadata.referenceCode
    });
  }

  /**
   * Handle payment failed
   * @param {Object} data 
   */
  async handlePaymentFailed(data) {
    const { paymentIntentId, error } = data;

    await query(
      `UPDATE solicitudes_desbaneo 
       SET estado_pago = 'fallido',
           payment_error = ?
       WHERE stripe_payment_intent_id = ?`,
      [error, paymentIntentId]
    );

    logger.warn('Pago fallido', {
      paymentIntentId,
      error
    });
  }

  /**
   * Handle charge refunded
   * @param {Object} data 
   */
  async handleChargeRefunded(data) {
    const { paymentIntent, amount } = data;

    await query(
      `UPDATE solicitudes_desbaneo 
       SET estado_pago = 'reembolsado',
           fecha_reembolso = NOW(),
           estado_id = 10
       WHERE stripe_payment_intent_id = ?`,
      [paymentIntent]
    );

    logger.info('Reembolso procesado', {
      paymentIntent,
      amount
    });
  }

  /**
   * Health check para webhooks
   * @param {Object} req 
   * @param {Object} res 
   */
  healthCheck(req, res) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'webhook'
    });
  }
}

export default new WebhookController();