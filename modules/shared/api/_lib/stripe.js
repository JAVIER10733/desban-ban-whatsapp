/**
 * Stripe Payment Service
 * Procesamiento de pagos con Stripe
 */

import Stripe from 'stripe';
import { STRIPE_CONFIG, isProduction } from './constants.js';
import logger from './logger.js';
import { PaymentError, ExternalServiceError } from './errors.js';

class StripeService {
  constructor() {
    this.stripe = null;
    this.webhookSecret = null;
    
    if (STRIPE_CONFIG.SECRET_KEY) {
      this.initialize();
    } else {
      logger.warn('STRIPE_SECRET_KEY no configurada. Stripe deshabilitado.');
    }
  }

  /**
   * Inicializar Stripe
   */
  initialize() {
    try {
      this.stripe = new Stripe(STRIPE_CONFIG.SECRET_KEY, {
        apiVersion: '2023-10-16',
        typescript: false,
        maxNetworkRetries: 2,
        timeout: 30000
      });

      this.webhookSecret = STRIPE_CONFIG.WEBHOOK_SECRET;

      logger.info('✅ Stripe inicializado correctamente');
    } catch (error) {
      logger.error('Error al inicializar Stripe:', error.message);
    }
  }

  /**
   * Crear PaymentIntent
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async createPaymentIntent(options) {
    try {
      const {
        amount,
        currency = STRIPE_CONFIG.CURRENCY,
        metadata = {},
        customer,
        paymentMethodTypes = STRIPE_CONFIG.PAYMENT_METHODS,
        description,
        receiptEmail
      } = options;

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency,
        payment_method_types: paymentMethodTypes,
        metadata: {
          ...STRIPE_CONFIG.METADATA,
          ...metadata
        },
        customer,
        description,
        receipt_email: receiptEmail,
        automatic_payment_methods: {
          enabled: true
        }
      });

      logger.info('PaymentIntent creado:', {
        id: paymentIntent.id,
        amount,
        currency
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        currency
      };
    } catch (error) {
      logger.error('Error al crear PaymentIntent:', error.message);
      throw new PaymentError('No se pudo procesar el pago', {
        stripeError: error
      });
    }
  }

  /**
   * Confirmar PaymentIntent
   * @param {string} paymentIntentId 
   * @returns {Promise<Object>}
   */
  async confirmPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          receiptUrl: paymentIntent.charges.data[0]?.receipt_url
        };
      }

      return {
        success: false,
        status: paymentIntent.status,
        message: `Pago en estado: ${paymentIntent.status}`
      };
    } catch (error) {
      logger.error('Error al confirmar pago:', error.message);
      throw new PaymentError('No se pudo confirmar el pago');
    }
  }

  /**
   * Crear Checkout Session
   * @param {Object} options 
   * @returns {Promise<Object>}
   */
  async createCheckoutSession(options) {
    try {
      const {
        lineItems,
        successUrl,
        cancelUrl,
        customerEmail,
        metadata = {},
        mode = 'payment'
      } = options;

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: STRIPE_CONFIG.PAYMENT_METHODS,
        line_items: lineItems.map(item => ({
          price_data: {
            currency: STRIPE_CONFIG.CURRENCY,
            product_data: {
              name: item.name,
              description: item.description,
              images: item.images
            },
            unit_amount: Math.round(item.amount * 100)
          },
          quantity: item.quantity || 1
        })),
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata: {
          ...STRIPE_CONFIG.METADATA,
          ...metadata
        },
        automatic_tax: {
          enabled: true
        }
      });

      logger.info('Checkout Session creada:', {
        id: session.id,
        url: session.url
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      logger.error('Error al crear Checkout Session:', error.message);
      throw new PaymentError('No se pudo crear la sesión de pago');
    }
  }

  /**
   * Crear cliente en Stripe
   * @param {Object} customerData 
   * @returns {Promise<Object>}
   */
  async createCustomer(customerData) {
    try {
      const { email, name, phone, metadata = {} } = customerData;

      const customer = await this.stripe.customers.create({
        email,
        name,
        phone,
        metadata: {
          ...STRIPE_CONFIG.METADATA,
          ...metadata
        }
      });

      logger.info('Cliente Stripe creado:', {
        id: customer.id,
        email
      });

      return {
        success: true,
        customerId: customer.id,
        email: customer.email
      };
    } catch (error) {
      logger.error('Error al crear cliente:', error.message);
      throw new ExternalServiceError('Stripe', 'No se pudo crear el cliente');
    }
  }

  /**
   * Obtener cliente
   * @param {string} customerId 
   * @returns {Promise<Object>}
   */
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return {
        success: true,
        customer
      };
    } catch (error) {
      logger.error('Error al obtener cliente:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Crear refund
   * @param {string} paymentIntentId 
   * @param {number} amount - Monto a reembolsar (opcional, default: total)
   * @returns {Promise<Object>}
   */
  async createRefund(paymentIntentId, amount = null) {
    try {
      const refundParams = {
        payment_intent: paymentIntentId
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundParams);

      logger.info('Reembolso creado:', {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        reason: refund.reason
      };
    } catch (error) {
      logger.error('Error al crear reembolso:', error.message);
      throw new PaymentError('No se pudo procesar el reembolso');
    }
  }

  /**
   * Verificar webhook signature
   * @param {string} payload - Raw body
   * @param {string} signature - Stripe signature header
   * @param {string} secret - Webhook secret
   * @returns {Object} Event
   */
  verifyWebhookSignature(payload, signature, secret = null) {
    try {
      const webhookSecret = secret || this.webhookSecret;
      
      if (!webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      logger.debug('Webhook verificado:', {
        type: event.type,
        id: event.id
      });

      return {
        success: true,
        event
      };
    } catch (error) {
      logger.error('Error al verificar webhook:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Procesar webhook
   * @param {Object} event - Stripe event
   * @returns {Promise<Object>}
   */
  async processWebhook(event) {
    try {
      logger.info('Procesando webhook:', {
        type: event.type,
        id: event.id
      });

      switch (event.type) {
        case 'payment_intent.succeeded':
          return await this.handlePaymentSucceeded(event.data.object);
        
        case 'payment_intent.payment_failed':
          return await this.handlePaymentFailed(event.data.object);
        
        case 'checkout.session.completed':
          return await this.handleCheckoutCompleted(event.data.object);
        
        case 'charge.refunded':
          return await this.handleChargeRefunded(event.data.object);
        
        default:
          logger.warn(`Webhook no manejado: ${event.type}`);
          return { handled: false, type: event.type };
      }
    } catch (error) {
      logger.error('Error al procesar webhook:', error.message);
      throw error;
    }
  }

  /**
   * Handler: Payment Succeeded
   * @param {Object} paymentIntent 
   */
  async handlePaymentSucceeded(paymentIntent) {
    logger.info('Pago exitoso:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      customer: paymentIntent.customer
    });

    return {
      handled: true,
      type: 'payment_intent.succeeded',
      data: {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        customer: paymentIntent.customer,
        metadata: paymentIntent.metadata,
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
      }
    };
  }

  /**
   * Handler: Payment Failed
   * @param {Object} paymentIntent 
   */
  async handlePaymentFailed(paymentIntent) {
    logger.warn('Pago fallido:', {
      id: paymentIntent.id,
      lastError: paymentIntent.last_payment_error?.message
    });

    return {
      handled: true,
      type: 'payment_intent.payment_failed',
      data: {
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
        customer: paymentIntent.customer
      }
    };
  }

  /**
   * Handler: Checkout Completed
   * @param {Object} session 
   */
  async handleCheckoutCompleted(session) {
    logger.info('Checkout completado:', {
      id: session.id,
      customer: session.customer,
      amount: session.amount_total / 100
    });

    return {
      handled: true,
      type: 'checkout.session.completed',
      data: {
        sessionId: session.id,
        customerId: session.customer,
        amount: session.amount_total / 100,
        metadata: session.metadata
      }
    };
  }

  /**
   * Handler: Charge Refunded
   * @param {Object} charge 
   */
  async handleChargeRefunded(charge) {
    logger.info('Cargo reembolsado:', {
      id: charge.id,
      amount: charge.amount_refunded / 100
    });

    return {
      handled: true,
      type: 'charge.refunded',
      data: {
        chargeId: charge.id,
        amount: charge.amount_refunded / 100,
        paymentIntent: charge.payment_intent,
        reason: charge.refunds?.data[0]?.reason
      }
    };
  }

  /**
   * Obtener URL de portal de cliente
   * @param {string} customerId 
   * @param {string} returnUrl 
   * @returns {Promise<Object>}
   */
  async createCustomerPortal(customerId, returnUrl) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });

      return {
        success: true,
        url: session.url
      };
    } catch (error) {
      logger.error('Error al crear portal:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      if (!this.stripe) {
        return {
          status: 'disabled',
          service: 'stripe',
          message: 'Stripe no configurado'
        };
      }

      // Intentar obtener una cuenta (operación ligera)
      await this.stripe.account.retrieve();

      return {
        status: 'healthy',
        service: 'stripe',
        environment: isProduction() ? 'production' : 'test'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'stripe',
        error: error.message
      };
    }
  }
}

// Instancia singleton
const stripeService = new StripeService();

export { stripeService };
export default stripeService;