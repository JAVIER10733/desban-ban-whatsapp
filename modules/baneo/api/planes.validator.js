/**
 * planes.validator.js — Validación de entrada
 * Módulo: Desbaneo / Planes
 */

const TIPOS_VALIDOS = ['personal', 'business'];

/**
 * Valida parámetros de consulta de planes
 */
exports.validatePlanesQuery = (params = {}) => {
  const errors = [];
  if (params.tipo && !TIPOS_VALIDOS.includes(params.tipo)) {
    errors.push(`El parámetro "tipo" debe ser: ${TIPOS_VALIDOS.join(', ')}.`);
  }
  return errors;
};

/**
 * Valida body para actualizar un plan
 */
exports.validateActualizarPlan = (body) => {
  const errors = [];
  if (body.precio !== undefined) {
    const p = Number(body.precio);
    if (isNaN(p) || p < 1 || p > 9999) {
      errors.push('El precio debe ser un número entre 1 y 9999 USD.');
    }
  }
  return errors;
};