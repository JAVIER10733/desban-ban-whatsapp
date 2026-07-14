/**
 * Newsletter API Routes
 * Endpoints para gestión de newsletter
 */

import { Router } from 'express';
import { asyncHandler } from './_lib/errors.js';
import { rateLimiters } from './_lib/rateLimit.js';
import newsletterController from './newsletter.controller.js';
import { validateNewsletter } from './newsletter.validator.js';

const router = Router();

// Rate limit para suscripciones
const newsletterLimiter = rateLimiters.email();

/**
 * @route   POST /api/newsletter/suscribir
 * @desc    Suscribirse al newsletter
 * @access  Public
 */
router.post(
  '/suscribir',
  newsletterLimiter,
  validateNewsletter,
  asyncHandler(newsletterController.suscribir)
);

/**
 * @route   POST /api/newsletter/confirmar
 * @desc    Confirmar suscripción al newsletter
 * @access  Public
 */
router.post(
  '/confirmar',
  asyncHandler(newsletterController.confirmarSuscripcion)
);

/**
 * @route   POST /api/newsletter/desuscribir
 * @desc    Desuscribirse del newsletter
 * @access  Public
 */
router.post(
  '/desuscribir',
  asyncHandler(newsletterController.desuscribir)
);

/**
 * @route   GET /api/newsletter/estadisticas
 * @desc    Obtener estadísticas del newsletter (Admin)
 * @access  Private/Admin
 */
router.get(
  '/estadisticas',
  // Aquí iría el middleware de autenticación y autorización de admin
  asyncHandler(newsletterController.obtenerEstadisticas)
);

export default router;