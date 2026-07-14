/**
 * planes.controller.js — Lógica de negocio
 * Módulo: Desbaneo / Planes
 */
const model = require('./planes.model');

/**
 * Obtiene los planes disponibles según tipo
 * @param {'personal'|'business'} tipo
 */
exports.obtenerPlanes = async (tipo = 'personal') => {
  const planes = await model.obtenerActivos(tipo);

  return planes.map(p => ({
    id:          p.id,
    slug:        p.slug,
    nombre:      p.nombre,
    precio:      p.precio_usd,
    descripcion: p.descripcion,
    tiempo:      p.tiempo_respuesta,
    garantia:    p.incluye_garantia,
    numeros:     p.numeros_incluidos,
    features:    p.features ? JSON.parse(p.features) : [],
    popular:     p.es_popular
  }));
};

/**
 * Obtiene un plan por su slug
 */
exports.obtenerPorSlug = async (slug) => {
  const plan = await model.obtenerPorSlug(slug);
  if (!plan) return null;
  return {
    id:      plan.id,
    slug:    plan.slug,
    nombre:  plan.nombre,
    precio:  plan.precio_usd,
    garantia: plan.incluye_garantia,
    features: plan.features ? JSON.parse(plan.features) : []
  };
};