/**
 * Database Connection & Pool Management
 * MySQL/MariaDB connection pool con reconnection automática
 */

import mysql from 'mysql2/promise';
import { DB_CONFIG, isProduction } from './constants.js';
import logger from './logger.js';

class Database {
  constructor() {
    this.pool = null;
    this.config = {
      host: DB_CONFIG.HOST,
      port: DB_CONFIG.PORT,
      user: DB_CONFIG.USER,
      password: DB_CONFIG.PASSWORD,
      database: DB_CONFIG.DATABASE,
      waitForConnections: true,
      connectionLimit: DB_CONFIG.CONNECTION_LIMIT,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: DB_CONFIG.CHARSET,
      timezone: DB_CONFIG.TIMEZONE,
      connectTimeout: DB_CONFIG.TIMEOUT,
      dateStrings: true
    };
    
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 segundos
  }

  /**
   * Inicializar pool de conexiones
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      logger.info('🗄️  Conectando a MySQL...');
      
      this.pool = mysql.createPool(this.config);
      
      // Verificar conexión
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      logger.info('✅ Conexión a MySQL establecida exitosamente');
      this.reconnectAttempts = 0;
      
      // Setup event listeners
      this.pool.on('connection', (conn) => {
        logger.debug('Nueva conexión creada al pool');
        this.setupConnection(conn);
      });
      
      this.pool.on('acquire', (conn) => {
        logger.debug('Conexión adquirida del pool');
      });
      
      this.pool.on('release', (conn) => {
        logger.debug('Conexión liberada al pool');
      });
      
      this.pool.on('error', (err) => {
        logger.error('Error en pool de MySQL:', err);
        this.handlePoolError(err);
      });
      
    } catch (error) {
      logger.error('❌ Error al conectar a MySQL:', error.message);
      await this.reconnect();
    }
  }

  /**
   * Configurar conexión individual
   * @param {Object} connection - MySQL connection
   */
  setupConnection(connection) {
    // Configurar timezone
    connection.query('SET time_zone = "+00:00"').catch(err => {
      logger.warn('No se pudo configurar timezone:', err.message);
    });
    
    // Configurar charset
    connection.query('SET NAMES utf8mb4').catch(err => {
      logger.warn('No se pudo configurar charset:', err.message);
    });
  }

  /**
   * Reintentar conexión
   * @returns {Promise<void>}
   */
  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('❌ Máximo número de reintentos alcanzado. Deteniendo reconexión.');
      process.exit(1);
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    logger.info(`🔄 Reintentando conexión en ${delay/1000}s (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('Reconexión fallida:', error.message);
      }
    }, delay);
  }

  /**
   * Manejar error de pool
   * @param {Error} error 
   */
  handlePoolError(error) {
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      logger.warn('Conexión perdida. Reconectando...');
      this.reconnect();
    } else if (error.code === 'ER_CON_COUNT_ERROR') {
      logger.error('Demasiadas conexiones. Aumentar connection_limit');
    } else if (error.code === 'ECONNREFUSED') {
      logger.error('Servicio MySQL rechazado. Verificar que esté corriendo.');
      this.reconnect();
    } else {
      logger.error('Error desconocido en pool:', error);
    }
  }

  /**
   * Ejecutar query
   * @param {string} sql - SQL query
   * @param {Array} params - Parámetros
   * @returns {Promise<Object>} Resultado
   */
  async query(sql, params = []) {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    const startTime = Date.now();
    
    try {
      const [rows] = await this.pool.execute(sql, params);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) {
        logger.warn(`Query lenta (${duration}ms): ${sql.substring(0, 100)}...`);
      } else {
        logger.debug(`Query ejecutada (${duration}ms): ${sql.substring(0, 100)}...`);
      }
      
      return rows;
    } catch (error) {
      logger.error(`Error en query (${Date.now() - startTime}ms):`, {
        sql: sql.substring(0, 200),
        params,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Ejecutar transacción
   * @param {Function} callback - Función que recibe connection
   * @returns {Promise<any>}
   */
  async transaction(callback) {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      logger.debug('Transacción iniciada');
      
      const result = await callback(connection);
      
      await connection.commit();
      logger.debug('Transacción commit exitoso');
      
      return result;
    } catch (error) {
      await connection.rollback();
      logger.error('Transacción rollback:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener conexión del pool
   * @returns {Promise<Object>} Connection
   */
  async getConnection() {
    return await this.pool.getConnection();
  }

  /**
   * Cerrar pool de conexiones
   * @returns {Promise<void>}
   */
  async close() {
    if (this.pool) {
      logger.info('🔌 Cerrando pool de conexiones...');
      await this.pool.end();
      this.pool = null;
      logger.info('Pool cerrado exitosamente');
    }
  }

  /**
   * Obtener estadísticas del pool
   * @returns {Object}
   */
  getPoolStats() {
    if (!this.pool) {
      return {
        connected: false,
        poolSize: 0,
        activeConnections: 0,
        idleConnections: 0
      };
    }
    
    return {
      connected: true,
      poolSize: this.pool._pool._allConnections.length,
      activeConnections: this.pool._pool._allConnections.filter(c => c._pool).length,
      idleConnections: this.pool._pool._freeConnections.length,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Verificar salud de la base de datos
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const [rows] = await this.pool.execute('SELECT 1 as ping');
      const duration = Date.now() - startTime;
      
      return {
        status: 'healthy',
        database: 'mysql',
        responseTime: `${duration}ms`,
        poolStats: this.getPoolStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'mysql',
        error: error.message
      };
    }
  }
}

// Instancia singleton
const database = new Database();

// Exportar métodos útiles
export const query = database.query.bind(database);
export const transaction = database.transaction.bind(database);
export const getConnection = database.getConnection.bind(database);
export const healthCheck = database.healthCheck.bind(database);

export { database };
export default database;