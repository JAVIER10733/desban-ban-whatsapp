/**
 * Tests — reglas de validación alineadas con solicitud.js (formulario baneo)
 */
'use strict';

const { solicitudPayloadValida } = require('./baneo.fixture.js');

/** Copia de la lógica en pages/solicitud/solicitud.js */
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPhone(v) {
  return /^\d{6,15}$/.test(v.replace(/[\s\-()]/g, ''));
}

describe('solicitud — validaciones', () => {
  test('isValidEmail acepta correos típicos', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('ana@test.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('isValidPhone acepta 6–15 dígitos tras limpiar separadores', () => {
    expect(isValidPhone('5512345678')).toBe(true);
    expect(isValidPhone('55 1234-5678')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });

  test('fixture solicitud cumple campos mínimos de API', () => {
    expect(solicitudPayloadValida.descripcion.length).toBeGreaterThanOrEqual(20);
    expect(solicitudPayloadValida.aceptaAviso).toBe(true);
    expect(['acoso', 'spam', 'estafa', 'suplantacion', 'contenido-ilegal', 'otro']).toContain(
      solicitudPayloadValida.motivo
    );
  });
});
