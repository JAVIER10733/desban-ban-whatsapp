# Base de datos — Módulo Baneo

Documentación del esquema de base de datos del módulo de baneo. Motor: **PostgreSQL** en **Supabase**.

---

## Diagrama ER

```
solicitudes_baneo
       │
       │ 1:N
       ▼
estados_baneo

planes_baneo  (tabla independiente, referenciada por slug en solicitudes_baneo)
```

---

## Tablas

### solicitudes_baneo

Tabla principal. Almacena cada solicitud de baneo.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único generado automáticamente |
| `caso_numero` | VARCHAR GENERATED | Número público `BAN-xxxxxx` generado del ID |
| `numero` | VARCHAR(20) | Número de WhatsApp a reportar |
| `prefijo_pais` | VARCHAR(6) | Código de país (`+52`, `+57`, etc.) |
| `motivo` | ENUM | `acoso` · `spam` · `estafa` · `suplantacion` · `contenido-ilegal` · `otro` |
| `otro_motivo` | TEXT | Descripción si motivo es `otro` |
| `descripcion` | TEXT | Descripción detallada del problema |
| `plan` | ENUM | Plan contratado |
| `nombre` | VARCHAR(100) | Nombre del solicitante |
| `email` | VARCHAR(255) | Correo del solicitante |
| `whatsapp_contacto` | VARCHAR(25) | WhatsApp del solicitante (opcional) |
| `pref_contacto` | VARCHAR(20) | `email` · `whatsapp` · `ambos` |
| `acepta_aviso` | BOOLEAN | Aceptó el aviso legal |
| `estado` | ENUM | Estado actual del caso |
| `payment_intent_id` | VARCHAR(100) | ID del PaymentIntent de Stripe |
| `pago_completado` | BOOLEAN | Si el pago fue confirmado por Stripe |
| `monto_pagado` | DECIMAL(8,2) | Monto cobrado en USD |
| `ip_origen` | VARCHAR(45) | IP del solicitante |
| `asesor_id` | UUID | ID del asesor asignado (nullable) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización (auto por trigger) |

**Índices:**

```sql
idx_solicitudes_baneo_email    -- búsqueda por email
idx_solicitudes_baneo_estado   -- filtrado por estado
idx_solicitudes_baneo_numero   -- búsqueda por número reportado
idx_solicitudes_baneo_created  -- ordenamiento por fecha
idx_solicitudes_baneo_motivo   -- estadísticas por motivo
idx_solicitudes_baneo_payment  -- lookup por payment_intent_id
```

---

### estados_baneo

Historial inmutable de cambios de estado. Cada fila es un evento.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `solicitud_id` | UUID FK | Referencia a `solicitudes_baneo.id` |
| `estado` | ENUM | Estado registrado |
| `nota` | TEXT | Nota interna o mensaje para el usuario |
| `es_publico` | BOOLEAN | Si el usuario puede ver este estado |
| `creado_por` | VARCHAR(50) | `sistema` · `asesor` · `webhook` |
| `created_at` | TIMESTAMPTZ | Fecha del cambio |

**Regla:** nunca se actualiza ni se borra. Solo INSERT.

---

### planes_baneo

Catálogo de planes disponibles. Configurable desde Supabase sin tocar código.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID PK | Identificador único |
| `slug` | ENUM UNIQUE | Clave del plan (`pro`, `basico`, etc.) |
| `nombre` | VARCHAR(50) | Nombre público |
| `tipo` | VARCHAR(20) | `personal` o `business` |
| `precio_usd` | DECIMAL(8,2) | Precio en USD |
| `descripcion` | VARCHAR(200) | Descripción corta |
| `tiempo_respuesta` | VARCHAR(20) | `24h`, `72h`, etc. |
| `numeros_incluidos` | INTEGER | Cuántos números incluye el plan |
| `incluye_garantia` | BOOLEAN | Si tiene garantía de devolución |
| `es_popular` | BOOLEAN | Para mostrar el badge |
| `badge_texto` | VARCHAR(30) | Texto del badge (`Más elegido`) |
| `features` | JSONB | Array de características incluidas |
| `no_incluye` | JSONB | Array de características no incluidas |
| `activo` | BOOLEAN | Si el plan está disponible |
| `orden` | INTEGER | Orden de aparición en el frontend |

---

## Vistas

### v_solicitudes_baneo_resumen

Vista que une `solicitudes_baneo` con el último estado y el total de cambios.

```sql
SELECT * FROM v_solicitudes_baneo_resumen
WHERE email = 'usuario@email.com';
```

---

## Funciones

### cambiar_estado_baneo()

Cambia el estado de una solicitud y registra en el historial en una sola operación atómica.

```sql
SELECT cambiar_estado_baneo(
  'uuid-solicitud',      -- p_solicitud_id
  'reporte_enviado',     -- p_nuevo_estado
  'Reporte enviado a Meta por canales oficiales.',  -- p_nota
  true,                  -- p_es_publico
  'sistema'              -- p_creado_por
);
```

**Uso desde Node.js:**

```js
await db.query(
  'SELECT cambiar_estado_baneo($1, $2, $3, $4, $5)',
  [solicitudId, 'reporte_enviado', nota, true, 'sistema']
);
```

---

## Row Level Security (RLS)

| Tabla | Rol | Permisos |
|-------|-----|----------|
| `solicitudes_baneo` | `service_role` | CRUD completo (Netlify Functions) |
| `solicitudes_baneo` | `authenticated` | SELECT solo de sus propios casos |
| `estados_baneo` | `service_role` | CRUD completo |
| `estados_baneo` | `authenticated` | SELECT solo de estados públicos de sus casos |
| `planes_baneo` | `service_role` | CRUD completo |
| `planes_baneo` | `anon` / `authenticated` | SELECT solo de planes activos |

---

## Orden de ejecución de migraciones

```bash
# En Supabase SQL Editor, ejecutar en este orden:
001_create_solicitudes_baneo.sql
002_create_estados_baneo.sql
003_create_planes_baneo.sql
seed_planes_baneo.sql
```

---

## Conexión desde Netlify Functions

```js
// netlify/functions/_shared/db.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,           // máximo 3 conexiones (límite serverless)
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000
})

exports.db = pool
```

**Variable de entorno en Netlify:**

```
DATABASE_URL = postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Usa la URL del **connection pooler** de Supabase (puerto 6543), no la directa, para soportar el modelo serverless de Netlify Functions.