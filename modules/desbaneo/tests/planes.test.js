/**
 * Tests para el servicio de planes
 * Pruebas unitarias para manejo de planes y precios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import planesService from '../../services/planes.service.js';
import fixtures from '../fixtures/desbaneo.fixture.js';

// Mock
vi.mock('../../services/desbaneo.service.js', () => ({
  default: {
    obtenerPlanes: vi.fn()
  }
}));

describe('PlanesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    planesService.planes = [];
    planesService.planSeleccionado = null;
  });

  describe('inicializar', () => {
    it('debe cargar planes correctamente', async () => {
      // Arrange
      const mockDesbaneo = await import('../../services/desbaneo.service.js');
      mockDesbaneo.default.obtenerPlanes.mockResolvedValue({
        success: true,
        data: fixtures.planes
      });

      // Act
      const result = await planesService.inicializar();

      // Assert
      expect(result.success).toBe(true);
      expect(planesService.planes.length).toBe(4);
      expect(result.data).toEqual(fixtures.planes);
    });

    it('debe manejar error al cargar planes', async () => {
      // Arrange
      const mockDesbaneo = await import('../../services/desbaneo.service.js');
      mockDesbaneo.default.obtenerPlanes.mockResolvedValue({
        success: false,
        message: 'Error al cargar'
      });

      // Act
      const result = await planesService.inicializar();

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('obtenerPlan', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe encontrar plan por ID', () => {
      const plan = planesService.obtenerPlan('2');
      expect(plan).toBeDefined();
      expect(plan.codigo).toBe('pro');
    });

    it('debe encontrar plan por código', () => {
      const plan = planesService.obtenerPlan('premium');
      expect(plan).toBeDefined();
      expect(plan.nombre).toBe('Premium');
    });

    it('debe retornar null si no existe', () => {
      const plan = planesService.obtenerPlan('inexistente');
      expect(plan).toBeNull();
    });
  });

  describe('obtenerPlanPopular', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe retornar el plan popular', () => {
      const plan = planesService.obtenerPlanPopular();
      expect(plan).toBeDefined();
      expect(plan.es_popular).toBe(true);
      expect(plan.codigo).toBe('premium');
    });
  });

  describe('filtrarPorCategoria', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe filtrar por categoría personal', () => {
      const planes = planesService.filtrarPorCategoria('personal');
      expect(planes.length).toBe(3);
      expect(planes.every(p => p.categoria === 'personal')).toBe(true);
    });

    it('debe filtrar por categoría business', () => {
      const planes = planesService.filtrarPorCategoria('business');
      expect(planes.length).toBe(1);
      expect(planes[0].categoria).toBe('business');
    });

    it('debe retornar todos si categoria es "all"', () => {
      const planes = planesService.filtrarPorCategoria('all');
      expect(planes.length).toBe(4);
    });
  });

  describe('ordenarPlanes', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe ordenar por precio ascendente', () => {
      const ordenados = planesService.ordenarPlanes('precio_asc');
      expect(ordenados[0].precio).toBe(19);
      expect(ordenados[ordenados.length - 1].precio).toBe(99);
    });

    it('debe ordenar por precio descendente', () => {
      const ordenados = planesService.ordenarPlanes('precio_desc');
      expect(ordenados[0].precio).toBe(99);
      expect(ordenados[ordenados.length - 1].precio).toBe(19);
    });

    it('debe poner popular primero', () => {
      const ordenados = planesService.ordenarPlanes('popular');
      expect(ordenados[0].es_popular).toBe(true);
    });
  });

  describe('seleccionarPlan', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe seleccionar un plan válido', () => {
      const plan = planesService.seleccionarPlan('pro');
      
      expect(plan).toBeDefined();
      expect(planesService.planSeleccionado).toBeDefined();
      expect(planesService.planSeleccionado.codigo).toBe('pro');
      
      // Verificar localStorage
      const stored = JSON.parse(localStorage.getItem('desbanwa_planes_plan_seleccionado'));
      expect(stored.codigo).toBe('pro');
    });

    it('debe retornar null para plan inexistente', () => {
      const plan = planesService.seleccionarPlan('inexistente');
      expect(plan).toBeNull();
    });
  });

  describe('calcularPrecioConDescuento', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe calcular precio sin descuento', () => {
      const result = planesService.calcularPrecioConDescuento('pro', 0);
      
      expect(result.success).toBe(true);
      expect(result.data.precioFinal).toBe(39);
      expect(result.data.montoDescuento).toBe(0);
    });

    it('debe calcular precio con 15% de descuento', () => {
      const result = planesService.calcularPrecioConDescuento('premium', 15);
      
      expect(result.success).toBe(true);
      expect(result.data.precioOriginal).toBe(59);
      expect(result.data.montoDescuento).toBe(8.85);
      expect(result.data.precioFinal).toBe(50.15);
    });

    it('debe fallar con plan inexistente', () => {
      const result = planesService.calcularPrecioConDescuento('inexistente', 10);
      
      expect(result.success).toBe(false);
    });
  });

  describe('compararPlanes', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe comparar múltiples planes', () => {
      const result = planesService.compararPlanes(['pro', 'premium']);
      
      expect(result.success).toBe(true);
      expect(result.data.planes.length).toBe(2);
      expect(result.data.caracteristicas.length).toBeGreaterThan(0);
    });

    it('debe fallar con IDs inválidos', () => {
      const result = planesService.compararPlanes(['inexistente1', 'inexistente2']);
      
      expect(result.success).toBe(false);
    });
  });

  describe('obtenerPlanesRecomendados', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe recomendar planes para baneo permanente', () => {
      const planes = planesService.obtenerPlanesRecomendados('permanente');
      
      expect(planes.length).toBeGreaterThan(0);
      expect(planes.some(p => p.codigo === 'premium')).toBe(true);
    });

    it('debe recomendar planes para actividad sospechosa', () => {
      const planes = planesService.obtenerPlanesRecomendados('suspicion');
      
      expect(planes.length).toBeGreaterThan(0);
      expect(planes.some(p => p.codigo === 'premium')).toBe(true);
    });

    it('debe retornar pro y premium por defecto', () => {
      const planes = planesService.obtenerPlanesRecomendados('tipo_inexistente');
      
      expect(planes.length).toBeGreaterThan(0);
    });
  });

  describe('calcularDiferenciaUpgrade', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe calcular diferencia de upgrade', () => {
      const result = planesService.calcularDiferenciaUpgrade('pro', 'premium');
      
      expect(result.success).toBe(true);
      expect(result.data.diferencia).toBe(20);
      expect(result.data.fromPlan.codigo).toBe('pro');
      expect(result.data.toPlan.codigo).toBe('premium');
    });

    it('debe fallar si el plan de destino es más barato', () => {
      const result = planesService.calcularDiferenciaUpgrade('premium', 'pro');
      
      expect(result.success).toBe(false);
    });

    it('debe fallar con planes inexistentes', () => {
      const result = planesService.calcularDiferenciaUpgrade('inexistente', 'premium');
      
      expect(result.success).toBe(false);
    });
  });

  describe('obtenerEstadisticas', () => {
    beforeEach(() => {
      planesService.planes = fixtures.planes;
    });

    it('debe calcular estadísticas correctas', () => {
      const stats = planesService.obtenerEstadisticas();
      
      expect(stats.total).toBe(4);
      expect(stats.activos).toBe(4);
      expect(stats.populares).toBe(1);
      expect(stats.categorias.personal).toBe(3);
      expect(stats.categorias.business).toBe(1);
      expect(typeof stats.precioPromedio).toBe('number');
    });
  });
});