/**
 * Desbaneo Service
 * Lógica de negocio para el servicio de desbaneo
 */

import desbaneoApi from './desbaneo.api.js';
import { Validator } from '../utils/validator.js';
import { Storage } from '../utils/storage.js';

class DesbaneoService {
  constructor() {
    this.api = desbaneoApi;
    this.storage = new Storage('desbanwa_');
    this.validator = new Validator();
  }

  /**
   * Crear solicitud de desbaneo con validación
   * @param {Object} formData - Datos del formulario
   * @returns {Promise<Object>}
   */
  async crearSolicitud(formData) {
    try {
      // Validar datos
      const validation = this.validator.validateSolicitud(formData);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Preparar datos
      const requestData = {
        numeroWhatsapp: this.formatPhoneNumber(formData.numeroWhatsapp),
        tipoBaneo: formData.tipoBaneo,
        diasBaneado: formData.diasBaneado || null,
        mensajeError: formData.mensajeError || null,
        nombreCompleto: formData.nombreCompleto.trim(),
        email: formData.email.toLowerCase().trim(),
        telefonoContacto: formData.telefonoContacto ? 
          this.formatPhoneNumber(formData.telefonoContacto) : null,
        pais: formData.pais,
        planId: formData.plan,
        codigoDescuento: formData.codigoDescuento || null,
        utmSource: this.getUTMParameter('utm_source'),
        utmMedium: this.getUTMParameter('utm_medium'),
        utmCampaign: this.getUTMParameter('utm_campaign')
      };

      // Llamar a API
      const response = await this.api.crearSolicitud(requestData);

      if (response.success) {
        // Guardar en localStorage
        this.storage.set('ultima_solicitud', {
          referenceCode: response.data.reference_code,
          timestamp: new Date().toISOString(),
          plan: formData.plan
        });

        // Track event
        this.trackEvent('solicitud_creada', {
          plan: formData.plan,
          referenceCode: response.data.reference_code
        });
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Error en crearSolicitud:', error);
      return {
        success: false,
        message: 'Error al crear la solicitud. Inténtalo de nuevo.'
      };
    }
  }

  /**
   * Consultar estado de solicitud
   * @param {string} referenceCode 
   * @returns {Promise<Object>}
   */
  async consultarEstado(referenceCode) {
    try {
      const response = await this.api.consultarEstado(referenceCode);
      
      if (response.success) {
        this.trackEvent('estado_consultado', {
          referenceCode,
          estado: response.data.estado.slug
        });
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Error en consultarEstado:', error);
      return {
        success: false,
        message: 'Error al consultar el estado. Inténtalo de nuevo.'
      };
    }
  }

  /**
   * Obtener planes disponibles
   * @returns {Promise<Object>}
   */
  async obtenerPlanes() {
    try {
      // Intentar obtener de cache primero
      const cached = this.storage.get('planes_cache');
      const cacheTime = this.storage.get('planes_cache_time');
      
      const now = Date.now();
      const cacheValid = cached && cacheTime && (now - cacheTime) < 300000; // 5 minutos

      if (cacheValid) {
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }

      // Si no hay cache o expiró, llamar a API
      const response = await this.api.obtenerPlanes({ activo: true });
      
      if (response.success) {
        // Guardar en cache
        this.storage.set('planes_cache', response.data);
        this.storage.set('planes_cache_time', now);

        return {
          success: true,
          data: response.data,
          fromCache: false
        };
      }

      return {
        success: false,
        message: response.message
      };
    } catch (error) {
      console.error('Error en obtenerPlanes:', error);
      return {
        success: false,
        message: 'Error al obtener los planes.'
      };
    }
  }

  /**
   * Obtener tipos de baneo
   * @returns {Promise<Object>}
   */
  async obtenerTiposBaneo() {
    try {
      const cached = this.storage.get('tipos_baneo_cache');
      
      if (cached) {
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }

      const response = await this.api.obtenerTiposBaneo();
      
      if (response.success) {
        this.storage.set('tipos_baneo_cache', response.data);
        
        return {
          success: true,
          data: response.data,
          fromCache: false
        };
      }

      return {
        success: false,
        message: response.message
      };
    } catch (error) {
      console.error('Error en obtenerTiposBaneo:', error);
      return {
        success: false,
        message: 'Error al obtener los tipos de baneo.'
      };
    }
  }

  /**
   * Aplicar código de descuento
   * @param {string} code 
   * @returns {Promise<Object>}
   */
  async aplicarDescuento(code) {
    try {
      if (!code || code.trim().length === 0) {
        return {
          success: false,
          message: 'Ingresa un código de descuento'
        };
      }

      const response = await this.api.aplicarDescuento(code.toUpperCase());
      
      if (response.success) {
        this.trackEvent('descuento_aplicado', {
          code: code.toUpperCase(),
          descuento: response.data.porcentaje
        });
      }

      return {
        success: response.success,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('Error en aplicarDescuento:', error);
      return {
        success: false,
        message: 'Error al aplicar el descuento.'
      };
    }
  }

  /**
   * Calcular precio final con descuento
   * @param {number} basePrice 
   * @param {number} discountPercentage 
   * @returns {number}
   */
  calcularPrecioFinal(basePrice, discountPercentage = 0) {
    const discount = basePrice * (discountPercentage / 100);
    return basePrice - discount;
  }

  /**
   * Formatear número de teléfono
   * @param {string} phone 
   * @returns {string}
   */
  formatPhoneNumber(phone) {
    // Remover espacios y caracteres especiales
    let cleaned = phone.replace(/\D/g, '');
    
    // Agregar + si no tiene
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Obtener parámetro UTM de la URL
   * @param {string} param 
   * @returns {string|null}
   */
  getUTMParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  /**
   * Track event para analytics
   * @param {string} eventName 
   * @param {Object} data 
   */
  trackEvent(eventName, data = {}) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, {
        event_category: 'Desbaneo',
        ...data
      });
    }
    
    console.log(`[Analytics] ${eventName}:`, data);
  }

  /**
   * Obtener última solicitud del localStorage
   * @returns {Object|null}
   */
  obtenerUltimaSolicitud() {
    return this.storage.get('ultima_solicitud');
  }

  /**
   * Limpiar cache
   */
  limpiarCache() {
    this.storage.remove('planes_cache');
    this.storage.remove('planes_cache_time');
    this.storage.remove('tipos_baneo_cache');
  }

  /**
   * Validar si el número ya tiene una solicitud activa
   * @param {string} phoneNumber 
   * @returns {Promise<boolean>}
   */
  async tieneSolicitudActiva(phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const solicitudes = this.storage.get('solicitudes') || [];
      
      const solicitudActiva = solicitudes.find(s => 
        s.numero === formattedPhone && 
        s.estado !== 'completado' && 
        s.estado !== 'cancelado'
      );

      return !!solicitudActiva;
    } catch (error) {
      console.error('Error en tieneSolicitudActiva:', error);
      return false;
    }
  }
}

export default new DesbaneoService();