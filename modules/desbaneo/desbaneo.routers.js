/**
 * Configuración de Routers para Tests
 * Setup de routers mock para testing de integración
 */

import { Router } from 'express';
import { vi } from 'vitest';

// Mock de servicios
export const mockServices = {
  desbaneoService: {
    crearSolicitud: vi.fn(),
    consultarEstado: vi.fn(),
    obtenerPlanes: vi.fn(),
    obtenerTiposBaneo: vi.fn(),
    aplicarDescuento: vi.fn(),
    cancelarSolicitud: vi.fn()
  },
  
  planesService: {
    inicializar: vi.fn(),
    obtenerPlanes: vi.fn(),
    obtenerPlan: vi.fn(),
    seleccionarPlan: vi.fn(),
    calcularPrecioConDescuento: vi.fn()
  },
  
  estadoService: {
    actualizarEstadoSolicitud: vi.fn(),
    obtenerEstadoSolicitud: vi.fn(),
    obtenerListaSolicitudes: vi.fn(),
    iniciarPolling: vi.fn(),
    detenerPolling: vi.fn()
  },
  
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    validateToken: vi.fn()
  },
  
  pagoService: {
    crearPago: vi.fn(),
    confirmarPago: vi.fn(),
    reembolsar: vi.fn()
  }
};

// Crear router de test para desbaneo
export function createDesbaneoRouter() {
  const router = Router();

  // Middleware de logging para tests
  router.use((req, res, next) => {
    console.log(`[TEST] ${req.method} ${req.path}`);
    next();
  });

  // Middleware de autenticación mock
  router.use('/api/desbaneo/*', (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token de autenticación requerido'
        }
      });
    }

    // Mock de usuario autenticado
    req.user = {
      id: 'test-user-123',
      email: 'test@desbanwa.com',
      role: 'user'
    };

    next();
  });

  // Routes de solicitudes
  router.post('/api/desbaneo/solicitudes', async (req, res) => {
    try {
      const result = await mockServices.desbaneoService.crearSolicitud(req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  router.get('/api/desbaneo/solicitudes/:referenceCode', async (req, res) => {
    try {
      const { referenceCode } = req.params;
      const result = await mockServices.desbaneoService.consultarEstado(referenceCode);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  router.delete('/api/desbaneo/solicitudes/:referenceCode/cancelar', async (req, res) => {
    try {
      const { referenceCode } = req.params;
      const { motivo } = req.body;
      
      const result = await mockServices.desbaneoService.cancelarSolicitud(referenceCode, motivo);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  // Routes de planes
  router.get('/api/desbaneo/planes', async (req, res) => {
    try {
      const result = await mockServices.planesService.obtenerPlanes(req.query);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  router.get('/api/desbaneo/planes/:planId', async (req, res) => {
    try {
      const { planId } = req.params;
      const plan = mockServices.planesService.obtenerPlan(planId);
      
      if (plan) {
        res.json({
          success: true,
          data: plan
        });
      } else {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Plan no encontrado'
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  // Routes de tipos de baneo
  router.get('/api/desbaneo/tipos-baneo', async (req, res) => {
    try {
      const result = await mockServices.desbaneoService.obtenerTiposBaneo();
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  // Route de descuentos
  router.post('/api/desbaneo/descuentos/validar', async (req, res) => {
    try {
      const { codigo } = req.body;
      const result = await mockServices.desbaneoService.aplicarDescuento(codigo);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  // Route de estadísticas
  router.get('/api/desbaneo/estadisticas', async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          totalCasosResueltos: 5234,
          tasaExito: 94,
          tiempoPromedioRecuperacion: 18,
          satisfaccionClientes: 4.9
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  return router;
}

// Crear router de test para pagos
export function createPagoRouter() {
  const router = Router();

  router.post('/api/pagos/crear', async (req, res) => {
    try {
      const result = await mockServices.pagoService.crearPago(req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  router.post('/api/pagos/webhook', async (req, res) => {
    try {
      // Simular webhook de Stripe/PayPal
      const { event_type, data } = req.body;
      
      if (event_type === 'payment_intent.succeeded') {
        await mockServices.pagoService.confirmarPago(data.object.id);
      }
      
      res.json({ received: true });
    } catch (error) {
      res.status(500).json({
        error: error.message
      });
    }
  });

  router.post('/api/pagos/:pagoId/reembolsar', async (req, res) => {
    try {
      const { pagoId } = req.params;
      const result = await mockServices.pagoService.reembolsar(pagoId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  return router;
}

// Crear router de test para autenticación
export function createAuthRouter() {
  const router = Router();

  router.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validación básica para tests
      if (email === 'test@desbanwa.com' && password === 'Test123!') {
        const result = await mockServices.authService.login({ email, password });
        res.json(result);
      } else {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Credenciales inválidas'
          }
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  router.post('/api/auth/register', async (req, res) => {
    try {
      const result = await mockServices.authService.register(req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      });
    }
  });

  return router;
}

// Exportar todos los routers
export const routers = {
  desbaneo: createDesbaneoRouter(),
  pago: createPagoRouter(),
  auth: createAuthRouter()
};


export default routers;
