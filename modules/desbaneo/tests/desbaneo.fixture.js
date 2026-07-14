/**
 * Desbaneo Test Fixtures
 * Datos de prueba reutilizables para tests
 */

export const fixtures = {
  // Solicitudes de prueba
  solicitudes: {
    valida: {
      numeroWhatsapp: '+593991234567',
      tipoBaneo: 'permanente',
      diasBaneado: 5,
      mensajeError: 'Tu número de teléfono está baneado de WhatsApp',
      nombreCompleto: 'Juan Pérez García',
      email: 'juan.perez@email.com',
      telefonoContacto: '+593991234568',
      pais: 'EC',
      plan: 'pro',
      codigoDescuento: null
    },

    conDescuento: {
      numeroWhatsapp: '+593991234567',
      tipoBaneo: 'temporal',
      diasBaneado: 2,
      mensajeError: 'Tu cuenta está temporalmente suspendida',
      nombreCompleto: 'María López',
      email: 'maria.lopez@email.com',
      telefonoContacto: null,
      pais: 'EC',
      plan: 'premium',
      codigoDescuento: 'BIENVENIDA15'
    },

    invalida: {
      numeroWhatsapp: '123',
      tipoBaneo: '',
      nombreCompleto: 'A',
      email: 'email-invalido'
    },

    enterprise: {
      numeroWhatsapp: '+52155123456789',
      tipoBaneo: 'reports',
      diasBaneado: 45,
      mensajeError: 'Tu cuenta ha sido baneada por múltiples denuncias',
      nombreCompleto: 'Empresa SAS',
      email: 'contacto@empresa.com',
      telefonoContacto: '+52155123456789',
      pais: 'MX',
      plan: 'enterprise',
      codigoDescuento: null
    }
  },

  // Planes de prueba
  planes: [
    {
      id: '1',
      codigo: 'basico',
      nombre: 'Básico',
      categoria: 'personal',
      precio: 19,
      moneda: 'USD',
      tiempo_respuesta_horas: 48,
      garantia_devolucion: false,
      activo: true,
      caracteristicas: [
        { nombre: 'Diagnóstico básico', incluido: true, destacado: false },
        { nombre: '1 número WhatsApp', incluido: true, destacado: false }
      ]
    },
    {
      id: '2',
      codigo: 'pro',
      nombre: 'Pro',
      categoria: 'personal',
      precio: 39,
      moneda: 'USD',
      tiempo_respuesta_horas: 24,
      garantia_devolucion: true,
      es_popular: false,
      activo: true,
      caracteristicas: [
        { nombre: 'Garantía 100%', incluido: true, destacado: true },
        { nombre: 'Respuesta en 24h', incluido: true, destacado: false },
        { nombre: '1 reintento', incluido: true, destacado: false }
      ]
    },
    {
      id: '3',
      codigo: 'premium',
      nombre: 'Premium',
      categoria: 'personal',
      precio: 59,
      moneda: 'USD',
      tiempo_respuesta_horas: 12,
      garantia_devolucion: true,
      es_popular: true,
      activo: true,
      caracteristicas: [
        { nombre: 'Garantía express', incluido: true, destacado: true },
        { nombre: 'Soporte 24/7', incluido: true, destacado: true },
        { nombre: '3 reintentos', incluido: true, destacado: true }
      ]
    },
    {
      id: '4',
      codigo: 'business',
      nombre: 'Business',
      categoria: 'business',
      precio: 99,
      moneda: 'USD',
      tiempo_respuesta_horas: 6,
      garantia_devolucion: true,
      activo: true,
      caracteristicas: [
        { nombre: 'Hasta 3 números', incluido: true, destacado: true },
        { nombre: 'Asesor dedicado', incluido: true, destacado: true }
      ]
    }
  ],

  // Tipos de baneo
  tiposBaneo: [
    {
      id: 'temporal',
      nombre: 'Baneo Temporal',
      categoria: 'temporal',
      severidad: 1,
      duracion: { min: 24, max: 168, unidad: 'horas' }
    },
    {
      id: 'permanente',
      nombre: 'Baneo Permanente',
      categoria: 'permanente',
      severidad: 3,
      duracion: { min: null, max: null, unidad: 'indefinido' }
    },
    {
      id: 'suspicion',
      nombre: 'Actividad Sospechosa',
      categoria: 'suspension',
      severidad: 2,
      duracion: { min: 12, max: 48, unidad: 'horas' }
    }
  ],

  // Estados de solicitud
  estados: {
    pendientePago: {
      id: 1,
      nombre: 'Pendiente de Pago',
      slug: 'pendiente-pago',
      es_final: false,
      es_exitoso: false
    },
    enProceso: {
      id: 3,
      nombre: 'En Proceso',
      slug: 'en-proceso',
      es_final: false,
      es_exitoso: false
    },
    completadoExitoso: {
      id: 8,
      nombre: 'Completado - Exitoso',
      slug: 'completado-exitoso',
      es_final: true,
      es_exitoso: true
    },
    fallido: {
      id: 9,
      nombre: 'Fallido - No Recuperable',
      slug: 'fallido-no-recuperable',
      es_final: true,
      es_exitoso: false
    }
  },

  // Respuestas de API mock
  apiResponses: {
    solicitudCreada: {
      success: true,
      data: {
        id: 1234,
        reference_code: 'DSB-20250115-ABC123',
        estado: 'pendiente-pago',
        plan: {
          id: '2',
          nombre: 'Pro',
          precio: 39
        },
        pago: {
          url: 'https://checkout.stripe.com/pay/cs_test_...',
          expires_at: '2025-01-15T23:59:59Z'
        }
      },
      message: 'Solicitud creada exitosamente'
    },

    estadoSolicitud: {
      success: true,
      data: {
        reference_code: 'DSB-20250115-ABC123',
        estado: {
          id: 3,
          nombre: 'En Proceso',
          slug: 'en-proceso',
          color: '#25D366',
          icono: '⚡'
        },
        numero_whatsapp: '+593991234567',
        plan: {
          nombre: 'Pro',
          tiempo_respuesta: '24 horas'
        },
        timeline: [
          {
            estado: 'Pagado - En Cola',
            fecha: '2025-01-15T11:00:00Z',
            notas: 'Pago confirmado'
          },
          {
            estado: 'En Proceso',
            fecha: '2025-01-15T14:30:00Z',
            notas: 'Asignado a especialista Carlos M.'
          }
        ],
        tiempo_transcurrido: {
          horas: 4,
          minutos: 30
        }
      }
    },

    planesDisponibles: {
      success: true,
      data: [
        {
          id: '2',
          codigo: 'pro',
          nombre: 'Pro',
          precio: 39,
          activo: true
        },
        {
          id: '3',
          codigo: 'premium',
          nombre: 'Premium',
          precio: 59,
          activo: true,
          es_popular: true
        }
      ]
    },

    error: {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: [
          {
            field: 'numero_whatsapp',
            message: 'El número debe incluir el código de país con +'
          }
        ]
      }
    }
  },

  // Códigos de descuento válidos
  descuentos: {
    validos: [
      { code: 'DESCUENTO10', percentage: 10 },
      { code: 'BIENVENIDA15', percentage: 15 },
      { code: 'VIP20', percentage: 20 }
    ],
    invalidos: [
      'CODIGO_INVALIDO',
      'EXPIRADO',
      ''
    ]
  },

  // Usuarios de prueba
  usuarios: {
    normal: {
      nombre: 'Juan Pérez',
      email: 'juan.perez@email.com',
      pais: 'EC'
    },
    enterprise: {
      nombre: 'Empresa SAS',
      email: 'contacto@empresa.com',
      pais: 'CO'
    }
  }
};

// Helpers para generar datos dinámicos
export const generators = {
  generateNumeroWhatsapp: () => {
    const prefixos = ['+593', '+57', '+52', '+54', '+56'];
    const prefix = prefixos[Math.floor(Math.random() * prefixos.length)];
    const numero = Math.floor(Math.random() * 900000000) + 100000000;
    return `${prefix}${numero}`;
  },

  generateReferenceCode: () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DSB-${timestamp}-${random}`;
  },

  generateEmail: () => {
    const domains = ['email.com', 'test.com', 'demo.com'];
    const random = Math.random().toString(36).substring(2, 8);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `user${random}@${domain}`;
  },

  generateSolicitud: (overrides = {}) => {
    return {
      ...fixtures.solicitudes.valida,
      numeroWhatsapp: generators.generateNumeroWhatsapp(),
      email: generators.generateEmail(),
      ...overrides
    };
  }
};

export default fixtures;