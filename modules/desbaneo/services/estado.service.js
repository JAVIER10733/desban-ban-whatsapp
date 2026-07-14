/**
 * Estado Service
 * Manejo del estado de las solicitudes y UI
 */

import { Storage } from '../utils/storage.js';

class EstadoService {
  constructor() {
    this.storage = new Storage('desbanwa_estado_');
    this.listeners = new Map();
    this.currentEstado = null;
  }

  /**
   * Suscribirse a cambios de estado
   * @param {string} key - Clave a observar
   * @param {Function} callback 
   * @returns {Function} - Función para desuscribirse
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key).add(callback);

    // Retornar función de unsubscribe
    return () => {
      this.listeners.get(key).delete(callback);
      if (this.listeners.get(key).size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  /**
   * Notificar cambios a los subscribers
   * @param {string} key 
   * @param {any} value 
   */
  notify(key, value) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error en listener de ${key}:`, error);
        }
      });
    }
  }

  /**
   * Actualizar estado de solicitud
   * @param {string} referenceCode 
   * @param {Object} estadoData 
   */
  async actualizarEstadoSolicitud(referenceCode, estadoData) {
    try {
      const key = `solicitud_${referenceCode}`;
      
      const estado = {
        referenceCode,
        ...estadoData,
        updatedAt: new Date().toISOString(),
        lastCheck: Date.now()
      };

      this.storage.set(key, estado);
      this.notify(key, estado);

      // Actualizar lista de solicitudes
      this.actualizarListaSolicitudes(referenceCode, estado);

      return estado;
    } catch (error) {
      console.error('Error en actualizarEstadoSolicitud:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de solicitud
   * @param {string} referenceCode 
   * @returns {Object|null}
   */
  obtenerEstadoSolicitud(referenceCode) {
    const key = `solicitud_${referenceCode}`;
    return this.storage.get(key);
  }

  /**
   * Actualizar lista de solicitudes del usuario
   * @param {string} referenceCode 
   * @param {Object} estado 
   */
  actualizarListaSolicitudes(referenceCode, estado) {
    const lista = this.storage.get('lista_solicitudes') || [];
    
    const index = lista.findIndex(s => s.referenceCode === referenceCode);
    
    if (index >= 0) {
      lista[index] = estado;
    } else {
      lista.push(estado);
    }

    // Ordenar por fecha (más reciente primero)
    lista.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Mantener solo últimas 10 solicitudes
    const listaLimitada = lista.slice(0, 10);
    
    this.storage.set('lista_solicitudes', listaLimitada);
    this.notify('lista_solicitudes', listaLimitada);
  }

  /**
   * Obtener lista de solicitudes
   * @returns {Array}
   */
  obtenerListaSolicitudes() {
    return this.storage.get('lista_solicitudes') || [];
  }

  /**
   * Marcar solicitud como vista
   * @param {string} referenceCode 
   */
  marcarComoVista(referenceCode) {
    const key = `solicitud_${referenceCode}`;
    const estado = this.storage.get(key);
    
    if (estado) {
      estado.vista = true;
      estado.vistaAt = new Date().toISOString();
      this.storage.set(key, estado);
      this.notify(key, estado);
    }
  }

  /**
   * Verificar si hay solicitudes sin vista
   * @returns {boolean}
   */
  haySolicitudesSinVista() {
    const lista = this.obtenerListaSolicitudes();
    return lista.some(s => !s.vista && s.estado.slug !== 'completado-exitoso');
  }

  /**
   * Obtener contador de notificaciones
   * @returns {number}
   */
  obtenerContadorNotificaciones() {
    const lista = this.obtenerListaSolicitudes();
    return lista.filter(s => !s.vista && s.estado.requiere_accion).length;
  }

  /**
   * Limpiar estado antiguo (más de 30 días)
   */
  limpiarEstadoAntiguo() {
    const ahora = Date.now();
    const treintaDias = 30 * 24 * 60 * 60 * 1000; // 30 días en ms

    const keys = Object.keys(localStorage);
    const solicitudesKeys = keys.filter(k => k.startsWith('desbanwa_estado_solicitud_'));

    solicitudesKeys.forEach(key => {
      const data = this.storage.get(key.replace('desbanwa_estado_', ''));
      
      if (data && data.lastCheck) {
        const edad = ahora - data.lastCheck;
        
        if (edad > treintaDias) {
          this.storage.remove(key.replace('desbanwa_estado_', ''));
          console.log(`Estado antiguo eliminado: ${key}`);
        }
      }
    });
  }

  /**
   * Obtener estadísticas locales
   * @returns {Object}
   */
  obtenerEstadisticasLocales() {
    const lista = this.obtenerListaSolicitudes();
    
    return {
      total: lista.length,
      completadas: lista.filter(s => s.estado.es_exitoso).length,
      enProceso: lista.filter(s => !s.estado.es_final).length,
      fallidas: lista.filter(s => s.estado.slug === 'fallido-no-recuperable').length,
      reembolsadas: lista.filter(s => s.estado.slug === 'reembolsado').length
    };
  }

  /**
   * Exportar datos de solicitudes
   * @returns {Object}
   */
  exportarDatos() {
    const lista = this.obtenerListaSolicitudes();
    
    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      solicitudes: lista.map(s => ({
        referenceCode: s.referenceCode,
        numero: s.numero_whatsapp,
        plan: s.plan,
        estado: s.estado.nombre,
        fechaSolicitud: s.fecha_solicitud,
        fechaCompletado: s.fecha_completado,
        resultado: s.resultado
      }))
    };
  }

  /**
   * Importar datos de solicitudes
   * @param {Object} data 
   */
  importarDatos(data) {
    try {
      if (!data.solicitudes || !Array.isArray(data.solicitudes)) {
        throw new Error('Formato de datos inválido');
      }

      data.solicitudes.forEach(solicitud => {
        const key = `solicitud_${solicitud.referenceCode}`;
        this.storage.set(key, solicitud);
      });

      this.notify('lista_solicitudes', data.solicitudes);
      
      return {
        success: true,
        message: `Se importaron ${data.solicitudes.length} solicitudes`
      };
    } catch (error) {
      console.error('Error en importarDatos:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Suscribirse a cambios en tiempo real (polling)
   * @param {string} referenceCode 
   * @param {Function} apiConsultarEstado 
   * @param {number} interval - Intervalo en ms (default: 30000 = 30s)
   */
  iniciarPolling(referenceCode, apiConsultarEstado, interval = 30000) {
    const poll = async () => {
      try {
        const response = await apiConsultarEstado(referenceCode);
        
        if (response.success) {
          await this.actualizarEstadoSolicitud(referenceCode, response.data);
          
          // Si es estado final, detener polling
          if (response.data.estado.es_final) {
            this.detenerPolling(referenceCode);
          }
        }
      } catch (error) {
        console.error('Error en polling:', error);
      }
    };

    // Ejecutar inmediatamente
    poll();

    // Configurar intervalo
    const intervalId = setInterval(poll, interval);
    
    // Guardar reference
    if (!this.pollingIntervals) {
      this.pollingIntervals = new Map();
    }
    
    this.pollingIntervals.set(referenceCode, intervalId);
    
    return () => this.detenerPolling(referenceCode);
  }

  /**
   * Detener polling
   * @param {string} referenceCode 
   */
  detenerPolling(referenceCode) {
    if (this.pollingIntervals && this.pollingIntervals.has(referenceCode)) {
      clearInterval(this.pollingIntervals.get(referenceCode));
      this.pollingIntervals.delete(referenceCode);
    }
  }

  /**
   * Detener todos los polling activos
   */
  detenerTodosLosPolling() {
    if (this.pollingIntervals) {
      this.pollingIntervals.forEach((intervalId, referenceCode) => {
        clearInterval(intervalId);
      });
      this.pollingIntervals.clear();
    }
  }
}

export default new EstadoService();