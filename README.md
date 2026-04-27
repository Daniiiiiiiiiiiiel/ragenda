# RaGenda — Sistema de Agendamiento Monorepo

Sistema fullstack de agendamiento de citas con soporte para cliente público y dashboard administrativo, utilizando un único repositorio monorepo alojado en GitHub y preparado para ser desplegado en Vercel como dos aplicaciones distintas.

## 🚀 Arquitectura

- **Monorepo**: npm workspaces
- **Frontend**: Vite + React 18 + TypeScript + TailwindCSS v3
- **Backend (API)**: Vercel Serverless Functions (`api/` folder en cada app)
- **Base de Datos**: PostgreSQL (Supabase) + Prisma ORM
- **Autenticación**: JWT (Access Token 15min) + Refresh Token (7 días) guardados en Upstash Redis
- **Emails**: Resend para verificación de cuentas y notificaciones de citas

## 📁 Estructura del Proyecto

```bash
/
├── apps/
│   ├── web/          # Sitio web público y portal del cliente (puerto 5173)
│   └── admin/        # Dashboard de administración (puerto 5174)
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
- Una base de datos PostgreSQL ([Supabase](https://supabase.com))
- Una base de datos Redis ([Upstash](https://upstash.com))
- Una API Key de [Resend](https://resend.com)

### 2. Instalación y Base de Datos

Instala dependencias y configura la DB:
```bash
# Instala todo en el workspace y genera el cliente Prisma
npm install

# Aplica las migraciones a tu base de datos
npm run db:migrate

# Corre el seed para tener datos de prueba (Admin y 3 clientes)
npm run db:seed
```

### 3. Ejecutar las Aplicaciones

Debido a que usamos un emulador de Vercel (opcional), puedes correr Vite directamente:

**Web (Pública):**
```bash
npm run dev:web
```
*Usuario de prueba: maria@example.com / Client@1234!*

**Admin (Dashboard):**
```bash
npm run dev:admin
```
*Usuario de prueba: admin@ragenda.app / Admin@1234!*

---

## 🌐 Despliegue en Vercel

El monorepo está diseñado para ser desplegado como **dos proyectos separados en Vercel** desde el mismo repositorio de GitHub.

### Proyecto 1: Web Pública
1. Nuevo proyecto en Vercel → Importar repositorio
2. En `Framework Preset`, selecciona **Vite**
3. En `Root Directory`, selecciona `apps/web`
4. Configura las variables de entorno de `.env`
5. Vercel leerá automáticamente el archivo `apps/web/vercel.json`

### Proyecto 2: Admin Dashboard
1. Nuevo proyecto en Vercel → Importar repositorio
2. En `Framework Preset`, selecciona **Vite**
3. En `Root Directory`, selecciona `apps/admin`
4. Configura las variables de entorno de `.env`
5. Vercel leerá automáticamente el archivo `apps/admin/vercel.json`

> **Nota sobre Base de Datos en Producción:** Asegúrate de usar las variables `DATABASE_URL` (con PgBouncer/connection pooling) y `DIRECT_URL` (conexión directa) para Prisma.

## 🔐 Seguridad Implementada
- Hash de contraseñas con bcrypt (salt: 12)
- Prevención de Server-Side Request Forgery y XSS vía React y Zod
- Rate Limiting estricto por IP con Upstash Redis
- Blacklist de JWTs en Redis para logout efectivo inmediato
- Protección de Rutas (Middleware) por Roles (ADMIN vs CLIENT)
- Security Headers (CSP, X-Frame-Options, HSTS)

## 🎨 Personalización UI
El tema global, colores y tipografía se configuran independientemente en el archivo `tailwind.config.ts` y en `index.css` de cada app (web/admin). La web soporta **internacionalización (i18n)** lista para usar en `src/i18n/`.
