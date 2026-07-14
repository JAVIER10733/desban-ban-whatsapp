# DesbanWA

Plataforma profesional de desbaneo y baneo de números de WhatsApp. Gestiona apelaciones ante Meta para recuperar números bloqueados o reportar números problemáticos.

## Servicios

- **Desbaneo** — Recupera tu número baneado de WhatsApp en 24-72 horas
- **Baneo** — Reporta números de acoso, spam o estafadores ante Meta

## Stack

- Frontend: HTML + CSS + JS puro
- Backend: Netlify Functions (Node.js serverless)
- Base de datos: PostgreSQL
- Pagos: Stripe
- Correos: SendGrid / Nodemailer
- Deploy: Netlify

## Estructura

```
desban-ban-whatsapp/
├── index.html              # Página de inicio pública
├── panel.html              # Panel de administración
├── 404.html                # Página no encontrada
├── 500.html                # Error del servidor
├── sitemap.html            # Mapa visual del sitio
├── config/                 # Configuración técnica
├── modules/
│   ├── desbaneo/           # Módulo de desbaneo
│   ├── baneo/              # Módulo de baneo
│   └── shared/             # Componentes y lógica compartida
├── netlify/functions/      # API serverless
├── database/               # Migraciones y seeds
├── tests/                  # Unit, integration y e2e
└── docs/                   # Documentación
```

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/desbanwa/desban-ban-whatsapp.git
cd desban-ban-whatsapp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp config/.env.example config/.env
# Editar config/.env con tus valores

# Iniciar servidor de desarrollo
npm run dev
```

El sitio estará disponible en `http://localhost:3000`

## Variables de entorno

Copia `config/.env.example` a `config/.env` y completa:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión PostgreSQL |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook de Stripe |
| `SENDGRID_API_KEY` | API key de SendGrid |
| `JWT_SECRET` | Secret para tokens de autenticación |
| `ADMIN_EMAIL` | Email del administrador |

## Scripts disponibles

```bash
npm run dev           # Servidor de desarrollo en localhost:3000
npm run lint          # Verificar calidad del JS
npm run lint:css      # Verificar calidad del CSS
npm run format        # Formatear código automáticamente
npm run test          # Ejecutar tests unitarios
npm run test:e2e      # Ejecutar tests end-to-end
npm run db:migrate    # Ejecutar migraciones de base de datos
npm run db:seed       # Cargar datos iniciales
```

## Deploy en Netlify

1. Conecta el repositorio en [app.netlify.com](https://app.netlify.com)
2. Configura las variables de entorno en **Site settings → Environment variables**
3. El archivo `netlify.toml` ya tiene toda la configuración necesaria

Cada push a `main` despliega automáticamente via GitHub Actions.

## Documentación

- [API Desbaneo](docs/api-desbaneo.md)
- [API Baneo](docs/api-baneo.md)
- [Base de datos](docs/database.md)
- [Guía de deploy](docs/deploy.md)
- [Sistema de diseño](docs/design-system.md)
- [Onboarding para nuevos devs](docs/onboarding.md)

## Licencia

MIT © 2025 DesbanWA