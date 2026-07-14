/**
 * Webhook API Routes
 * Endpoints para recepción de webhooks
 */

import { Router } from 'express';
import webhookController from './webhook.controller.js';

const router = Router();

/**
 * @route   POST /api/webhook/stripe
 * @desc    Webhook de Stripe (sin auth, verificado por signature)
 * @access  Public (pero verificado)
 */
router.post(
  '/stripe',
  // Raw body required para verificar signature
  (req, res, next) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      req.body = data;
      next();
    });
  },
  webhookController.stripeWebhook.bind(webhookController)
);

/**
 * @route   GET /api/webhook/health
 * @desc    Health check para webhooks
 * @access  Public
 */
router.get(
  '/health',
  webhookController.healthCheck.bind(webhookController)
);

export default router;