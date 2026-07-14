/**
 * Tests para el servicio de estado
 * Pruebas unitarias para manejo de estado y subscriptions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import estadoService from '../../services/estado.service.js';
import fixtures from '../fixtures/desbaneo.fixture.js';

describe('EstadoService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    estadoService.listeners.clear();
  });

  describe('subscribe', () => {
    it('debe suscribirse a cambios de estado', () => {
      const callback = vi.fn();
      const unsubscribe = estadoService.subscribe('test-key', callback);

      expect(estadoService.listeners.has('test-key')).toBe(true);
      expect(typeof unsubscribe).toBe('function');
    });

    it('debe permitir desuscribirse', () => {
      const callback = vi.fn();
      const unsubscribe = estadoService.subscribe('test-key', callback);

      unsubscribe();

      expect(estadoService.listeners.get('test-key').has(callback)).toBe(false);
    });

    it('debe notificar a todos los subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      estadoService.subscribe('test-key', callback1);
      estadoService.subscribe('test-key', callback2);

      const testData = { value: 'test' };
      estadoService.notify('test-key', testData);

      expect(callback1).toHaveBeenCalledWith(testData);
      expect(callback2).toHaveBeenCalledWith(testData);
    });
  });

  describe('actualizarEstadoSolicitud', () => {
    it('debe actualizar estado correctamente', async () => {
      const referenceCode = 'DSB-TEST-123';
      const estadoData = {
        estado: fixtures.estados.enProceso,
        numero_whatsapp: '+593991234567'
      };

      const result = await estadoService.actualizarEstadoSolicitud(referenceCode, estadoData);

      expect(result.referenceCode).toBe(referenceCode);
      expect(result.estado).toEqual(fixtures.estados.enProceso);
      expect(result.updatedAt).toBeDefined();
    });

    it('debe notificar a los subscribers', async () => {
      const callback = vi.fn();
      const referenceCode = 'DSB-TEST-456';
      
      estadoService.subscribe(`solicitud_${referenceCode}`, callback);

      await estadoService.actualizarEstadoSolicitud(referenceCode, {
        estado: fixtures.estados.enProceso
      });

      expect(callback).toHaveBeenCalled();
    });

    it('debe actualizar lista de solicitudes', async () => {
      const referenceCode = 'DSB-TEST-789';
      
      await estadoService.actualizarEstadoSolicitud(referenceCode, {
        estado: fixtures.estados.enProceso,
        numero_whatsapp: '+593991234567'
      });

      const lista = estadoService.obtenerListaSolicitudes();
      expect(lista.some(s => s.referenceCode === referenceCode)).toBe(true);
    });
  });

  describe('obtenerEstadoSolicitud', () => {
    it('debe retornar null si no existe', () => {
      const estado = estadoService.obtenerEstadoSolicitud('inexistente');
      expect(estado).toBeNull();
    });

    it('debe retornar estado guardado', async () => {
      const referenceCode = 'DSB-TEST-GET';
      const estadoData = {
        estado: fixtures.estados.completadoExitoso
      };

      await estadoService.actualizarEstadoSolicitud(referenceCode, estadoData);
      
      const estado = estadoService.obtenerEstadoSolicitud(referenceCode);
      
      expect(estado).toBeDefined();
      expect(estado.estado.slug).toBe('completado-exitoso');
    });
  });

  describe('marcarComoVista', () => {
    it('debe marcar solicitud como vista', async () => {
      const referenceCode = 'DSB-TEST-VISTA';
      
      await estadoService.actualizarEstadoSolicitud(referenceCode, {
        estado: fixtures.estados.enProceso
      });

      estadoService.marcarComoVista(referenceCode);

      const estado = estadoService.obtenerEstadoSolicitud(referenceCode);
      expect(estado.vista).toBe(true);
      expect(estado.vistaAt).toBeDefined();
    });
  });

  describe('haySolicitudesSinVista', () => {
    it('debe retornar false si no hay solicitudes', () => {
      expect(estadoService.haySolicitudesSinVista()).toBe(false);
    });

    it('debe retornar true si hay solicitudes sin vista', async () => {
      await estadoService.actualizarEstadoSolicitud('DSB-SIN-VISTA-1', {
        estado: { ...fixtures.estados.enProceso, requiere_accion: true }
      });

      expect(estadoService.haySolicitudesSinVista()).toBe(true);
    });

    it('debe retornar false si todas están vistas', async () => {
      await estadoService.actualizarEstadoSolicitud('DSB-VISTA-1', {
        estado: fixtures.estados.enProceso
      });
      
      estadoService.marcarComoVista('DSB-VISTA-1');

      expect(estadoService.haySolicitudesSinVista()).toBe(false);
    });
  });

  describe('obtenerContadorNotificaciones', () => {
    it('debe retornar 0 si no hay notificaciones', () => {
      expect(estadoService.obtenerContadorNotificaciones()).toBe(0);
    });

    it('debe contar solicitudes que requieren acción', async () => {
      await estadoService.actualizarEstadoSolicitud('DSB-NOTIF-1', {
        estado: { ...fixtures.estados.pendientePago, requiere_accion: true }
      });

      await estadoService.actualizarEstadoSolicitud('DSB-NOTIF-2', {
        estado: { ...fixtures.estados.enProceso, requiere_accion: true }
      });

      expect(estadoService.obtenerContadorNotificaciones()).toBe(2);
    });
  });

  describe('obtenerEstadisticasLocales', () => {
    it('debe calcular estadísticas correctamente', async () => {
      await estadoService.actualizarEstadoSolicitud('DSB-STAT-1', {
        estado: fixtures.estados.completadoExitoso
      });

      await estadoService.actualizarEstadoSolicitud('DSB-STAT-2', {
        estado: fixtures.estados.completadoExitoso
      });

      await estadoService.actualizarEstadoSolicitud('DSB-STAT-3', {
        estado: fixtures.estados.fallido
      });

      await estadoService.actualizarEstadoSolicitud('DSB-STAT-4', {
        estado: fixtures.estados.enProceso
      });

      const stats = estadoService.obtenerEstadisticasLocales();

      expect(stats.total).toBe(4);
      expect(stats.completadas).toBe(2);
      expect(stats.enProceso).toBe(1);
      expect(stats.fallidas).toBe(1);
    });
  });

  describe('exportarDatos', () => {
    it('debe exportar datos en formato correcto', async () => {
      await estadoService.actualizarEstadoSolicitud('DSB-EXP-1', {
        estado: fixtures.estados.completadoExitoso,
        numero_whatsapp: '+593991234567',
        plan: 'pro',
        fecha_solicitud: '2025-01-15T10:00:00Z',
        resultado: 'exitoso'
      });

      const exportData = estadoService.exportarDatos();

      expect(exportData.exportDate).toBeDefined();
      expect(exportData.version).toBe('1.0');
      expect(Array.isArray(exportData.solicitudes)).toBe(true);
      expect(exportData.solicitudes.length).toBeGreaterThan(0);
    });
  });

  describe('importarDatos', () => {
    it('debe importar datos correctamente', () => {
      const datosImportar = {
        solicitudes: [
          {
            referenceCode: 'DSB-IMP-1',
            estado: fixtures.estados.completadoExitoso,
            numero_whatsapp: '+593991234567'
          }
        ]
      };

      const result = estadoService.importarDatos(datosImportar);

      expect(result.success).toBe(true);
      
      const estado = estadoService.obtenerEstadoSolicitud('DSB-IMP-1');
      expect(estado).toBeDefined();
    });

    it('debe fallar con datos inválidos', () => {
      const result = estadoService.importarDatos({ invalid: 'data' });

      expect(result.success).toBe(false);
    });
  });

  describe('limpiarEstadoAntiguo', () => {
    it('debe eliminar estados antiguos', async () => {
      // Crear estado antiguo (más de 30 días)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);
      
      await estadoService.actualizarEstadoSolicitud('DSB-OLD-1', {
        estado: fixtures.estados.enProceso,
        lastCheck: oldDate.getTime()
      });

      // Crear estado reciente
      await estadoService.actualizarEstadoSolicitud('DSB-NEW-1', {
        estado: fixtures.estados.enProceso
      });

      // Limpiar antiguos
      estadoService.limpiarEstadoAntiguo();

      const oldEstado = estadoService.obtenerEstadoSolicitud('DSB-OLD-1');
      const newEstado = estadoService.obtenerEstadoSolicitud('DSB-NEW-1');

      expect(oldEstado).toBeNull();
      expect(newEstado).toBeDefined();
    });
  });

  describe('polling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      estadoService.detenerTodosLosPolling();
    });

    it('debe iniciar polling correctamente', () => {
      const mockApiConsultar = vi.fn().mockResolvedValue({
        success: true,
        data: { estado: fixtures.estados.enProceso }
      });

      const unsubscribe = estadoService.iniciarPolling(
        'DSB-POLL-1',
        mockApiConsultar,
        5000 // 5 segundos
      );

      expect(typeof unsubscribe).toBe('function');
      expect(mockApiConsultar).toHaveBeenCalled();
    });

    it('debe detener polling cuando es estado final', async () => {
      let callCount = 0;
      
      const mockApiConsultar = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            success: true,
            data: { estado: fixtures.estados.enProceso, es_final: false }
          });
        } else {
          return Promise.resolve({
            success: true,
            data: { estado: fixtures.estados.completadoExitoso, es_final: true }
          });
        }
      });

      estadoService.iniciarPolling('DSB-POLL-2', mockApiConsultar, 100);

      // Avanzar tiempo
      await vi.advanceTimersByTimeAsync(300);

      // Debería haberse detenido después del estado final
      expect(callCount).toBe(2);
    });

    it('debe permitir detener polling manualmente', () => {
      const mockApiConsultar = vi.fn().mockResolvedValue({
        success: true,
        data: { estado: fixtures.estados.enProceso }
      });

      const unsubscribe = estadoService.iniciarPolling(
        'DSB-POLL-3',
        mockApiConsultar,
        5000
      );

      unsubscribe();

      // Verificar que se eliminó del mapa
      expect(estadoService.pollingIntervals?.has('DSB-POLL-3')).toBe(false);
    });
  });
});