/**
 * solicitud.validator.js — Validación de entrada
 * Módulo: Desbaneo
 */

const PLANES_VALIDOS = [
  'basico', 'pro', 'premium',
  'business', 'business-pro', 'api-enterprise'
];

const TIPOS_BANEO_VALIDOS = [
  'temporal', 'permanente', 'business', 'api', 'restriccion'
];

/**
 * Valida el body de una solicitud de desbaneo
 * @returns {string[]} Array de errores. Vacío si todo es válido.
 */
exports.validateSolicitud = (body) => {
  const errors = [];

  // Número
  if (!body.numero || typeof body.numero !== 'string') {
    errors.push('El campo "numero" es requerido.');
  } else {
    const clean = body.numero.replace(/[\s\-+()]/g, '');
    if (!/^\d{7,15}$/.test(clean)) {
      errors.push('El número de teléfono no es válido.');
    }
  }

  // Plan
  if (!body.plan || !PLANES_VALIDOS.includes(body.plan)) {
    errors.push(`El plan debe ser uno de: ${PLANES_VALIDOS.join(', ')}.`);
  }

  // Nombre
  if (!body.nombre || typeof body.nombre !== 'string' || body.nombre.trim().length < 2) {
    errors.push('El campo "nombre" es requerido (mínimo 2 caracteres).');
  }

  // Email
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push('El correo electrónico no es válido.');
  }

  // Tipo de baneo (opcional pero validado si se envía)
  if (body.tipoBaneo && !TIPOS_BANEO_VALIDOS.includes(body.tipoBaneo)) {
    errors.push(`El tipo de baneo debe ser uno de: ${TIPOS_BANEO_VALIDOS.join(', ')}.`);
  }

  // Descripción mínima
  if (body.descripcion && body.descripcion.length > 1000) {
    errors.push('La descripción no puede superar los 1000 caracteres.');
  }

  // Aceptó aviso legal
  if (!body.aceptaAviso) {
    errors.push('Debes aceptar el aviso legal para continuar.');
  }

  return errors;
};