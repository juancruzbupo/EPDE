# Variables de Entorno — EPDE

## API (`apps/api`)

| Variable                      | Requerida | Default          | Descripcion                                                                                                                                                   |
| ----------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                | Si        | —                | Connection string de PostgreSQL. Formato: `postgresql://user:pass@host:port/db?schema=public`                                                                 |
| `JWT_SECRET`                  | Si        | —                | Clave secreta para firmar JWTs. Usar valor aleatorio de al menos 32 caracteres en produccion                                                                  |
| `JWT_EXPIRATION`              | No        | `15m`            | Tiempo de vida del access token (formato: `15m`, `1h`)                                                                                                        |
| `JWT_REFRESH_EXPIRATION`      | No        | `7d`             | Tiempo de vida del refresh token family en Redis                                                                                                              |
| `REDIS_URL`                   | Si        | —                | URL de conexion a Redis. Formato: `redis://host:port`                                                                                                         |
| `PORT`                        | No        | `3001`           | Puerto donde escucha el API                                                                                                                                   |
| `NODE_ENV`                    | No        | `development`    | Entorno: `development`, `staging`, `production`                                                                                                               |
| `CORS_ORIGIN`                 | **Prod**  | `localhost:3000` | Origenes permitidos, separados por coma. **Requerido en produccion** (falla si no esta seteado). Ejemplo: `https://app.epde.com.ar,https://admin.epde.com.ar` |
| `FRONTEND_URL`                | Si        | —                | URL base del frontend (usada en emails y links de invitacion)                                                                                                 |
| `RESEND_API_KEY`              | Si        | —                | API key de Resend para envio de emails                                                                                                                        |
| `SENTRY_DSN`                  | No        | `""`             | DSN de Sentry. Si esta vacio, Sentry se desactiva                                                                                                             |
| `R2_ACCOUNT_ID`               | Si        | —                | Account ID de Cloudflare R2                                                                                                                                   |
| `R2_ACCESS_KEY_ID`            | Si        | —                | Access key de Cloudflare R2                                                                                                                                   |
| `R2_SECRET_ACCESS_KEY`        | Si        | —                | Secret key de Cloudflare R2                                                                                                                                   |
| `R2_BUCKET_NAME`              | No        | `epde`           | Nombre del bucket en R2                                                                                                                                       |
| `R2_PUBLIC_URL`               | Si        | —                | URL publica del bucket R2 para servir archivos                                                                                                                |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No        | —                | Endpoint OTLP para OpenTelemetry traces. Si no se setea, OTel se desactiva. Ejemplo: `https://otel-collector:4318/v1/traces`                                  |

## Web (`apps/web`)

| Variable              | Requerida | Default       | Descripcion                                                               |
| --------------------- | --------- | ------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Si        | —             | URL base del API (sin trailing slash). Ejemplo: `https://api.epde.com.ar` |
| `NODE_ENV`            | No        | `development` | Entorno de ejecucion                                                      |

## Mobile (`apps/mobile`)

| Variable              | Requerida | Default | Descripcion                         |
| --------------------- | --------- | ------- | ----------------------------------- |
| `EXPO_PUBLIC_API_URL` | Si        | —       | URL base del API para la app mobile |

## GitHub Secrets (CI/CD)

Estos secrets se configuran en GitHub → Settings → Secrets and variables → Actions.

### Produccion (`environment: production`)

| Secret              | Descripcion                                    | Donde obtenerlo                              |
| ------------------- | ---------------------------------------------- | -------------------------------------------- |
| `RAILWAY_TOKEN`     | API token de Railway                           | railway.com → Account → Tokens               |
| `DATABASE_URL`      | Connection string PostgreSQL de prod           | Railway dashboard → PostgreSQL service → URL |
| `VERCEL_TOKEN`      | API token de Vercel                            | vercel.com → Settings → Tokens               |
| `VERCEL_ORG_ID`     | ID de la org/team en Vercel                    | vercel.com → Settings → General              |
| `VERCEL_PROJECT_ID` | ID del proyecto web en Vercel                  | vercel.com → Project → Settings → General    |
| `API_URL`           | URL base del API (para smoke test post-deploy) | `https://api.epde.com.ar`                    |

### Staging (`environment: staging`)

| Secret                      | Descripcion                             | Donde obtenerlo                         |
| --------------------------- | --------------------------------------- | --------------------------------------- |
| `RAILWAY_TOKEN_STAGING`     | API token de Railway (proyecto staging) | railway.com → Account → Tokens          |
| `DATABASE_URL_STAGING`      | Connection string PostgreSQL de staging | Railway dashboard → staging PostgreSQL  |
| `VERCEL_TOKEN`              | Mismo token de Vercel (compartido)      | vercel.com → Settings → Tokens          |
| `VERCEL_ORG_ID`             | Mismo org ID (compartido)               | vercel.com → Settings → General         |
| `VERCEL_PROJECT_ID_STAGING` | ID del proyecto web staging en Vercel   | vercel.com → Staging Project → Settings |

### Variables (no secretas)

Configurar en GitHub → Settings → Variables → Actions:

| Variable              | Descripcion                           | Ejemplo                   |
| --------------------- | ------------------------------------- | ------------------------- |
| `NEXT_PUBLIC_API_URL` | URL publica del API (por environment) | `https://api.epde.com.ar` |

## Puertos utilizados

| Servicio           | Puerto | Notas                                      |
| ------------------ | ------ | ------------------------------------------ |
| API (NestJS)       | 3001   | Configurable via `PORT`                    |
| Web (Next.js)      | 3000   | Configurable via `--port`                  |
| PostgreSQL         | 5433   | Docker Compose (mapeado desde 5432)        |
| Redis              | 6379   | Default Redis                              |
| Prometheus Metrics | 9464   | Exportador OpenTelemetry (solo en runtime) |
| pgAdmin            | 5050   | Docker Compose                             |
