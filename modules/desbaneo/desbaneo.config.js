/**
 * Configuración de Tests para el módulo Desbaneo
 * Configuración de Vitest/Jest y entorno de pruebas
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Configuración general
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    
    // Cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/mocks/**',
        '**/fixtures/**'
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        }
      }
    },
    
    // Configuración de mocks
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporte
    reporters: ['default', 'html'],
    
    // Inclusión/exclusión
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
    exclude: ['tests/**/*.skip.test.js', 'node_modules/**'],
    
    // Alias para imports
    alias: {
      '@': resolve(__dirname, '../'),
      '@services': resolve(__dirname, '../services'),
      '@utils': resolve(__dirname, '../utils'),
      '@config': resolve(__dirname, '../config'),
      '@tests': resolve(__dirname, '../tests')
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, '../'),
      '@services': resolve(__dirname, '../services'),
      '@utils': resolve(__dirname, '../utils'),
      '@config': resolve(__dirname, '../config')
    }
  }
});

// Configuración específica para diferentes entornos
export const testConfig = {
  // Base URL para tests de integración
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  
  // Timeout para tests E2E
  e2eTimeout: 30000,
  
  // Configuración de base de datos de test
  database: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT) || 3307, // Puerto diferente al de prod
    name: process.env.TEST_DB_NAME || 'desbanwa_test',
    user: process.env.TEST_DB_USER || 'test_user',
    password: process.env.TEST_DB_PASSWORD || 'test_password'
  },
  
  // API Keys de test
  apiKeys: {
    test: 'test_api_key_12345',
    invalid: 'invalid_api_key'
  },
  
  // Usuarios de test
  testUsers: {
    admin: {
      email: 'admin@test.com',
      password: 'Admin123!'
    },
    user: {
      email: 'user@test.com',
      password: 'User123!'
    }
  },
  
  // Datos de test
  testData: {
    validPhoneNumber: '+593991234567',
    invalidPhoneNumber: '123',
    validEmail: 'test@email.com',
    invalidEmail: 'invalid-email'
  }
};

// Helper para crear configuración de test
export function createTestConfig(overrides = {}) {
  return {
    ...testConfig,
    ...overrides
  };
}

// Exportar para uso en tests
export const { baseUrl, e2eTimeout, database, apiKeys, testUsers, testData } = testConfig;
