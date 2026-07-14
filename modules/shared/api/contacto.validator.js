/**
 * Contacto Validator
 * Validación de formulario de contacto
 */

import { createValidationError, validateEmail, validateRequired } from './_lib/errors.js';

/**
 * Validar datos de contacto
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function validateContacto(req, res, next) {
  try {
    const { nombre, email, asunto, mensaje } = req.body;
    const errors = {};

    // Validar nombre
    try {
      validateRequired(nombre, 'nombre');
      if (nombre.length < 2 || nombre.length > 100) {
        throw new Error('El nombre debe tener entre 2 y 100 caracteres');
      }
    } catch (error) {
      errors.nombre = error.message;
    }

    // Validar email
    try {
      validateRequired(email, 'email');
      validateEmail(email);
    } catch (error) {
      errors.email = error.message;
    }

    // Validar asunto
    try {
      validateRequired(asunto, 'asunto');
      if (asunto.length < 5 || asunto.length > 200) {
        throw new Error('El asunto debe tener entre 5 y 200 caracteres');
      }
    } catch (error) {
      errors.asunto = error.message;
    }

    // Validar mensaje
    try {
      validateRequired(mensaje, 'mensaje');
      if (mensaje.length < 10 || mensaje.length > 2000) {
        throw new Error('El mensaje debe tener entre 10 y 2000 caracteres');
      }
    } catch (error) {
      errors.mensaje = error.message;
    }

    // Validar teléfono si existe
    if (req.body.telefono) {
      const phoneRegex = /^\+?[0-9\s]{10,15}$/;
      if (!phoneRegex.test(req.body.telefono)) {
        errors.telefono = 'Número de teléfono inválido';
      }
    }

    // Validar categoría si existe
    const categoriasValidas = ['general', 'soporte', 'ventas', 'urgente', 'empresas'];
    if (req.body.categoria && !categoriasValidas.includes(req.body.categoria)) {
      errors.categoria = 'Categoría inválida';
    }

    // Si hay errores, lanzar validación
    if (Object.keys(errors).length > 0) {
      throw createValidationError(errors);
    }

    // Sanitizar inputs
    req.body.nombre = nombre.trim();
    req.body.email = email.toLowerCase().trim();
    req.body.asunto = asunto.trim();
    req.body.mensaje = mensaje.trim();
    
    if (req.body.telefono) {
      req.body.telefono = req.body.telefono.trim();
    }

    next();
  } catch (error) {
    next(error);
  }
}

export default {
  validateContacto
};