/**
 * solicitud.controller.js — Lógica de negocio
 * Módulo: Desbaneo
 */
const model  = require('./solicitud.model');
const mailer = require('../_shared/mailer');
const stripe = require('../_shared/stripe');

/**
 * Crea una nueva solicitud de desbaneo
 */
exports.crearSolicitud = async (body, ip) => {
  // 1. Crear intención de pago en Stripe
  const paymentIntent = await stripe.crearPaymentIntent({
    amount:   getPrecio(body.plan),
    currency: 'usd',
    metadata: { servicio: 'desbaneo', plan: body.plan, numero: body.numero }
  });

  // 2. Guardar solicitud en la base de datos
  const solicitud = await model.insertar({
    numero:        body.numero,
    plan:          body.plan,
    tipo_baneo:    body.tipoBaneo || null,
    descripcion:   body.descripcion || null,
    nombre:        body.nombre,
    email:         body.email,
    pref_contacto: body.prefContacto || 'email',
    payment_intent_id: paymentIntent.id,
    ip_origen:     ip,
    estado:        'pendiente_pago'
  });

  // 3. Enviar correo de confirmación
  await mailer.enviar({
    to:       body.email,
    template: 'solicitud_desbaneo_confirmacion',
    data: {
      nombre:    body.nombre,
      caso_id:   solicitud.id,
      numero:    body.numero,
      plan:      body.plan,
      precio:    getPrecio(body.plan) / 100,
      estado_url: `${process.env.SITE_URL}/estado?caso=${solicitud.id}`
    }
  });

  return {
    id:               solicitud.id,
    payment_intent:   paymentIntent.client_secret,
    caso_numero:      `DES-${solicitud.id}`,
    estado:           'pendiente_pago'
  };
};

/**
 * Actualiza el estado de una solicitud
 */
exports.actualizarEstado = async (id, estado, nota = null) => {
  const updated = await model.actualizarEstado(id, estado, nota);

  if (estado === 'completado') {
    const solicitud = await model.obtenerPorId(id);
    await mailer.enviar({
      to:       solicitud.email,
      template: 'desbaneo_completado',
      data: {
        nombre:  solicitud.nombre,
        numero:  solicitud.numero,
        caso_id: id
      }
    });
  }

  return updated;
};

/**
 * Obtiene el estado de una solicitud
 */
exports.obtenerEstado = async (id) => {
  return await model.obtenerConTimeline(id);
};

/**
 * Retorna precio en centavos según plan
 */
function getPrecio(plan) {
  const precios = {
    basico:   1900,
    pro:      3900,
    premium:  5900,
    business: 6900,
    'business-pro': 9900,
    'api-enterprise': 14900
  };
  return precios[plan] || 3900;
}