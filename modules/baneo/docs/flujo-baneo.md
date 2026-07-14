# Flujo completo — Módulo Baneo

Documentación del flujo de negocio del módulo de baneo, de inicio a fin.

---

## Visión general

```
Usuario → Formulario → Pago → Revisión → Reporte → Meta → Resultado
```

---

## Flujo detallado

### 1. Usuario llega a la landing

El usuario llega a `modules/baneo/pages/landing/` desde:
- Búsqueda orgánica en Google
- Enlace desde `index.html`
- Referencia directa

El componente `hero/` y `razones-grid/` le explican el servicio.

---

### 2. Usuario inicia el formulario

Hace clic en cualquier CTA de baneo → llega a `pages/solicitud/`.

El componente `form-solicitud/` maneja el flujo en 3 pasos:

**Paso 1 — Caso:**
- Selecciona país y escribe el número
- Elige el motivo del reporte
- Describe el problema (mínimo 20 caracteres)
- Sube evidencia opcional (capturas)
- Acepta el aviso legal

**Paso 2 — Contacto:**
- Nombre y email
- Preferencia de notificación

**Paso 3 — Plan:**
- Elige entre Básico ($29), Pro ($49) o Enterprise ($89)
- Ve el resumen del pedido
- Completa los datos de tarjeta

---

### 3. Submit del formulario

`form-solicitud.js` llama a `solicitud.service.js`:

```js
POST /api/baneo/solicitud
Body: { numero, motivo, descripcion, plan, nombre, email, aceptaAviso }
```

`solicitud.js` (handler) ejecuta:

1. Valida rate limit por IP
2. Valida body con `solicitud.validator.js`
3. Llama a `solicitud.controller.js`

`solicitud.controller.js` ejecuta:

1. Crea PaymentIntent en Stripe con el monto del plan
2. Guarda la solicitud en `solicitudes_baneo` con estado `pendiente_pago`
3. Envía correo de confirmación con el número de caso
4. Devuelve el `client_secret` de Stripe al frontend

---

### 4. Pago con Stripe

El frontend usa el `client_secret` para confirmar el pago con Stripe.js.

Stripe llama al webhook `POST /api/baneo/webhook` con el evento `payment_intent.succeeded`.

`webhook.controller.js` ejecuta:

1. Verifica la firma de Stripe
2. Llama a `cambiar_estado_baneo()` con estado `en_revision`
3. Marca `pago_completado = TRUE` en la solicitud
4. Envía correo al usuario: "Pago recibido. Revisando tu caso."

---

### 5. Revisión del caso

Un asesor revisa la solicitud desde el panel admin (`panel.html`).

**Criterios de aprobación:**
- El número es real y está activo en WhatsApp
- El motivo declarado es verificable o plausible
- No hay señales de uso ilegítimo del servicio

**Si aprueba:**

```sql
SELECT cambiar_estado_baneo(id, 'reporte_enviado', 'Reporte enviado a Meta.', true, 'asesor');
```

Se envía correo al usuario: "Tu reporte fue enviado a Meta."

**Si rechaza:**

```sql
SELECT cambiar_estado_baneo(id, 'cancelado', 'Reporte rechazado. No cumple criterios.', true, 'asesor');
```

Se procesa devolución y se envía correo de explicación.

---

### 6. Reporte ante Meta

El asesor envía el reporte por los canales oficiales de Meta con la documentación del caso.

Estado cambia a `esperando_meta`.

```sql
SELECT cambiar_estado_baneo(id, 'esperando_meta', 'Esperando respuesta de Meta.', true, 'asesor');
```

---

### 7. Resultado

**Si Meta baneó el número:**

```sql
SELECT cambiar_estado_baneo(id, 'completado', 'Número baneado exitosamente.', true, 'asesor');
```

Correo al usuario: "El número fue baneado."

**Si Meta no lo baneó (dentro del plazo):**

```sql
SELECT cambiar_estado_baneo(id, 'fallido', 'Meta no aplicó el baneo en el plazo.', true, 'sistema');
```

Si el plan tiene garantía (`pro`, `enterprise`, `business-pro`), se procesa la devolución automáticamente.

---

## Estados y transiciones válidas

```
pendiente_pago
    │
    ▼ (webhook Stripe succeeded)
en_revision
    │
    ├─▶ cancelado  (revisión rechazada)
    │
    ▼ (asesor aprueba)
reporte_enviado
    │
    ▼
esperando_meta
    │
    ├─▶ completado  (Meta baneó el número)
    │
    └─▶ fallido     (Meta no lo baneó)
                │
                └─▶ cancelado  (devolución procesada)
```

---

## Emails que se envían

| Evento | Plantilla | Destinatario |
|--------|-----------|--------------|
| Solicitud creada | `solicitud_baneo_confirmacion` | Usuario |
| Pago confirmado | `baneo_pago_confirmado` | Usuario |
| Reporte enviado a Meta | `baneo_reporte_enviado` | Usuario |
| Número baneado | `baneo_completado` | Usuario |
| Caso rechazado | `baneo_rechazado` | Usuario |
| Devolución procesada | `baneo_devolucion` | Usuario |

---

## Garantía de devolución

Aplica a los planes `pro`, `enterprise` y `business-pro` cuando:

1. El estado llega a `fallido`
2. Meta no aplicó el baneo dentro del plazo acordado
3. El reporte fue legítimo y no fue rechazado por uso indebido

**Proceso:**

1. Sistema detecta el estado `fallido` en plan con garantía
2. Crea refund en Stripe via API
3. Cambia estado a `cancelado` con nota `devolucion_procesada`
4. Envía correo de confirmación de devolución

**Tiempo de devolución:** máximo 5 días hábiles al mismo método de pago.

---

## Componentes involucrados

| Capa | Archivo |
|------|---------|
| UI Landing | `pages/landing/` |
| UI Formulario | `components/form-solicitud/` |
| UI Hero | `components/hero/` |
| UI Razones | `components/razones-grid/` |
| UI Alerta | `components/alerta-legal/` |
| UI Confirmación | `components/confirmacion/` |
| API Handler | `api/solicitud.js` |
| Lógica | `api/solicitud.controller.js` |
| DB Queries | `api/solicitud.model.js` |
| Validación | `api/solicitud.validator.js` |
| Estado | `api/estado.js` |
| Planes | `api/planes.js` |
| Shared DB | `netlify/functions/_shared/db.js` |
| Shared Mailer | `netlify/functions/_shared/mailer.js` |
| Shared Stripe | `netlify/functions/_shared/stripe.js` |