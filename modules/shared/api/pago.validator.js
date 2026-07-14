/**
 * Pago Validator
 * Validación de pagos
 */

import { createValidationError, validateRequired } from './_lib/errors.js';

/**
 * Validar creación de pago
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
export function validateCrearPago(req, res, next) {
  try {
    const { planId, referenceCode, metodoPago } = req.body;
    const errors = {};

    // Validar planId
    try {
      validateRequired(planId, 'planId');
      if (typeof planId !== 'number' && !/^\d+$/.test(planId)) {
        throw new Error('planId debe ser un número válido');
      }
    } catch (error) {
      errors.planId = error.message;
    }

    // Validar referenceCode
    try {
      validateRequired(referenceCode, 'referenceCode');
      if (!/^DSB-[A-Z0-9-]+$/.test(referenceCode)) {
        throw new Error('referenceCode inválido');
      }
    } catch (error) {
      errors.referenceCode = error.message;
    }

    // Validar metodoPago si existe
    const metodosValidos = ['card', 'paypal', 'transferencia'];
    if (metodoPago && !metodosValidos.includes(metodoPago)) {
      errors.metodoPago = `Método de pago inválido. Válidos: ${metodosValidos.join(', ')}`;
    }

    if (Object.keys(errors).length > 0) {
      throw createValidationError(errors);
    }

    req.body.metodoPago = metodoPago || 'card';

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Validar confirmación de pago
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
export function validateConfirmarPago(req, res, next) {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      throw createValidationError({
        paymentIntentId: 'paymentIntentId es requerido'
      });
    }

    if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) {
      throw createValidationError({
        paymentIntentId: 'paymentIntentId inválido'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default {
  validateCrearPago,
  validateConfirmarPago
};