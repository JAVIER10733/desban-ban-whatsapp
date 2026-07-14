/**
 * Authentication & Authorization Utilities
 * Manejo de JWT, validación de tokens y permisos
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { JWT_CONFIG, BCRYPT_CONFIG } from './constants.js';
import { ApiError } from './errors.js';

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || JWT_CONFIG.EXPIRES_IN;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || JWT_CONFIG.REFRESH_EXPIRES_IN;
  }

  /**
   * Generar token JWT
   * @param {Object} payload - Datos a incluir en el token
   * @returns {string} Token JWT
   */
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'desbanwa-api',
      audience: 'desbanwa-client'
    });
  }

  /**
   * Generar refresh token
   * @param {Object} payload - Datos a incluir
   * @returns {string} Refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn,
      issuer: 'desbanwa-api'
    });
  }

  /**
   * Verificar y decodificar token
   * @param {string} token - Token JWT a verificar
   * @returns {Object} Payload decodificado
   * @throws {ApiError} Si el token es inválido o expiró
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'desbanwa-api',
        audience: 'desbanwa-client'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError('TOKEN_EXPIRED', 'El token ha expirado', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError('INVALID_TOKEN', 'Token inválido', 401);
      }
      throw error;
    }
  }

  /**
   * Verificar refresh token
   * @param {string} token - Refresh token
   * @returns {Object} Payload decodificado
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        issuer: 'desbanwa-api'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError('REFRESH_TOKEN_EXPIRED', 'Refresh token expirado', 401);
      }
      throw new ApiError('INVALID_REFRESH_TOKEN', 'Refresh token inválido', 401);
    }
  }

  /**
   * Hashear contraseña
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<string>} Contraseña hasheada
   */
  async hashPassword(password) {
    const saltRounds = BCRYPT_CONFIG.SALT_ROUNDS;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Comparar contraseña con hash
   * @param {string} password - Contraseña en texto plano
   * @param {string} hash - Hash almacenado
   * @returns {Promise<boolean>} True si coinciden
   */
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Validar fortaleza de contraseña
   * @param {string} password - Contraseña a validar
   * @returns {Object} Resultado de validación
   */
  validatePasswordStrength(password) {
    const errors = [];
    
    if (password.length < BCRYPT_CONFIG.MIN_PASSWORD_LENGTH) {
      errors.push(`Mínimo ${BCRYPT_CONFIG.MIN_PASSWORD_LENGTH} caracteres`);
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Al menos una mayúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Al menos una minúscula');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Al menos un número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Al menos un carácter especial');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      score: this.calculatePasswordScore(password)
    };
  }

  /**
   * Calcular score de fortaleza (0-100)
   * @param {string} password 
   * @returns {number} Score
   */
  calculatePasswordScore(password) {
    let score = 0;
    
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
    if (password.length >= 16) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Extraer token de Authorization header
   * @param {string} authHeader - Header de autorización
   * @returns {string|null} Token o null
   */
  extractToken(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Generar par de tokens (access + refresh)
   * @param {Object} user - Datos del usuario
   * @returns {Object} Tokens generados
   */
  generateTokenPair(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user'
    };

    return {
      accessToken: this.generateToken(payload),
      refreshToken: this.generateRefreshToken({ userId: user.id }),
      expiresIn: this.jwtExpiresIn,
      tokenType: 'Bearer'
    };
  }

  /**
   * Renovar tokens
   * @param {string} refreshToken - Refresh token
   * @param {Function} getUserById - Función para obtener usuario
   * @returns {Promise<Object>} Nuevos tokens
   */
  async refreshTokens(refreshToken, getUserById) {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await getUserById(payload.userId);
    
    if (!user) {
      throw new ApiError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }
    
    if (!user.active) {
      throw new ApiError('USER_INACTIVE', 'Usuario inactivo', 403);
    }
    
    return this.generateTokenPair(user);
  }

  /**
   * Middleware de autenticación para Express
   * @returns {Function} Middleware
   */
  authMiddleware() {
    return async (req, res, next) => {
      try {
        const token = this.extractToken(req.headers.authorization);
        
        if (!token) {
          throw new ApiError('NO_TOKEN', 'No se proporcionó token de autenticación', 401);
        }
        
        const decoded = this.verifyToken(token);
        req.user = decoded;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware de autorización por roles
   * @param {Array<string>} allowedRoles - Roles permitidos
   * @returns {Function} Middleware
   */
  authorizeMiddleware(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new ApiError('UNAUTHORIZED', 'No autenticado', 401));
      }
      
      if (!allowedRoles.includes(req.user.role)) {
        return next(new ApiError('FORBIDDEN', 'No tienes permisos para esta acción', 403));
      }
      
      next();
    };
  }
}

export default new AuthService();