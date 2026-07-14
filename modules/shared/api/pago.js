/**
 * Pago API Routes
 * Endpoints para procesamiento de pagos
 */

import { Router } from 'express';
import { asyncHandler } from './_lib/errors.js';
import { rateLimiters } from './_lib/rateLimit.js';
import pagoController from './pago.controller.js';
import { validateCrearPago, validateConfirmarPago } from './pago.validator.js';
import { auth } from './_lib/auth.js';

const router = Router();

// Rate limit para pagos
const pagoLimiter = rateLimiters.createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 intentos de pago por hora
  id: 'pago'
});

/**
 * @route   POST /api/pago/crear
 * @desc    Crear intento de pago
 * @access  Private (requiere autenticación)
 */
router.post(
  '/crear',
  auth.authMiddleware(),
  pagoLimiter,
  validateCrearPago,
  asyncHandler(pagoController.crearPago)
);

/**
 * @route   POST /api/pago/confirmar
 * @desc    Confirmar pago (después de completar en Stripe)
 * @access  Private
 */
router.post(
  '/confirmar',
  auth.authMiddleware(),
  validateConfirmarPago,
  asyncHandler(pagoController.confirmarPago)
);

/**
 * @route   GET /api/pago/estado/:pagoId
 * @desc    Obtener estado de un pago
 * @access  Private
 */
router.get(
  '/estado/:pagoId',
  auth.authMiddleware(),
  asyncHandler(pagoController.obtenerEstadoPago)
);

/**
 * @route   POST /api/pago/reembolsar
 * @desc    Solicitar reembolso (solo admin o si aplica garantía)
 * @access  Private
 */
router.post(
  '/reembolsar',
  auth.authMiddleware(),
  asyncHandler(pagoController.solicitarReembolso)
);

/**
 * @route   GET /api/pago/historial
 * @desc    Obtener historial de pagos del usuario
 * @access  Private
 */
router.get(
  '/historial',
  auth.authMiddleware(),
  asyncHandler(pagoController.obtenerHistorial)
);

export default router;