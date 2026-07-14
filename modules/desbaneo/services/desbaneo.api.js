/**
 * Desbaneo API Client
 * Maneja las llamadas a la API REST
 */

import { API_CONFIG } from '../config/api.config.js';
import { handleApiError, ApiResponse } from '../utils/api.utils.js';

class DesbaneoApi {
  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.endpoints = {
      solicitudes: '/desbaneo/solicitudes',
      estado: '/desbaneo/estado',
      planes: '/desbaneo/planes',
      tiposBaneo: '/desbaneo/tipos-baneo',
      estadisticas: '/desbaneo/estadisticas'
    };
  }

  /**
   * Crear nueva solicitud de desbaneo
   * @param {Object} data - Datos de la solicitud
   * @returns {Promise<ApiResponse>}
   */
  async crearSolicitud(data) {
    try {
      const response = await fetch(`${this.baseUrl}${this.endpoints.solicitudes}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          numero_whatsapp: data.numeroWhatsapp,
          tipo_baneo: data.tipoBaneo,
          dias_baneado: data.diasBaneado,
          mensaje_error: data.mensajeError,
          nombre_completo: data.nombreCompleto,
          email: data.email,
          telefono_contacto: data.telefonoContacto,
          pais: data.pais,
          plan_id: data.planId,
          codigo_descuento: data.codigoDescuento,
          utm_source: data.utmSource,
          utm_medium: data.utmMedium,
          utm_campaign: data.utmCampaign
        })
      });

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const result = await response.json();
      return new ApiResponse(true, result.data, result.message);
    } catch (error) {
      return new ApiResponse(false, null, error.message, error);
    }
  }

  /**
   * Consultar estado de solicitud
   * @param {string} referenceCode - Código de referencia
   * @returns {Promise<ApiResponse>}
   */
  async consultarEstado(referenceCode) {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.estado}/${referenceCode}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const result = await response.json();
      return new ApiResponse(true, result.data, result.message);
    } catch (error) {
      return new ApiResponse(false, null, error.message, error);
    }
  }

  /**
   * Obtener lista de planes disponibles
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<ApiResponse>}
   */
  async obtenerPlanes(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.planes}${queryString ? `?${queryString}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const result = await response.json();
      return new ApiResponse(true, result.data, result.message);
    } catch (error) {
      return new ApiResponse(false, null, error.message, error);
    }
  }

  /**
   * Obtener tipos de baneo
   * @returns {Promise<ApiResponse>}
   */
  async obtenerTiposBaneo() {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.tiposBaneo}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const result = await response.json();
      return new ApiResponse(true, result.data, result.message);
    } catch (error) {
      return new ApiResponse(false, null, error.message, error);
    }
  }

  /**
   * Obtener estadísticas del servicio
   * @returns {Promise<ApiResponse>}
   */
  async obtenerEstadisticas() {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.estadisticas}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const result = await response.json();
      return new ApiResponse(true, result.data, result.message);
    } catch (error) {
      return new ApiResponse(false, null, error.message, error);
    }
  }

  /**
   * Aplicar código de descuento
   * @param {string} code - Código de descuento
   * @returns {Promise<ApiResponse>}
   */
  async aplicarDescuento(code) {
    try {
      const response = await fetch(
        `${this.baseUrl}/desbaneo/descuentos/validar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
          },
          body: JSON.stringify({ codigo: code })
        }
      );

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const result = await response.json();
      return new ApiResponse(true, result.data, result.message);
    } catch (error) {
      return new ApiResponse(false, null, error.message, error);
    }
  }

  /**
   * Cancelar solicitud
   * @param {string} referenceCode - Código de referencia
   * @param {string} reason - Motivo de cancelación
   * @returns {Promise<ApiResponse>}
   */
  async cancelarSolicitud(referenceCode, reason) {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.solicitudes}/${referenceCode}/cancelar`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
          },
          body: JSON.stringify({ motivo: reason })
        }
      );

      if (!response.ok) {
        throw await handleApiError(response);
      }

      const result = await response.json();
      return new ApiResponse(true, result.data, result.message);
    } catch (error) {
      return new ApiResponse(false, null, error.message, error);
    }
  }
}

export default new DesbaneoApi();