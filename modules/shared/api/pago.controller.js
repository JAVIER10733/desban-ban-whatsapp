/**
 * Pago Controller
 * Manejo de pagos y transacciones
 */

import { stripeService } from './_lib/stripe.js';
import { ApiResponse } from './_lib/response.js';
import { query, transaction } from './_lib/db.js';
import logger from './_lib/logger.js';
import { auditLog } from './_lib/logger.js';
import { mailer } from './_lib/mailer.js';

class PagoController {
  /**
   * Crear pago
   * @param {Object} req 
   * @param {Object} res 
   */
  async crearPago(req, res) {
    const userId = req.user.userId;
    const { planId, referenceCode, metodoPago = 'card' } = req.body;

    try {
      // Iniciar transacción
      const result = await transaction(async (conn) => {
        // Obtener información del plan
        const [planes] = await conn.execute(
          'SELECT * FROM planes_desbaneo WHERE id = ? AND activo = ?',
          [planId, 1]
        );

        if (planes.length === 0) {
          throw new Error('Plan no encontrado o inactivo');
        }

        const plan = planes[0];

        // Obtener información de la solicitud
        const [solicitudes] = await conn.execute(
          'SELECT * FROM solicitudes_desbaneo WHERE reference_code = ? AND cliente_id = ?',
          [referenceCode, userId]
        );

        if (solicitudes.length === 0) {
          throw new Error('Solicitud no encontrada');
        }

        const solicitud = solicitudes[0];

        if (solicitud.estado_pago !== 'pendiente') {
          throw new Error('Esta solicitud ya ha sido pagada o está en proceso');
        }

        // Crear cliente en Stripe si no existe
        let customerId = solicitud.stripe_customer_id;
        
        if (!customerId) {
          const clienteResult = await stripeService.createCustomer({
            email: solicitud.email,
            name: solicitud.nombre_completo,
            phone: solicitud.telefono_contacto,
            metadata: {
              userId,
              referenceCode
            }
          });

          customerId = clienteResult.customerId;

          // Actualizar solicitud con customer ID
          await conn.execute(
            'UPDATE solicitudes_desbaneo SET stripe_customer_id = ? WHERE id = ?',
            [customerId, solicitud.id]
          );
        }

        // Crear PaymentIntent en Stripe
        const paymentResult = await stripeService.createPaymentIntent({
          amount: plan.precio,
          currency: plan.moneda.toLowerCase(),
          customer: customerId,
          metadata: {
            referenceCode,
            planId: plan.id,
            planName: plan.nombre,
            userId,
            solicitudId: solicitud.id
          },
          description: `Desbaneo WhatsApp - Plan ${plan.nombre}`,
          receiptEmail: solicitud.email
        });

        // Registrar pago en base de datos
        const [pagoResult] = await conn.execute(
          `INSERT INTO pagos (
            solicitud_id, user_id, stripe_payment_intent_id, stripe_customer_id,
            amount, currency, status, payment_method, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            solicitud.id,
            userId,
            paymentResult.paymentIntentId,
            customerId,
            plan.precio,
            plan.moneda.toLowerCase(),
            'pending',
            metodoPago,
            JSON.stringify({
              plan: plan.nombre,
              referenceCode,
              createdAt: new Date().toISOString()
            })
          ]
        );

        return {
          pagoId: pagoResult.insertId,
          clientSecret: paymentResult.clientSecret,
          paymentIntentId: paymentResult.paymentIntentId,
          amount: plan.precio,
          currency: plan.moneda
        };
      });

      logger.info('Pago creado', {
        userId,
        referenceCode,
        pagoId: result.pagoId,
        amount: result.amount
      });

      auditLog('PAGO_CREADO', { userId }, {
        referenceCode,
        pagoId: result.pagoId,
        amount: result.amount
      });

      return ApiResponse.created(
        res,
        {
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId,
          amount: result.amount,
          currency: result.currency
        },
        'Pago creado exitosamente'
      );

    } catch (error) {
      logger.error('Error al crear pago:', error.message);
      return ApiResponse.error(
        res,
        error.message || 'No se pudo crear el pago',
        'PAYMENT_CREATION_ERROR',
        400
      );
    }
  }

  /**
   * Confirmar pago
   * @param {Object} req 
   * @param {Object} res 
   */
  async confirmarPago(req, res) {
    const userId = req.user.userId;
    const { paymentIntentId } = req.body;

    try {
      // Verificar estado en Stripe
      const stripeResult = await stripeService.confirmPaymentIntent(paymentIntentId);

      if (!stripeResult.success) {
        return ApiResponse.error(
          res,
          stripeResult.message || 'El pago no fue confirmado',
          'PAYMENT_NOT_CONFIRMED',
          400
        );
      }

      // Actualizar en base de datos
      await transaction(async (conn) => {
        // Actualizar pago
        await conn.execute(
          `UPDATE pagos 
           SET status = ?, 
               confirmed_at = NOW(),
               receipt_url = ?
           WHERE stripe_payment_intent_id = ?`,
          ['completed', stripeResult.receiptUrl, paymentIntentId]
        );

        // Actualizar solicitud
        await conn.execute(
          `UPDATE solicitudes_desbaneo 
           SET estado_pago = 'pagado',
               fecha_pago = NOW(),
               estado_id = 2  -- Pagado - En Cola
           WHERE stripe_payment_intent_id = ?`,
          [paymentIntentId]
        );

        // Obtener datos para email
        const [rows] = await conn.execute(
          `SELECT s.*, p.nombre as plan_nombre 
           FROM solicitudes_desbaneo s
           JOIN planes_desbaneo p ON s.plan_id = p.id
           WHERE s.stripe_payment_intent_id = ?`,
          [paymentIntentId]
        );

        if (rows.length > 0) {
          const solicitud = rows[0];

          // Enviar email de confirmación
          await mailer.sendPagoConfirmado({
            email: solicitud.email,
            nombre: solicitud.nombre_completo,
            amount: stripeResult.amount,
            currency: stripeResult.currency,
            reference_code: solicitud.reference_code
          });

          // Log
          logger.info('Pago confirmado', {
            userId,
            referenceCode: solicitud.reference_code,
            amount: stripeResult.amount
          });

          auditLog('PAGO_CONFIRMADO', { userId }, {
            referenceCode: solicitud.reference_code,
            amount: stripeResult.amount
          });
        }
      });

      return ApiResponse.success(
        res,
        {
          confirmed: true,
          paymentIntentId,
          receiptUrl: stripeResult.receiptUrl,
          amount: stripeResult.amount
        },
        'Pago confirmado exitosamente'
      );

    } catch (error) {
      logger.error('Error al confirmar pago:', error.message);
      return ApiResponse.error(
        res,
        'No se pudo confirmar el pago',
        'PAYMENT_CONFIRMATION_ERROR',
        500
      );
    }
  }

  /**
   * Obtener estado de pago
   * @param {Object} req 
   * @param {Object} res 
   */
  async obtenerEstadoPago(req, res) {
    const { pagoId } = req.params;
    const userId = req.user.userId;

    const [pagos] = await query(
      `SELECT p.*, s.reference_code 
       FROM pagos p
       JOIN solicitudes_desbaneo s ON p.solicitud_id = s.id
       WHERE p.id = ? AND p.user_id = ?`,
      [pagoId, userId]
    );

    if (pagos.length === 0) {
      return ApiResponse.notFound(res, 'Pago');
    }

    const pago = pagos[0];

    return ApiResponse.success(
      res,
      {
        id: pago.id,
        referenceCode: pago.reference_code,
        amount: pago.amount,
        currency: pago.currency,
        status: pago.status,
        paymentMethod: pago.payment_method,
        createdAt: pago.created_at,
        confirmedAt: pago.confirmed_at
      },
      'Estado de pago obtenido'
    );
  }

  /**
   * Solicitar reembolso
   * @param {Object} req 
   * @param {Object} res 
   */
  async solicitarReembolso(req, res) {
    const userId = req.user.userId;
    const { referenceCode, motivo } = req.body;

    try {
      const result = await transaction(async (conn) => {
        // Obtener solicitud y pago
        const [rows] = await conn.execute(
          `SELECT s.*, p.id as pago_id, p.stripe_payment_intent_id, p.amount
           FROM solicitudes_desbaneo s
           JOIN pagos p ON s.id = p.solicitud_id
           WHERE s.reference_code = ? AND s.cliente_id = ?`,
          [referenceCode, userId]
        );

        if (rows.length === 0) {
          throw new Error('Solicitud o pago no encontrado');
        }

        const solicitud = rows[0];

        // Verificar si aplica para reembolso (garantía)
        if (solicitud.estado !== 'fallido-no-recuperable' && req.user.role !== 'admin') {
          throw new Error('Solo aplica reembolso si el servicio no fue completado exitosamente');
        }

        // Procesar reembolso en Stripe
        const refundResult = await stripeService.createRefund(
          solicitud.stripe_payment_intent_id,
          solicitud.amount
        );

        // Actualizar pago
        await conn.execute(
          `UPDATE pagos 
           SET status = 'refunded',
               refunded_at = NOW(),
               refund_reason = ?
           WHERE id = ?`,
          [motivo, solicitud.pago_id]
        );

        // Actualizar solicitud
        await conn.execute(
          `UPDATE solicitudes_desbaneo 
           SET estado_pago = 'reembolsado',
               fecha_reembolso = NOW(),
               estado_id = 10  -- Reembolsado
           WHERE id = ?`,
          [solicitud.id]
        );

        return {
          refundId: refundResult.refundId,
          amount: refundResult.amount
        };
      });

      // Enviar email de reembolso
      const [userData] = await query(
        'SELECT email, nombre_completo FROM solicitudes_desbaneo WHERE reference_code = ?',
        [referenceCode]
      );

      if (userData.length > 0) {
        await mailer.sendReembolsoProcesado({
          email: userData[0].email,
          nombre: userData[0].nombre_completo,
          amount: result.amount,
          reference_code: referenceCode,
          motivo
        });
      }

      auditLog('REEMBOLSO_PROCESADO', { userId }, {
        referenceCode,
        amount: result.amount,
        motivo
      });

      return ApiResponse.success(
        res,
        {
          reembolsado: true,
          amount: result.amount,
          refundId: result.refundId
        },
        'Reembolso procesado exitosamente. El dinero será devuelto en 5-10 días hábiles.'
      );

    } catch (error) {
      logger.error('Error al procesar reembolso:', error.message);
      return ApiResponse.error(
        res,
        error.message || 'No se pudo procesar el reembolso',
        'REFUND_ERROR',
        400
      );
    }
  }

  /**
   * Obtener historial de pagos
   * @param {Object} req 
   * @param {Object} res 
   */
  async obtenerHistorial(req, res) {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const [pagos] = await query(
      `SELECT p.*, s.reference_code, s.numero_whatsapp, pl.nombre as plan_nombre
       FROM pagos p
       JOIN solicitudes_desbaneo s ON p.solicitud_id = s.id
       JOIN planes_desbaneo pl ON s.plan_id = pl.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const [total] = await query(
      'SELECT COUNT(*) as count FROM pagos WHERE user_id = ?',
      [userId]
    );

    return ApiResponse.paginated(
      res,
      pagos.map(pago => ({
        id: pago.id,
        referenceCode: pago.reference_code,
        plan: pago.plan_nombre,
        numeroWhatsapp: pago.numero_whatsapp,
        amount: pago.amount,
        currency: pago.currency,
        status: pago.status,
        paymentMethod: pago.payment_method,
        createdAt: pago.created_at,
        confirmedAt: pago.confirmed_at
      })),
      {
        total: total[0].count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total[0].count / limit)
      },
      'Historial de pagos obtenido'
    );
  }
}

export default new PagoController();