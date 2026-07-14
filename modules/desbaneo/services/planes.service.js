/**
 * Planes Service
 * Lógica de negocio para manejo de planes
 */

import desbaneoService from './desbaneo.service.js';
import { Storage } from '../utils/storage.js';

class PlanesService {
  constructor() {
    this.storage = new Storage('desbanwa_planes_');
    this.planes = [];
    this.planSeleccionado = null;
  }

  /**
   * Inicializar y cargar planes
   * @returns {Promise<Object>}
   */
  async inicializar() {
    try {
      const response = await desbaneoService.obtenerPlanes();
      
      if (response.success) {
        this.planes = response.data;
        return {
          success: true,
          data: this.planes
        };
      }

      return response;
    } catch (error) {
      console.error('Error en inicializar planes:', error);
      return {
        success: false,
        message: 'Error al cargar los planes'
      };
    }
  }

  /**
   * Obtener todos los planes
   * @returns {Array}
   */
  obtenerPlanes() {
    return this.planes;
  }

  /**
   * Obtener plan por ID
   * @param {string} planId 
   * @returns {Object|null}
   */
  obtenerPlan(planId) {
    return this.planes.find(p => p.id === planId || p.codigo === planId) || null;
  }

  /**
   * Obtener plan popular/recomendado
   * @returns {Object|null}
   */
  obtenerPlanPopular() {
    return this.planes.find(p => p.es_popular) || this.planes[1] || null;
  }

  /**
   * Filtrar planes por categoría
   * @param {string} categoria 
   * @returns {Array}
   */
  filtrarPorCategoria(categoria) {
    if (!categoria || categoria === 'all') {
      return this.planes;
    }
    
    return this.planes.filter(p => p.categoria === categoria);
  }

  /**
   * Ordenar planes
   * @param {string} criterio - 'precio_asc', 'precio_desc', 'popular'
   * @returns {Array}
   */
  ordenarPlanes(criterio = 'precio_asc') {
    let ordenados = [...this.planes];

    switch (criterio) {
      case 'precio_asc':
        ordenados.sort((a, b) => a.precio - b.precio);
        break;
      case 'precio_desc':
        ordenados.sort((a, b) => b.precio - a.precio);
        break;
      case 'popular':
        ordenados.sort((a, b) => (b.es_popular ? 1 : 0) - (a.es_popular ? 1 : 0));
        break;
      default:
        break;
    }

    return ordenados;
  }

  /**
   * Seleccionar plan
   * @param {string} planId 
   * @returns {Object|null}
   */
  seleccionarPlan(planId) {
    const plan = this.obtenerPlan(planId);
    
    if (plan) {
      this.planSeleccionado = plan;
      this.storage.set('plan_seleccionado', {
        id: plan.id,
        codigo: plan.codigo,
        nombre: plan.nombre,
        precio: plan.precio,
        selectedAt: new Date().toISOString()
      });

      return plan;
    }

    return null;
  }

  /**
   * Obtener plan seleccionado
   * @returns {Object|null}
   */
  obtenerPlanSeleccionado() {
    // Primero intentar de memoria
    if (this.planSeleccionado) {
      return this.planSeleccionado;
    }

    // Luego de localStorage
    const stored = this.storage.get('plan_seleccionado');
    if (stored) {
      this.planSeleccionado = this.obtenerPlan(stored.id);
      return this.planSeleccionado;
    }

    return null;
  }

  /**
   * Limpiar plan seleccionado
   */
  limpiarPlanSeleccionado() {
    this.planSeleccionado = null;
    this.storage.remove('plan_seleccionado');
  }

  /**
   * Comparar planes
   * @param {Array} planIds - IDs de planes a comparar
   * @returns {Object}
   */
  compararPlanes(planIds) {
    const planes = planIds.map(id => this.obtenerPlan(id)).filter(Boolean);
    
    if (planes.length === 0) {
      return {
        success: false,
        message: 'No se encontraron los planes especificados'
      };
    }

    const caracteristicas = new Set();
    planes.forEach(plan => {
      plan.caracteristicas.forEach(car => caracteristicas.add(car.nombre));
    });

    return {
      success: true,
      data: {
        planes,
        caracteristicas: Array.from(caracteristicas)
      }
    };
  }

  /**
   * Calcular precio con descuento
   * @param {string} planId 
   * @param {number} descuentoPorcentaje 
   * @returns {Object}
   */
  calcularPrecioConDescuento(planId, descuentoPorcentaje = 0) {
    const plan = this.obtenerPlan(planId);
    
    if (!plan) {
      return {
        success: false,
        message: 'Plan no encontrado'
      };
    }

    const descuento = plan.precio * (descuentoPorcentaje / 100);
    const precioFinal = plan.precio - descuento;

    return {
      success: true,
      data: {
        plan,
        precioOriginal: plan.precio,
        descuento: descuentoPorcentaje,
        montoDescuento: descuento,
        precioFinal: Math.round(precioFinal * 100) / 100
      }
    };
  }

