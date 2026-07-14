/**
 * Tests para el servicio de solicitudes
 * Pruebas unitarias para creación y validación de solicitudes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import desbaneoService from '../../services/desbaneo.service.js';
import fixtures, { generators } from '../fixtures/desbaneo.fixture.js';

// Mock de dependencias
vi.mock('../../services/desbaneo.api.js', () => ({
  default: {
    crearSolicitud: vi.fn(),
    consultarEstado: vi.fn(),
    aplicarDescuento: vi.fn()
  }
}));

describe('DesbaneoService - Solicitudes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiar localStorage mock
    localStorage.clear();
  });

  describe('crearSolicitud', () => {
    it('debe crear una solicitud válida exitosamente', async () => {
      // Arrange
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: true,
        data: fixtures.apiResponses.solicitudCreada.data,
        message: 'Solicitud creada exitosamente'
      });

      const solicitudData = fixtures.solicitudes.valida;

      // Act
      const result = await desbaneoService.crearSolicitud(solicitudData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.reference_code).toBeDefined();
      expect(result.data.estado).toBe('pendiente-pago');
      expect(mockApi.default.crearSolicitud).toHaveBeenCalledTimes(1);
    });

    it('debe fallar con datos inválidos', async () => {
      // Arrange
      const solicitudInvalida = fixtures.solicitudes.invalida;

      // Act
      const result = await desbaneoService.crearSolicitud(solicitudInvalida);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('debe formatear correctamente el número de teléfono', async () => {
      // Arrange
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: true,
        data: fixtures.apiResponses.solicitudCreada.data
      });

      const solicitudData = {
        ...fixtures.solicitudes.valida,
        numeroWhatsapp: '593991234567' // Sin el +
      };

      // Act
      await desbaneoService.crearSolicitud(solicitudData);

      // Assert
      const llamadaApi = mockApi.default.crearSolicitud.mock.calls[0][0];
      expect(llamadaApi.numeroWhatsapp).toBe('+593991234567');
    });

    it('debe convertir email a minúsculas', async () => {
      // Arrange
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: true,
        data: fixtures.apiResponses.solicitudCreada.data
      });

      const solicitudData = {
        ...fixtures.solicitudes.valida,
        email: 'JUAN.PEREZ@EMAIL.COM'
      };

      // Act
      await desbaneoService.crearSolicitud(solicitudData);

      // Assert
      const llamadaApi = mockApi.default.crearSolicitud.mock.calls[0][0];
      expect(llamadaApi.email).toBe('juan.perez@email.com');
    });

    it('debe aplicar código de descuento si es válido', async () => {
      // Arrange
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: true,
        data: fixtures.apiResponses.solicitudCreada.data
      });

      const solicitudData = fixtures.solicitudes.conDescuento;

      // Act
      await desbaneoService.crearSolicitud(solicitudData);

      // Assert
      const llamadaApi = mockApi.default.crearSolicitud.mock.calls[0][0];
      expect(llamadaApi.codigoDescuento).toBe('BIENVENIDA15');
    });

    it('debe guardar la solicitud en localStorage', async () => {
      // Arrange
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: true,
        data: fixtures.apiResponses.solicitudCreada.data
      });

      // Act
      await desbaneoService.crearSolicitud(fixtures.solicitudes.valida);

      // Assert
      const ultimaSolicitud = localStorage.getItem('desbanwa_ultima_solicitud');
      expect(ultimaSolicitud).toBeDefined();
      
      const parsed = JSON.parse(ultimaSolicitud);
      expect(parsed.referenceCode).toBe('DSB-20250115-ABC123');
      expect(parsed.plan).toBe('pro');
    });

    it('debe manejar error de API correctamente', async () => {
      // Arrange
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: false,
        message: 'Error del servidor'
      });

      // Act
      const result = await desbaneoService.crearSolicitud(fixtures.solicitudes.valida);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error del servidor');
    });
  });

  describe('validaciones', () => {
    it('debe validar formato de número de WhatsApp', () => {
      const numerosInvalidos = ['123', 'abc', '', '+1'];
      const numerosValidos = ['+593991234567', '+573001234567', '+52155123456789'];

      numerosInvalidos.forEach(numero => {
        const result = desbaneoService.validarNumeroWhatsapp(numero);
        expect(result.valid).toBe(false);
      });

      numerosValidos.forEach(numero => {
        const result = desbaneoService.validarNumeroWhatsapp(numero);
        expect(result.valid).toBe(true);
      });
    });

    it('debe validar formato de email', () => {
      const emailsInvalidos = ['invalido', '@email.com', 'email@', 'email@.com'];
      const emailsValidos = ['test@email.com', 'user.name@domain.co.uk'];

      emailsInvalidos.forEach(email => {
        const result = desbaneoService.validarEmail(email);
        expect(result.valid).toBe(false);
      });

      emailsValidos.forEach(email => {
        const result = desbaneoService.validarEmail(email);
        expect(result.valid).toBe(true);
      });
    });

    it('debe validar campos requeridos', () => {
      const solicitudVacia = {};
      const result = desbaneoService.validarSolicitud(solicitudVacia);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'numero_whatsapp')).toBe(true);
      expect(result.errors.some(e => e.field === 'email')).toBe(true);
      expect(result.errors.some(e => e.field === 'nombre_completo')).toBe(true);
    });
  });

  describe('calcularPrecioFinal', () => {
    it('debe calcular precio sin descuento', () => {
      const precio = desbaneoService.calcularPrecioFinal(39, 0);
      expect(precio).toBe(39);
    });

    it('debe calcular precio con descuento del 10%', () => {
      const precio = desbaneoService.calcularPrecioFinal(39, 10);
      expect(precio).toBe(35.1);
    });

    it('debe calcular precio con descuento del 20%', () => {
      const precio = desbaneoService.calcularPrecioFinal(59, 20);
      expect(precio).toBe(47.2);
    });

    it('debe redondear correctamente', () => {
      const precio = desbaneoService.calcularPrecioFinal(39, 15);
      expect(precio).toBe(33.15);
    });
  });

  describe('obtenerUltimaSolicitud', () => {
    it('debe retornar null si no hay solicitudes', () => {
      localStorage.clear();
      const result = desbaneoService.obtenerUltimaSolicitud();
      expect(result).toBeNull();
    });

    it('debe retornar la última solicitud guardada', () => {
      // Arrange
      const solicitudMock = {
        referenceCode: 'DSB-TEST-123',
        timestamp: new Date().toISOString(),
        plan: 'premium'
      };
      localStorage.setItem('desbanwa_ultima_solicitud', JSON.stringify(solicitudMock));

      // Act
      const result = desbaneoService.obtenerUltimaSolicitud();

      // Assert
      expect(result).toEqual(solicitudMock);
    });
  });

  describe('tieneSolicitudActiva', () => {
    it('debe retornar false si no hay solicitudes', async () => {
      localStorage.clear();
      const result = await desbaneoService.tieneSolicitudActiva('+593991234567');
      expect(result).toBe(false);
    });

    it('debe retornar true si hay solicitud activa', async () => {
      // Arrange
      const solicitudes = [
        {
          numero: '+593991234567',
          estado: 'en-proceso',
          referenceCode: 'DSB-ACTIVA-123'
        }
      ];
      localStorage.setItem('desbanwa_solicitudes', JSON.stringify(solicitudes));

      // Act
      const result = await desbaneoService.tieneSolicitudActiva('+593991234567');

      // Assert
      expect(result).toBe(true);
    });

    it('debe retornar false si la solicitud está completada', async () => {
      // Arrange
      const solicitudes = [
        {
          numero: '+593991234567',
          estado: 'completado-exitoso',
          referenceCode: 'DSB-COMPLETADA-123'
        }
      ];
      localStorage.setItem('desbanwa_solicitudes', JSON.stringify(solicitudes));

      // Act
      const result = await desbaneoService.tieneSolicitudActiva('+593991234567');

      // Assert
      expect(result).toBe(false);
    });
  });
});