# API de Desbaneo - Documentación

## 📋 Índice
- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
- [Modelos de Datos](#modelos-de-datos)
- [Códigos de Error](#códigos-de-error)
- [Ejemplos](#ejemplos)

---

## Información General

**Base URL:** `https://api.desbanwa.com/modules/desbaneo/api`  
**Versión:** `v1.0`  
**Formato:** `JSON`  
**Autenticación:** `Bearer Token / API Key`

### Rate Limiting
- **Requests:** 100 por hora por IP
- **Solicitudes:** 10 por día por número de teléfono
- **Upload:** 5MB máximo por request

---

## Autenticación

### API Key (Recomendado para producción)

```http
GET /api/solicitud
Authorization: Bearer YOUR_API_KEY
X-API-Key: your_api_key_here 
