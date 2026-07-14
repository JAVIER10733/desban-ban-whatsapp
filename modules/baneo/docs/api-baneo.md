# API — Módulo Baneo

Documentación de los endpoints del módulo de baneo. Todas las rutas son Netlify Functions serverless.

---

## Base URL

```
Producción:  https://desbanwa.com/api/baneo
Desarrollo:  http://localhost:3000/api/baneo
```

## Autenticación

Los endpoints públicos no requieren token. Los endpoints de administración requieren el header:

```
Authorization: Bearer <ADMIN_TOKEN>
```

El `ADMIN_TOKEN` se configura en las variables de entorno de Netlify.

---

## Endpoints

### POST /api/baneo/solicitud

Crea una nueva solicitud de baneo.

**Rate limit:** 5 solicitudes por IP cada hora.

**Body:**

```json
{
  "numero":        "+52 55 1234 5678",
  "motivo":        "acoso",
  "descripcion":   "Descripción del problema (mínimo 20 caracteres)",
  "plan":          "pro",
  "nombre":        "Ana López",
  "email":         "ana@email.com",
  "aceptaAviso":   true,
  "prefContacto":  "email",
  "otroMotivo":    null
}
```

**Campos obligatorios:** `numero`, `motivo`, `descripcion`, `plan`, `nombre`, `email`, `aceptaAviso`

**Valores válidos — motivo:** `acoso` · `spam` · `estafa` · `suplantacion` · `contenido-ilegal` · `otro`

**Valores válidos — plan:** `basico` · `pro` · `enterprise` · `business` · `business-pro`

**Respuesta 201:**

```json
{
  "success": true,
  "data": {
    "id":             "uuid-del-caso",
    "payment_intent": "pi_stripe_client_secret",
    "caso_numero":    "BAN-abc123",
    "estado":         "pendiente_pago"
  }
}
```

**Errores posibles:**

| Código | Causa |
|--------|-------|
| 400 | JSON inválido |
| 422 | Validación fallida (ver campo `errors`) |
| 429 | Rate limit superado |
| 500 | Error interno del servidor |

---

### GET /api/baneo/estado

Consulta el estado de una solicitud o todos los casos de un email.

**Rate limit:** 30 solicitudes por IP cada minuto.

**Query params:**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `id`    | string | ID o número de caso (`BAN-abc123`) |
| `email` | string | Email del solicitante |

Se requiere uno de los dos. Si se envían ambos, `id` tiene prioridad.

**Ejemplo — por ID:**

```
GET /api/baneo/estado?id=BAN-abc123
```

**Respuesta 200 — por ID:**

```json
{
  "success": true,
  "data": {
    "id":           "BAN-abc123",
    "numero":       "+52 55 ···· 5678",
    "plan":         "Pro",
    "estado":       "reporte_enviado",
    "fecha_inicio": "19 mar 2025",
    "progreso":     3,
    "timeline": [
      {
        "estado":    "pendiente_pago",
        "titulo":    "Solicitud recibida",
        "desc":      "Tu solicitud fue registrada correctamente.",
        "tiempo":    "Hace 2 días"
      },
      {
        "estado":    "en_revision",
        "titulo":    "Revisión del caso",
        "desc":      "Reporte verificado como legítimo.",
        "tiempo":    "Hace 1 día"
      },
      {
        "estado":    "reporte_enviado",
        "titulo":    "Reporte enviado a Meta",
        "desc":      "Reporte formal enviado por canales oficiales.",
        "tiempo":    "Hace 6 horas"
      }
    ]
  }
}
```

**Respuesta 200 — por email:**

```json
{
  "success": true,
  "data": [
    {
      "id":     "BAN-abc123",
      "numero": "+52 55 ···· 5678",
      "plan":   "Pro",
      "estado": "reporte_enviado",
      "fecha":  "19 mar 2025"
    }
  ]
}
```

**Errores posibles:**

| Código | Causa |
|--------|-------|
| 400 | Falta `id` o `email` |
| 404 | Caso no encontrado |
| 429 | Rate limit superado |

---

### GET /api/baneo/planes

Obtiene los planes disponibles del módulo de baneo.

**Rate limit:** 60 solicitudes por IP cada minuto. Sin autenticación requerida.

**Query params:**

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `tipo` | string | `personal` | `personal` o `business` |

**Ejemplo:**

```
GET /api/baneo/planes?tipo=personal
```

**Respuesta 200:**

```json
{
  "success": true,
  "data": [
    {
      "id":          "uuid",
      "slug":        "pro",
      "nombre":      "Pro",
      "precio":      49,
      "descripcion": "Para reportes urgentes con garantía.",
      "tiempo":      "24h",
      "garantia":    true,
      "numeros":     1,
      "features":    ["1 número", "Respuesta en 24h", "Garantía de devolución"],
      "popular":     true
    }
  ]
}
```

---

### POST /api/baneo/webhook

Webhook de Stripe. Procesa confirmaciones de pago y actualiza el estado de la solicitud.

> Este endpoint no es invocado por el frontend. Solo Stripe lo llama.

**Header requerido:**

```
stripe-signature: <firma_de_stripe>
```

**Eventos que procesa:**

| Evento Stripe | Acción |
|---------------|--------|
| `payment_intent.succeeded` | Marca pago completado, cambia estado a `en_revision`, envía correo de confirmación |
| `payment_intent.payment_failed` | Marca pago fallido, notifica al usuario |

---

## Códigos de estado globales

| Estado | Descripción |
|--------|-------------|
| `pendiente_pago` | Solicitud creada, esperando confirmación de pago |
| `en_revision` | Pago confirmado, revisando legitimidad del reporte |
| `reporte_enviado` | Reporte formal enviado a Meta |
| `esperando_meta` | Meta está procesando el reporte |
| `completado` | Número baneado exitosamente |
| `fallido` | Meta no aplicó el baneo |
| `cancelado` | Solicitud cancelada o devolución procesada |

---

## Variables de entorno requeridas

```env
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG...
SITE_URL=https://desbanwa.com
ADMIN_TOKEN=token_secreto_admin
```