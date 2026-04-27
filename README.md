# RaGenda — Sistema de Agendamiento Monorepo

Sistema fullstack de agendamiento de citas con soporte para cliente público y dashboard administrativo, utilizando un único repositorio monorepo alojado en GitHub y desplegado en Vercel como dos aplicaciones distintas.

## 🚀 Arquitectura

- **Monorepo**: npm workspaces
- **Frontend**: Vite + React 18 + TypeScript + TailwindCSS v3
- **Backend (API)**: Vercel Serverless Functions (`api/` folder en cada app)
- **Base de Datos**: PostgreSQL (Supabase) + Prisma ORM
- **Autenticación**: JWT (Access Token 15min) + Refresh Token (7 días) con Upstash Redis
- **Emails**: Resend para verificación de cuentas y notificaciones de citas

## 📁 Estructura del Proyecto

```bash
/
├── apps/
│   ├── web/          # Sitio web público y portal del cliente (puerto 5173)
│   │   ├── api/      # Serverless Functions → /api/auth, /api/appointments, etc.
│   │   └── src/      # React frontend
│   └── admin/        # Dashboard de administración (puerto 5174)
│       ├── api/      # Serverless Functions → /api/admin/*
│       └── src/      # React frontend admin
├── packages/
│   └── db/           # Prisma schema, migraciones y cliente compartido
├── .env.example      # Variables de entorno requeridas
└── package.json      # Configuración del workspace
```

## 🛠️ Desarrollo Local

### 1. Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura tus variables:
```bash
cp .env.example .env
```
Necesitarás:
- Una base de datos PostgreSQL → [Supabase](https://supabase.com) (gratuito)
- Una base de datos Redis → [Upstash](https://upstash.com) (gratuito)
- Una API Key de email → [Resend](https://resend.com) (gratuito)

### 2. Instalación y Base de Datos

```bash
# Instala todo en el workspace y genera el cliente Prisma automáticamente
npm install

# Aplica las migraciones a tu base de datos
npm run db:migrate

# Seed con datos de prueba (Admin + 3 clientes de ejemplo)
npm run db:seed
```

### 3. Ejecutar las Aplicaciones

**Web (Pública) — http://localhost:5173:**
```bash
npm run dev:web
```
*Usuario de prueba: `maria@example.com` / `Client@1234!`*

**Admin (Dashboard) — http://localhost:5174:**
```bash
npm run dev:admin
```
*Usuario de prueba: `admin@ragenda.app` / `Admin@1234!`*

---

## 🌐 Deploy en Vercel desde GitHub

El monorepo se despliega como **dos proyectos separados en Vercel** desde el mismo repo.

### Variables de Entorno (requeridas en ambos proyectos)

Generar secrets seguros:
```bash
openssl rand -hex 32   # para JWT_SECRET
openssl rand -hex 32   # para REFRESH_TOKEN_SECRET
```

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL con pgBouncer (Supabase pooling port 6543) |
| `DIRECT_URL` | PostgreSQL directo (Supabase port 5432) |
| `JWT_SECRET` | Secret aleatorio 256-bit para access tokens |
| `REFRESH_TOKEN_SECRET` | Secret aleatorio 256-bit para refresh tokens |
| `UPSTASH_REDIS_REST_URL` | URL REST de tu instancia Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Token de tu instancia Upstash |
| `RESEND_API_KEY` | API Key de Resend |
| `EMAIL_FROM` | `RaGenda <no-reply@tudominio.com>` |
| `ALLOWED_ORIGINS` | URLs de producción de ambas apps (comma-separated) |
| `NODE_ENV` | `production` |

### Proyecto 1: Web Pública (`apps/web`)

1. Ve a [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → selecciona `ragenda`
2. **Root Directory**: `apps/web`
3. **Framework Preset**: Vite (se detecta automáticamente)
4. **Build Command**: `cd ../.. && npm install && npm run build:web`
5. **Output Directory**: `dist`
6. En **Environment Variables**, agrega todas las de la tabla anterior
7. Para `ALLOWED_ORIGINS`, una vez tengas la URL del proyecto admin, actualiza este valor
8. Deploy ✅

### Proyecto 2: Admin Dashboard (`apps/admin`)

1. Ve a [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → selecciona `ragenda` (mismo repo)
2. **Root Directory**: `apps/admin`
3. **Framework Preset**: Vite
4. **Build Command**: `cd ../.. && npm install && npm run build:admin`
5. **Output Directory**: `dist`
6. Agrega las mismas variables de entorno
7. Deploy ✅

### Post-Deploy: Actualizar CORS

Una vez tengas ambas URLs de Vercel, actualiza `ALLOWED_ORIGINS` en ambos proyectos:
```
ALLOWED_ORIGINS=https://tu-web.vercel.app,https://tu-admin.vercel.app
```

### Migración de Base de Datos en Producción

Ejecuta las migraciones apuntando a producción antes del primer deploy:
```bash
# Con las variables de producción activas
npx dotenv -e .env.production -- npm run db:migrate
# O directamente con la URL de producción
DATABASE_URL="..." npm run db:migrate
```

---

## 🔐 Seguridad Implementada

- Hash de contraseñas con **bcrypt** (salt rounds: 12)
- **Rate Limiting** por IP con Upstash Redis (5 intentos / 15 min)
- **JWT blacklist** en Redis para logout efectivo inmediato
- Rutas protegidas por roles (`ADMIN` vs `CLIENT`)
- **Security Headers** (CSP, X-Frame-Options, nosniff, Referrer-Policy)
- **CORS** estricto — solo orígenes configurados en `ALLOWED_ORIGINS`

## 🎨 Personalización UI

El tema global, colores y tipografía se configuran en `tailwind.config.ts` y `index.css` de cada app. La web soporta **internacionalización (i18n)** lista para usar en `src/i18n/`.
