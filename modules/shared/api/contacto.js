/**
 * Contacto API Routes
 * Endpoint para formulario de contacto
 */

import { Router } from 'express';
import { asyncHandler } from './_lib/errors.js';
import { rateLimiters } from './_lib/rateLimit.js';
import contactoController from './contacto.controller.js';
import { validateContacto } from './contacto.validator.js';

const router = Router();

// Rate limit estricto para contacto (10 requests por hora)
const contactoLimiter = rateLimiters.email();

/**
 * @route   POST /api/contacto
 * @desc    Enviar mensaje de contacto
 * @access  Public
 */
router.post(
  '/',
  contactoLimiter,
  validateContacto,
  asyncHandler(contactoController.enviarMensaje)
);

/**
 * @route   GET /api/contacto/categorias
 * @desc    Obtener categorías de contacto disponibles
 * @access  Public
 */
router.get(
  '/categorias',
  asyncHandler(contactoController.obtenerCategorias)
);

export default router;