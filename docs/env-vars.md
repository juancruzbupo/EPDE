# Variables de Entorno — EPDE

## API (`apps/api`)

| Variable                 | Requerida | Default       | Descripcion                                                                                           |
| ------------------------ | --------- | ------------- | ----------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Si        | —             | Connection string de PostgreSQL. Formato: `postgresql://user:pass@host:port/db?schema=public`         |
| `JWT_SECRET`             | Si        | —             | Clave secreta para firmar JWTs. Usar valor aleatorio de al menos 32 caracteres en produccion          |
| `JWT_EXPIRATION`         | No        | `15m`         | Tiempo de vida del access token (formato: `15m`, `1h`)                                                |
| `JWT_REFRESH_EXPIRATION` | No        | `7d`          | Tiempo de vida del refresh token family en Redis                                                      |
| `REDIS_URL`              | Si        | —             | URL de conexion a Redis. Formato: `redis://host:port`                                                 |
| `PORT`                   | No        | `3001`        | Puerto donde escucha el API                                                                           |
| `NODE_ENV`               | No        | `development` | Entorno: `development`, `staging`, `production`                                                       |
| `CORS_ORIGIN`            | No        | `*` (all)     | Origenes permitidos, separados por coma. Ejemplo: `https://app.epde.com.ar,https://admin.epde.com.ar` |
| `FRONTEND_URL`           | Si        | —             | URL base del frontend (usada en emails y links de invitacion)                                         |
| `RESEND_API_KEY`         | Si        | —             | API key de Resend para envio de emails                                                                |
| `SENTRY_DSN`             | No        | `""`          | DSN de Sentry. Si esta vacio, Sentry se desactiva                                                     |
| `R2_ACCOUNT_ID`          | Si        | —             | Account ID de Cloudflare R2                                                                           |
| `R2_ACCESS_KEY_ID`       | Si        | —             | Access key de Cloudflare R2                                                                           |
| `R2_SECRET_ACCESS_KEY`   | Si        | —             | Secret key de Cloudflare R2                                                                           |
| `R2_BUCKET_NAME`         | No        | `epde`        | Nombre del bucket en R2                                                                               |
| `R2_PUBLIC_URL`          | Si        | —             | URL publica del bucket R2 para servir archivos                                                        |

## Web (`apps/web`)

| Variable              | Requerida | Default       | Descripcion                                                               |
| --------------------- | --------- | ------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Si        | —             | URL base del API (sin trailing slash). Ejemplo: `https://api.epde.com.ar` |
| `NODE_ENV`            | No        | `development` | Entorno de ejecucion                                                      |

## Mobile (`apps/mobile`)

| Variable              | Requerida | Default | Descripcion                         |
| --------------------- | --------- | ------- | ----------------------------------- |
| `EXPO_PUBLIC_API_URL` | Si        | —       | URL base del API para la app mobile |

## Puertos utilizados

| Servicio           | Puerto | Notas                                      |
| ------------------ | ------ | ------------------------------------------ |
| API (NestJS)       | 3001   | Configurable via `PORT`                    |
| Web (Next.js)      | 3000   | Configurable via `--port`                  |
| PostgreSQL         | 5433   | Docker Compose (mapeado desde 5432)        |
| Redis              | 6379   | Default Redis                              |
| Prometheus Metrics | 9464   | Exportador OpenTelemetry (solo en runtime) |
| pgAdmin            | 5050   | Docker Compose                             |
