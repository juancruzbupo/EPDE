# Variables de Entorno — EPDE

## API (`apps/api`)

| Variable                      | Requerida | Default          | Descripcion                                                                                                                                                                            |
| ----------------------------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                | Si        | —                | Connection string de PostgreSQL. Formato: `postgresql://user:pass@host:port/db?schema=public`                                                                                          |
| `JWT_SECRET`                  | Si        | —                | Clave secreta para firmar JWTs. Usar valor aleatorio de al menos 32 caracteres en produccion                                                                                           |
| `JWT_EXPIRATION`              | No        | `15m`            | Tiempo de vida del access token (formato: `15m`, `1h`)                                                                                                                                 |
| `JWT_REFRESH_EXPIRATION`      | No        | `7d`             | Tiempo de vida del refresh token family en Redis                                                                                                                                       |
| `REDIS_URL`                   | Si        | —                | URL de conexion a Redis. Formato: `redis://host:port`                                                                                                                                  |
| `PORT`                        | No        | `3001`           | Puerto donde escucha el API                                                                                                                                                            |
| `NODE_ENV`                    | No        | `development`    | Entorno: `development`, `staging`, `production`                                                                                                                                        |
| `CORS_ORIGIN`                 | **Prod**  | `localhost:3000` | Origenes permitidos, separados por coma. **Requerido en produccion** (falla si no esta seteado). Ejemplo: `https://app.epde.com.ar,https://admin.epde.com.ar`                          |
| `COOKIE_SAME_SITE`            | No        | `strict`         | Politica SameSite de cookies: `strict`, `lax`, `none`. Usar `none` cuando web y API estan en dominios diferentes (ej: Vercel + Render). Con `none`, `Secure` se activa automaticamente |
| `FRONTEND_URL`                | Si        | —                | URL base del frontend (usada en emails y links de invitacion)                                                                                                                          |
| `RESEND_API_KEY`              | No        | —                | API key de Resend para envio de emails. Si no se configura, los emails se loguean como warnings                                                                                        |
| `SENTRY_DSN`                  | No        | `""`             | DSN de Sentry. Si esta vacio, Sentry se desactiva                                                                                                                                      |
| `R2_ACCESS_KEY_ID`            | Si        | —                | Access key de Cloudflare R2                                                                                                                                                            |
| `R2_SECRET_ACCESS_KEY`        | Si        | —                | Secret key de Cloudflare R2                                                                                                                                                            |
| `R2_BUCKET_NAME`              | No        | `epde`           | Nombre del bucket en R2                                                                                                                                                                |
| `R2_PUBLIC_URL`               | Si        | —                | URL publica del bucket R2 para servir archivos                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No        | —                | Endpoint OTLP para OpenTelemetry traces. Si no se setea, OTel se desactiva. Ejemplo: `https://otel-collector:4318/v1/traces`                                                           |

## Seed (`apps/api/prisma/seed.ts`)

| Variable              | Requerida | Default     | Descripcion                                                                                         |
| --------------------- | --------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `SEED_ADMIN_PASSWORD` | No        | `Admin123!` | Password del usuario admin creado por el seed. **Requerido** en produccion (warning si usa default) |

## Docker Compose

Las credenciales de Docker Compose se parametrizan via variables de entorno con defaults para desarrollo:

| Variable            | Default             | Servicio   | Descripcion                  |
| ------------------- | ------------------- | ---------- | ---------------------------- |
| `POSTGRES_USER`     | `epde`              | PostgreSQL | Usuario de la base de datos  |
| `POSTGRES_PASSWORD` | `epde_dev_password` | PostgreSQL | Password de la base de datos |
| `POSTGRES_DB`       | `epde`              | PostgreSQL | Nombre de la base de datos   |
| `PGADMIN_EMAIL`     | `admin@epde.local`  | pgAdmin    | Email de login de pgAdmin    |
| `PGADMIN_PASSWORD`  | `admin`             | pgAdmin    | Password de login de pgAdmin |

**Nota:** En produccion, setear estas variables con valores seguros. Los defaults solo son para desarrollo local.

## Web (`apps/web`)

| Variable                 | Requerida | Default       | Descripcion                                                               |
| ------------------------ | --------- | ------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`    | Si        | —             | URL base del API (sin trailing slash). Ejemplo: `https://api.epde.com.ar` |
| `NEXT_PUBLIC_SENTRY_DSN` | No        | `""`          | DSN de Sentry para el frontend web. Si esta vacio, Sentry se desactiva    |
| `NODE_ENV`               | No        | `development` | Entorno de ejecucion                                                      |

## Mobile (`apps/mobile`)

| Variable              | Requerida | Default | Descripcion                                                                    |
| --------------------- | --------- | ------- | ------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_URL` | Si        | —       | URL base del API para la app mobile                                            |
| `sentryDsn`           | No        | `""`    | DSN de Sentry para mobile. Se configura en `app.json` > `expo.extra.sentryDsn` |

## GitHub Secrets (CI/CD)

Estos secrets se configuran en GitHub → Settings → Secrets and variables → Actions.

### Estrategia de separacion por environment

**IMPORTANTE**: Los secrets de deploy deben configurarse a nivel de **GitHub Environment**, NO a nivel de repositorio. Esto garantiza que:

1. Los secrets de produccion solo se inyectan en jobs con `environment: production`
2. Los secrets de staging solo se inyectan en jobs con `environment: staging`
3. No hay riesgo de usar credenciales de produccion en staging o viceversa

Para configurarlo:

1. Ir a GitHub → Settings → Environments
2. Crear environments `production` y `staging` (ver proteccion en [runbook.md](./runbook.md#github-environment-protection-rules))
3. En cada environment, agregar sus secrets dedicados

### Repo-level secrets (compartidos)

Estos secrets se usan en CI y no estan atados a un environment:

| Secret        | Descripcion                         | Donde obtenerlo                 |
| ------------- | ----------------------------------- | ------------------------------- |
| `TURBO_TOKEN` | Token para Turbo remote cache       | vercel.com → Settings → Tokens  |
| `TURBO_TEAM`  | ID del team para Turbo remote cache | vercel.com → Settings → General |

### Produccion (`environment: production`)

Configurar en GitHub → Settings → Environments → production → Environment secrets:

| Secret              | Descripcion                              | Donde obtenerlo                           |
| ------------------- | ---------------------------------------- | ----------------------------------------- |
| `VERCEL_TOKEN`      | API token de Vercel                      | vercel.com → Settings → Tokens            |
| `VERCEL_ORG_ID`     | ID de la org/team en Vercel              | vercel.com → Settings → General           |
| `VERCEL_PROJECT_ID` | ID del proyecto web produccion en Vercel | vercel.com → Project → Settings → General |

### Staging (`environment: staging`)

Configurar en GitHub → Settings → Environments → staging → Environment secrets:

| Secret                   | Descripcion                                  | Donde obtenerlo                           |
| ------------------------ | -------------------------------------------- | ----------------------------------------- |
| `RENDER_DEPLOY_HOOK_URL` | URL del deploy hook de Render (POST trigger) | Render → Service → Settings → Deploy Hook |
| `VERCEL_TOKEN`           | API token de Vercel (puede ser compartido)   | vercel.com → Settings → Tokens            |
| `VERCEL_ORG_ID`          | Mismo org ID (compartido)                    | vercel.com → Settings → General           |
| `VERCEL_PROJECT_ID`      | ID del proyecto web en Vercel                | vercel.com → Project → Settings → General |

### Variables (no secretas)

Configurar en GitHub → Settings → Variables → Actions (pueden ser por environment o repo-level):

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
