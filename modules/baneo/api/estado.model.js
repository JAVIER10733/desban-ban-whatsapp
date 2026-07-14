/**
 * estado.model.js — Queries a la base de datos
 * Módulo: Desbaneo / Estado
 */
const { db } = require('../_shared/db');

/**
 * Obtiene solicitud con su historial de estados
 */
exports.obtenerConTimeline = async (id) => {
  const { rows: solicitud } = await db.query(
    `SELECT id, numero, plan, nombre, email, estado, created_at, updated_at
     FROM solicitudes_desbaneo
     WHERE id = $1`,
    [id]
  );
  if (!solicitud.length) return null;

  const { rows: timeline } = await db.query(
    `SELECT estado, nota, created_at
     FROM estados_desbaneo
     WHERE solicitud_id = $1
     ORDER BY created_at ASC`,
    [id]
  );

  return { ...solicitud[0], timeline };
};

/**
 * Obtiene casos por email del cliente
 */
exports.obtenerPorEmail = async (email) => {
  const { rows } = await db.query(
    `SELECT id, numero, plan, estado, created_at
     FROM solicitudes_desbaneo
     WHERE LOWER(email) = LOWER($1)
     ORDER BY created_at DESC
     LIMIT 20`,
    [email]
  );
  return rows;
};

/**
 * Inserta un nuevo registro en el historial de estados
 */
exports.insertarEstado = async (solicitudId, estado, nota = null) => {
  const { rows } = await db.query(
    `INSERT INTO estados_desbaneo (solicitud_id, estado, nota, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [solicitudId, estado, nota]
  );
  return rows[0];
};