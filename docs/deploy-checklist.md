# Checklist de Deploy a Producción

## Variables de entorno obligatorias

### API (`apps/api`)

| Variable               | Descripción                                      | Ejemplo                                                     |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string                     | `postgresql://user:pass@host:5432/epde?connection_limit=20` |
| `REDIS_URL`            | Redis connection (debe usar `rediss://` en prod) | `rediss://user:pass@host:6379`                              |
| `JWT_SECRET`           | Secret para firmar tokens JWT                    | (min 32 chars, random)                                      |
| `JWT_REFRESH_SECRET`   | Secret para refresh tokens                       | (min 32 chars, diferente de JWT_SECRET)                     |
| `CORS_ORIGIN`          | URL del frontend web (HTTPS obligatorio)         | `https://epde.com.ar`                                       |
| `COOKIE_SAME_SITE`     | Cookie policy                                    | `strict` (default)                                          |
| `RESEND_API_KEY`       | API key de Resend para emails                    | `re_...`                                                    |
| `R2_ACCOUNT_ID`        | Cloudflare R2 account                            | —                                                           |
| `R2_ACCESS_KEY_ID`     | Cloudflare R2 key                                | —                                                           |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret                             | —                                                           |
| `R2_BUCKET_NAME`       | Nombre del bucket R2                             | `epde-uploads`                                              |
| `R2_PUBLIC_URL`        | URL pública del bucket                           | `https://uploads.epde.com.ar`                               |
| `SEED_ADMIN_PASSWORD`  | Password del admin en prod                       | (NO usar default `Admin123!`)                               |
| `SENTRY_DSN`           | DSN de Sentry para error tracking                | `https://...@sentry.io/...`                                 |

### Web (`apps/web`)

| Variable                   | Descripción                          | Ejemplo                                |
| -------------------------- | ------------------------------------ | -------------------------------------- |
| `API_PROXY_TARGET`         | URL interna del API (server-side)    | `https://api.epde.com.ar`              |
| `NEXT_PUBLIC_WHATSAPP_URL` | URL de WhatsApp para CTAs de landing | `https://wa.me/549XXXXXXXXXX?text=...` |
| `NEXT_PUBLIC_SENTRY_DSN`   | DSN de Sentry para frontend          | `https://...@sentry.io/...`            |

## Verificaciones pre-deploy

- [ ] `NEXT_PUBLIC_WHATSAPP_URL` configurada con número real de Noelia (NO el placeholder `5493001234567`)
- [ ] `CORS_ORIGIN` apunta al dominio real (NO `localhost`)
- [ ] `REDIS_URL` usa `rediss://` (TLS obligatorio en producción)
- [ ] `SEED_ADMIN_PASSWORD` cambiado del default
- [ ] `JWT_SECRET` y `JWT_REFRESH_SECRET` son distintos y de 32+ chars
- [ ] Prisma migrations corridas: `npx prisma migrate deploy`
- [ ] Seed ejecutado: `npx prisma db seed` (crea admin + categorías + templates)
- [ ] R2 bucket creado y configurado con `Content-Disposition: attachment`
- [ ] Sentry projects creados (API + Web)
- [ ] DNS configurado (dominio → Vercel web, subdominio API → Render)

## Infraestructura de producción

### Render: plan Starter ($7/mes) obligatorio

El free tier duerme la app después de 15 min de inactividad. Los 10 cron jobs (task scheduler, ISV recalc, subscription reminders, notification cleanup, etc.) solo corren si el proceso está activo. En free tier los crons no son confiables.

- [ ] Upgrade a Render Starter ($7/mes) para background workers confiables
- [ ] Verificar que los 3 schedulers loguean ejecución en las primeras 24h post-deploy

### Integraciones externas

El código ya implementa las 3 integraciones, pero sin las env vars configuradas operan en modo no-op:

- [ ] **Resend** — Crear cuenta, obtener API key, configurar `RESEND_API_KEY`. Sin esto: invitaciones de cliente, notificaciones por email y reset de password no se envían
- [ ] **Cloudflare R2** — Crear bucket, configurar las 5 vars `R2_*`. Sin esto: fotos de tareas, adjuntos de presupuestos y fotos de solicitudes de servicio no se suben
- [ ] **Sentry** — Crear 2 projects (API + Web), configurar `SENTRY_DSN` y `NEXT_PUBLIC_SENTRY_DSN`. Sin esto: errores en producción no se reportan

### Mobile: primer build Android

EAS está configurado (`eas.json` con profiles development/preview/production). Para los primeros clientes:

- [ ] Correr `eas build --profile preview --platform android` para generar APK de testing
- [ ] Distribuir APK a los 10 primeros clientes vía link directo o TestFlight/internal testing
- [ ] Para App Store/Play Store: correr `eas build --profile production` + `eas submit`

### SSL y dominios

- [ ] Certificado SSL en dominio principal (Vercel lo maneja automático)
- [ ] Subdominio API con HTTPS (`api.epde.com.ar`)
- [ ] `EXPO_PUBLIC_API_URL` en mobile apuntando al dominio de producción
- [ ] `EXPO_PUBLIC_WEB_URL` en mobile apuntando al dominio web

## Verificaciones post-deploy

- [ ] `GET /api/v1/health` retorna `{ status: "ok", info: { database: { status: "up" }, redis: { status: "up" } } }`
- [ ] Login funciona: `POST /api/v1/auth/login` con admin credentials
- [ ] Landing page carga: CTAs de WhatsApp apuntan al número correcto
- [ ] Swagger docs accesibles: `/api/docs` (solo en staging, no en prod)
- [ ] Sentry captura un test error
- [ ] Email de invitación se envía (crear cliente de prueba)
- [ ] Cron jobs se ejecutan (verificar logs en 24h)

## Monitoreo post-launch

- **Sentry**: errores de frontend + backend con source maps
- **Prometheus** (puerto 9464): métricas HTTP, token rotation, cron execution
- **Health check**: `GET /api/v1/health` cada 5 min desde monitoring externo
- **Redis**: verificar eviction policy `noeviction` (no `volatile-lru`)
- **Retry backoffs**: queries con exponential backoff (1s/2s/4s cap 30s) protegen contra thundering herd
