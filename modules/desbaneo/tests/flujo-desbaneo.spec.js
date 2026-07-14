/**
 * Tests de flujo completo de desbaneo
 * Pruebas de integración que simulan el flujo completo del usuario
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import desbaneoService from '../../services/desbaneo.service.js';
import planesService from '../../services/planes.service.js';
import estadoService from '../../services/estado.service.js';
import fixtures from '../fixtures/desbaneo.fixture.js';

// Mocks
vi.mock('../../services/desbaneo.api.js', () => ({
  default: {
    crearSolicitud: vi.fn(),
    consultarEstado: vi.fn(),
    obtenerPlanes: vi.fn(),
    obtenerTiposBaneo: vi.fn()
  }
}));

describe('Flujo Completo de Desbaneo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Flujo Exitoso - Plan Pro', () => {
    it('debe completar todo el flujo exitosamente', async () => {
      // 1. Usuario llega a la página de planes
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.obtenerPlanes.mockResolvedValue({
        success: true,
        data: fixtures.planes
      });

      // 2. Cargar planes
      await planesService.inicializar();
      expect(planesService.planes.length).toBeGreaterThan(0);

      // 3. Usuario selecciona plan Pro
      const planSeleccionado = planesService.seleccionarPlan('pro');
      expect(planSeleccionado).toBeDefined();
      expect(planSeleccionado.codigo).toBe('pro');

      // 4. Usuario llena formulario
      const solicitudData = {
        ...fixtures.solicitudes.valida,
        plan: 'pro'
      };

      // 5. Crear solicitud
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: true,
        data: fixtures.apiResponses.solicitudCreada.data
      });

      const resultSolicitud = await desbaneoService.crearSolicitud(solicitudData);
      expect(resultSolicitud.success).toBe(true);
      
      const referenceCode = resultSolicitud.data.reference_code;
      expect(referenceCode).toBeDefined();

      // 6. Actualizar estado
      mockApi.default.consultarEstado.mockResolvedValue({
        success: true,
        data: fixtures.apiResponses.estadoSolicitud.data
      });

      const estadoResult = await desbaneoService.consultarEstado(referenceCode);
      expect(estadoResult.success).toBe(true);
      expect(estadoResult.data.estado.nombre).toBe('En Proceso');

      // 7. Guardar estado localmente
      await estadoService.actualizarEstadoSolicitud(referenceCode, estadoResult.data);
      
      const estadoLocal = estadoService.obtenerEstadoSolicitud(referenceCode);
      expect(estadoLocal).toBeDefined();
      expect(estadoLocal.estado.slug).toBe('en-proceso');

      // 8. Verificar que se guardó en localStorage
      const ultimaSolicitud = desbaneoService.obtenerUltimaSolicitud();
      expect(ultimaSolicitud).toBeDefined();
      expect(ultimaSolicitud.referenceCode).toBe(referenceCode);
    });
  });

  describe('Flujo con Descuento', () => {
    it('debe aplicar descuento correctamente', async () => {
      // Setup
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.obtenerPlanes.mockResolvedValue({
        success: true,
        data: fixtures.planes
      });

      await planesService.inicializar();

      // Calcular precio con descuento
      const calculo = planesService.calcularPrecioConDescuento('premium', 15);
      
      expect(calculo.success).toBe(true);
      expect(calculo.data.precioOriginal).toBe(59);
      expect(calculo.data.montoDescuento).toBe(8.85);
      expect(calculo.data.precioFinal).toBe(50.15);

      // Crear solicitud con descuento
      const solicitudData = {
        ...fixtures.solicitudes.conDescuento,
        plan: 'premium'
      };

      mockApi.default.crearSolicitud.mockResolvedValue({
        success: true,
        data: fixtures.apiResponses.solicitudCreada.data
      });

      const result = await desbaneoService.crearSolicitud(solicitudData);
      expect(result.success).toBe(true);

      // Verificar que se envió el código de descuento
      const llamadaApi = mockApi.default.crearSolicitud.mock.calls[0][0];
      expect(llamadaApi.codigoDescuento).toBe('BIENVENIDA15');
    });
  });

  describe('Flujo con Validación de Errores', () => {
    it('debe manejar errores de validación', async () => {
      // Datos inválidos
      const solicitudInvalida = {
        numeroWhatsapp: '123',
        email: 'invalido',
        nombreCompleto: 'A',
        plan: 'pro'
      };

      const result = await desbaneoService.crearSolicitud(solicitudInvalida);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('debe manejar error de API', async () => {
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: false,
        message: 'Error del servidor'
      });

      const result = await desbaneoService.crearSolicitud(fixtures.solicitudes.valida);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Error del servidor');
    });
  });

  describe('Flujo de Upgrade de Plan', () => {
    it('debe permitir upgrade de plan', async () => {
      // Setup
      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.obtenerPlanes.mockResolvedValue({
        success: true,
        data: fixtures.planes
      });

      await planesService.inicializar();

      // Usuario tiene plan Pro y quiere upgrade a Premium
      const upgrade = planesService.calcularDiferenciaUpgrade('pro', 'premium');
      
      expect(upgrade.success).toBe(true);
      expect(upgrade.data.diferencia).toBe(20);
      expect(upgrade.data.fromPlan.codigo).toBe('pro');
      expect(upgrade.data.toPlan.codigo).toBe('premium');
    });
  });

  describe('Flujo de Consulta de Estado', () => {
    it('debe consultar estado correctamente', async () => {
      const mockApi = await import('../../services/desbaneo.api.js');
      
      mockApi.default.consultarEstado.mockResolvedValue({
        success: true,
        data: {
          reference_code: 'DSB-TEST-ESTADO',
          estado: fixtures.estados.completadoExitoso,
          timeline: [
            { estado: 'En Proceso', fecha: '2025-01-15T10:00:00Z' },
            { estado: 'Completado', fecha: '2025-01-15T14:00:00Z' }
          ]
        }
      });

      const result = await desbaneoService.consultarEstado('DSB-TEST-ESTADO');
      
      expect(result.success).toBe(true);
      expect(result.data.estado.slug).toBe('completado-exitoso');
      expect(result.data.timeline.length).toBeGreaterThan(0);
    });
  });

  describe('Flujo con Polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      estadoService.detenerTodosLosPolling();
    });

    it('debe actualizar estado automáticamente con polling', async () => {
      const referenceCode = 'DSB-POLL-FLOW';
      let callCount = 0;

      const mockApi = await import('../../services/desbaneo.api.js');
      
      mockApi.default.consultarEstado.mockImplementation(() => {
        callCount++;
        
        if (callCount === 1) {
          return Promise.resolve({
            success: true,
            data: { 
              estado: fixtures.estados.enProceso,
              es_final: false
            }
          });
        } else {
          return Promise.resolve({
            success: true,
            data: { 
              estado: fixtures.estados.completadoExitoso,
              es_final: true
            }
          });
        }
      });

      // Suscribirse a cambios
      const estadosRecibidos = [];
      estadoService.subscribe(`solicitud_${referenceCode}`, (estado) => {
        estadosRecibidos.push(estado);
      });

      // Iniciar polling
      estadoService.iniciarPolling(
        referenceCode,
        mockApi.default.consultarEstado,
        100
      );

      // Avanzar tiempo
      await vi.advanceTimersByTimeAsync(300);

      // Verificar que se recibieron actualizaciones
      expect(estadosRecibidos.length).toBeGreaterThan(0);
      expect(mockApi.default.consultarEstado).toHaveBeenCalledTimes(2);
    });
  });

  describe('Flujo Empresarial - Plan Enterprise', () => {
    it('debe manejar solicitud enterprise correctamente', async () => {
      const mockApi = await import('../../services/desbaneo.api.js');
      
      mockApi.default.obtenerPlanes.mockResolvedValue({
        success: true,
        data: [
          ...fixtures.planes,
          {
            id: '5',
            codigo: 'enterprise',
            nombre: 'Enterprise',
            precio: 199,
            categoria: 'enterprise'
          }
        ]
      });

      await planesService.inicializar();

      // Seleccionar plan enterprise
      const plan = planesService.seleccionarPlan('enterprise');
      expect(plan).toBeDefined();
      expect(plan.categoria).toBe('enterprise');

      // Crear solicitud enterprise
      const solicitudData = fixtures.solicitudes.enterprise;
      
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: true,
        data: {
          ...fixtures.apiResponses.solicitudCreada.data,
          plan: { id: '5', nombre: 'Enterprise', precio: 199 }
        }
      });

      const result = await desbaneoService.crearSolicitud(solicitudData);
      
      expect(result.success).toBe(true);
      expect(result.data.plan.precio).toBe(199);
    });
  });

  describe('Flujo de Recomendación de Plan', () => {
    it('debe recomendar plan según tipo de baneo', async () => {
      await planesService.inicializar();

      // Baneo permanente → recomendar Premium o Business
      const recomendadosPermanente = planesService.obtenerPlanesRecomendados('permanente');
      expect(recomendadosPermanente.length).toBeGreaterThan(0);
      expect(recomendadosPermanente.some(p => p.codigo === 'premium')).toBe(true);

      // Actividad sospechosa → recomendar Premium
      const recomendadosSuspicion = planesService.obtenerPlanesRecomendados('suspicion');
      expect(recomendadosSuspicion.length).toBeGreaterThan(0);
      expect(recomendadosSuspicion.some(p => p.codigo === 'premium')).toBe(true);
    });
  });

  describe('Flujo de Estadísticas y Analytics', () => {
    it('debe trackear eventos correctamente', async () => {
      // Mock gtag
      global.gtag = vi.fn();

      const mockApi = await import('../../services/desbaneo.api.js');
      mockApi.default.crearSolicitud.mockResolvedValue({
        success: true,
        data: fixtures.apiResponses.solicitudCreada.data
      });

      // Crear solicitud
      await desbaneoService.crearSolicitud(fixtures.solicitudes.valida);

      // Verificar que se trackeó el evento
      expect(global.gtag).toHaveBeenCalledWith(
        'event',
        'solicitud_creada',
        expect.objectContaining({
          event_category: 'Desbaneo',
          plan: 'pro'
        })
      );
    });
  });
});