  /**
   * Obtener planes por rango de precio
   * @param {number} min 
   * @param {number} max 
   * @returns {Array}
   */
  obtenerPorRangoPrecio(min, max) {
    return this.planes.filter(p => p.precio >= min && p.precio <= max);
  }

  /**
   * Verificar si un plan tiene garantía
   * @param {string} planId 
   * @returns {boolean}
   */
  tieneGarantia(planId) {
    const plan = this.obtenerPlan(planId);
    return plan ? plan.garantia_devolucion : false;
  }

  /**
   * Obtener tiempo estimado de recuperación por plan
   * @param {string} planId 
   * @returns {Object}
   */
  obtenerTiempoEstimado(planId) {
    const plan = this.obtenerPlan(planId);
    
    if (!plan) {
      return null;
    }

    return {
      respuesta: plan.tiempo_respuesta_horas,
      recuperacionMin: plan.tiempo_estimado_recuperacion_min,
      recuperacionMax: plan.tiempo_estimado_recuperacion_max,
      unidad: 'horas'
    };
  }

  /**
   * Obtener características destacadas de un plan
   * @param {string} planId 
   * @returns {Array}
   */
  obtenerCaracteristicasDestacadas(planId) {
    const plan = this.obtenerPlan(planId);
    
    if (!plan) {
      return [];
    }

    return plan.caracteristicas.filter(car => car.destacado && car.incluido);
  }

  /**
   * Verificar upgrade disponible
   * @param {string} currentPlanId 
   * @returns {Array}
   */
  obtenerUpgradesDisponibles(currentPlanId) {
    const currentPlan = this.obtenerPlan(currentPlanId);
    
    if (!currentPlan) {
      return [];
    }

    return this.planes.filter(p => 
      p.precio > currentPlan.precio && p.activo
    );
  }

  /**
   * Calcular diferencia de precio para upgrade
   * @param {string} fromPlanId 
   * @param {string} toPlanId 
   * @returns {Object}
   */
  calcularDiferenciaUpgrade(fromPlanId, toPlanId) {
    const fromPlan = this.obtenerPlan(fromPlanId);
    const toPlan = this.obtenerPlan(toPlanId);

    if (!fromPlan || !toPlan) {
      return {
        success: false,
        message: 'Plan no encontrado'
      };
    }

    if (toPlan.precio <= fromPlan.precio) {
      return {
        success: false,
        message: 'El plan de destino debe ser de mayor precio'
      };
    }

    const diferencia = toPlan.precio - fromPlan.precio;

    return {
      success: true,
      data: {
        fromPlan,
        toPlan,
        diferencia,
        mensaje: `Upgrade de ${fromPlan.nombre} a ${toPlan.nombre} por $${diferencia} USD`
      }
    };
  }

  /**
   * Obtener planes recomendados según tipo de baneo
   * @param {string} tipoBaneo 
   * @returns {Array}
   */
  obtenerPlanesRecomendados(tipoBaneo) {
    // Mapeo de tipos de baneo a planes recomendados
    const recomendaciones = {
      'temporal': ['pro', 'premium'],
      'permanente': ['premium', 'business'],
      'suspicion': ['premium'],
      'spam': ['premium', 'business'],
      'verification': ['pro'],
      'reports': ['business', 'enterprise']
    };

    const planIds = recomendaciones[tipoBaneo] || ['pro', 'premium'];
    
    return planIds
      .map(id => this.obtenerPlan(id))
      .filter(Boolean);
  }

  /**
   * Exportar planes a JSON
   * @returns {string}
   */
  exportarPlanesJSON() {
    return JSON.stringify(this.planes, null, 2);
  }

  /**
   * Obtener estadísticas de planes
   * @returns {Object}
   */
  obtenerEstadisticas() {
    const totalPlanes = this.planes.length;
    const planesActivos = this.planes.filter(p => p.activo).length;
    const planesPopulares = this.planes.filter(p => p.es_popular).length;
    const precioPromedio = this.planes.reduce((sum, p) => sum + p.precio, 0) / totalPlanes;

    return {
      total: totalPlanes,
      activos: planesActivos,
      populares: planesPopulares,
      precioPromedio: Math.round(precioPromedio * 100) / 100,
      categorias: {
        personal: this.planes.filter(p => p.categoria === 'personal').length,
        business: this.planes.filter(p => p.categoria === 'business').length,
        enterprise: this.planes.filter(p => p.categoria === 'enterprise').length
      }
    };
  }
}

export default new PlanesService();