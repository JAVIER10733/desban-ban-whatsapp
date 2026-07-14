/**
 * planes.model.js — Queries a la base de datos
 * Módulo: Desbaneo / Planes
 */
const { db } = require('../_shared/db');

/**
 * Obtiene los planes activos según tipo
 */
exports.obtenerActivos = async (tipo = 'personal') => {
  const { rows } = await db.query(
    `SELECT id, slug, nombre, precio_usd, descripcion,
            tiempo_respuesta, incluye_garantia,
            numeros_incluidos, features, es_popular
     FROM planes_desbaneo
     WHERE activo = true AND tipo = $1
     ORDER BY precio_usd ASC`,
    [tipo]
  );
  return rows;
};

/**
 * Obtiene un plan por su slug
 */
exports.obtenerPorSlug = async (slug) => {
  const { rows } = await db.query(
    'SELECT * FROM planes_desbaneo WHERE slug = $1 AND activo = true',
    [slug]
  );
  return rows[0] || null;
};

/**
 * Actualiza el precio de un plan (uso admin)
 */
exports.actualizarPrecio = async (id, precio) => {
  const { rows } = await db.query(
    'UPDATE planes_desbaneo SET precio_usd = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [precio, id]
  );
  return rows[0];
};