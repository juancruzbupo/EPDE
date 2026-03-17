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
