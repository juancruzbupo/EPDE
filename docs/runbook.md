# Runbook Operativo — EPDE

## Arquitectura

```
                  ┌─────────────┐
                  │   Clients   │
                  │ (Browser /  │
                  │  Mobile)    │
                  └──────┬──────┘
                         │
              ┌──────────┴──────────┐
              │                     │
      ┌───────▼──────┐    ┌────────▼───────┐
      │   Next.js    │    │   Expo Mobile  │
      │   (Web)      │    │   (iOS/Android)│
      │   Port 3000  │    │                │
      └───────┬──────┘    └────────┬───────┘
              │                    │
              └────────┬───────────┘
                       │
               ┌───────▼───────┐
               │   NestJS API  │
               │   Port 3001   │
               │   /api/v1/*   │
               └──┬────┬───┬───┘
                  │    │   │
         ┌────────┘    │   └────────┐
         │             │            │
   ┌─────▼─────┐ ┌────▼────┐ ┌────▼─────┐
   │ PostgreSQL │ │  Redis  │ │ R2 (S3)  │
   │   5433     │ │  6379   │ │ Storage  │
   └───────────┘ └─────────┘ └──────────┘
```

**Stack**: NestJS (API) + Next.js 15 (Web) + Expo (Mobile) + Prisma (ORM) + Redis (cache/sessions) + PostgreSQL 16

## Health Checks

### API Health

```bash
curl https://api.epde.com.ar/api/v1/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

Si `status` != `"ok"`, verificar los componentes degradados en `info`.

### Metricas Prometheus

```bash
curl http://api-host:9464/metrics
```

Metricas disponibles:

- `http_requests_total{method, route, status_code}` — Total de requests HTTP
- `http_request_duration_seconds{method, route}` — Latencia de requests (histograma)
- `token_rotation_total{result}` — Rotaciones de refresh token (`success`, `expired`, `reuse_attack`)
- `cron_execution_duration_seconds{job}` — Duracion de ejecucion de cron jobs

## Cron Jobs

| Nombre                      | Horario                     | Descripcion                                            |
| --------------------------- | --------------------------- | ------------------------------------------------------ |
| `task-status-recalculation` | `0 9 * * *` (09:00 diario)  | Recalcula estados de tareas segun fecha de vencimiento |
| `task-upcoming-reminders`   | `5 9 * * *` (09:05 diario)  | Envia notificaciones de tareas proximas a vencer       |
| `task-safety-sweep`         | `10 9 * * *` (09:10 diario) | Barrido de seguridad para tareas inconsistentes        |

Los cron jobs usan distributed locks (Redis) para evitar ejecucion duplicada en multiples instancias.

## Incidentes Comunes

### 1. Redis no disponible

**Sintomas**: Health check reporta Redis down, login falla, refresh tokens no rotan.

**Diagnostico**:

```bash
redis-cli -u $REDIS_URL ping
```

**Accion**:

1. Verificar que el servicio Redis esta corriendo
2. Verificar conectividad de red entre API y Redis
3. Revisar logs del API por errores de conexion: `"Redis connection lost"`, `"ECONNREFUSED"`
4. El API tiene reconnection automatica — deberia recuperarse cuando Redis vuelva

**Impacto**: Usuarios no pueden loguearse ni rotar tokens. Requests autenticados siguen funcionando mientras el access token no expire (15min default).

### 2. Token reuse attack detectado

**Sintomas**: Metrica `token_rotation_total{result="reuse_attack"}` incrementa.

**Diagnostico**:

```bash
# Buscar en logs
grep "reuse_attack" /var/log/api/*.log
```

**Accion**:

1. La familia de tokens ya fue revocada automaticamente (seguridad built-in)
2. El usuario afectado debera re-loguearse
3. Si es frecuente, investigar si un cliente esta haciendo refresh concurrentes (bug de app) o si hay un ataque real
4. Revisar IP de origen en los logs

### 3. Connection pool agotado (PostgreSQL)

**Sintomas**: Requests fallan con timeout, logs muestran `"Connection pool exhausted"`.

**Diagnostico**:

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'epde';
```

**Accion**:

1. Verificar si hay queries lentas: `SELECT * FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '30 seconds';`
2. Verificar que los cron jobs no estan acumulando conexiones
3. Si es necesario, reiniciar el API para liberar conexiones
4. Considerar aumentar `connection_limit` en Prisma si el trafico lo justifica

### 4. Errores 500 frecuentes

**Sintomas**: Metrica `http_requests_total{status_code="500"}` incrementa, alertas de Sentry.

**Diagnostico**:

1. Revisar Sentry para stack traces
2. Revisar logs estructurados (pino): `grep "500" /var/log/api/*.log | jq .`
3. El request ID en los logs permite trazar el request completo

**Accion**: Depende del error. Verificar en este orden:

1. Conectividad a DB/Redis (health check)
2. Migraciones pendientes (`prisma migrate status`)
3. Variables de entorno faltantes
4. Bugs en codigo (Sentry tendra el stack trace)

### 5. Emails no se envian

**Sintomas**: Usuarios no reciben invitaciones o notificaciones por email.

**Diagnostico**:

```bash
# Verificar API key de Resend
curl -X GET https://api.resend.com/domains \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

**Accion**:

1. Verificar que `RESEND_API_KEY` es valida
2. Verificar dominio configurado en Resend dashboard
3. Revisar logs por errores de envio
4. Verificar que `FRONTEND_URL` apunta al dominio correcto (usado en links de emails)

## Deploy

### Produccion

El deploy se ejecuta automaticamente via GitHub Actions (`cd.yml`) en push a `main`:

1. CI job corre: lint → typecheck → build → test → frontend coverage check
2. Si CI pasa, deploy-api y deploy-web se ejecutan en paralelo
3. **deploy-api (Railway)**:
   - Instala Railway CLI
   - Ejecuta migraciones Prisma (`prisma migrate deploy`)
   - Despliega via `railway up --service epde-api --detach`
   - Usa `apps/api/Dockerfile` (multi-stage build: base → deps → builder → runner)
   - Healthcheck: `GET /api/v1/health` (timeout 30s)
4. **deploy-web (Vercel)**:
   - Instala Vercel CLI
   - `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`

Secrets requeridos: ver [env-vars.md](./env-vars.md) seccion "GitHub Secrets".

### Staging

Se despliega automaticamente en push a `develop` (`cd-staging.yml`). Misma pipeline pero con secrets de staging (`RAILWAY_TOKEN_STAGING`, `DATABASE_URL_STAGING`, `VERCEL_PROJECT_ID_STAGING`).

### Deploy manual (API)

```bash
# Opcion 1: Docker (recomendado)
docker build -f apps/api/Dockerfile -t epde-api .
docker run -p 3001:3001 --env-file .env epde-api

# Opcion 2: Node directo
pnpm --filter @epde/api build
pnpm --filter @epde/api prisma generate
pnpm --filter @epde/api prisma migrate deploy
NODE_ENV=production node apps/api/dist/main.js
```

### Rollback

```bash
# 1. Revertir a commit anterior
git revert HEAD

# 2. O desplegar un commit especifico
git checkout <commit-sha>
# Seguir pasos de deploy manual

# 3. Rollback de migracion (si es necesario)
# CUIDADO: Esto puede perder datos
pnpm --filter @epde/api prisma migrate resolve --rolled-back <migration_name>
```

## Base de Datos

### Migraciones

```bash
# Ver estado de migraciones
pnpm --filter @epde/api prisma migrate status

# Aplicar migraciones pendientes (produccion)
pnpm --filter @epde/api prisma migrate deploy

# Crear nueva migracion (desarrollo)
pnpm --filter @epde/api prisma migrate dev --name descripcion_del_cambio
```

### Indices importantes

- `User(role, deletedAt)` — Filtrado de usuarios por rol
- `Task(status, nextDueDate)` — Queries de cron jobs
- `Task(status, deletedAt)` — Listado de tareas activas
- `TaskLog(taskId)` — Historial de completado por tarea
- `TaskLog(completedBy)` — Historial de completado por usuario
- `Notification(userId, type, createdAt)` — Notificaciones del usuario

### Backup

Configurar backups automaticos del proveedor de PostgreSQL. Como minimo:

- Backups diarios con retencion de 7 dias
- Backups semanales con retencion de 30 dias

## Monitoring

### Alertas recomendadas

| Metrica                                       | Condicion                | Severidad |
| --------------------------------------------- | ------------------------ | --------- |
| Health check                                  | Status != ok por > 2 min | Critica   |
| `http_request_duration_seconds` p95           | > 2s por > 5 min         | Warning   |
| `http_requests_total{status_code=~"5.."}`     | > 10/min                 | Critica   |
| `token_rotation_total{result="reuse_attack"}` | > 5/hora                 | Warning   |
| `cron_execution_duration_seconds`             | > 60s                    | Warning   |
| Redis connectivity                            | Desconectado > 1 min     | Critica   |

### Logs

Los logs son JSON estructurado (pino) con los siguientes campos:

- `req.id` — Request ID unico (viene de header `x-request-id` o generado automaticamente)
- `req.method`, `req.url` — Metodo y URL del request
- `res.statusCode` — Codigo de respuesta
- `responseTime` — Tiempo de respuesta en ms

El endpoint `/api/v1/health` esta excluido del auto-logging para evitar ruido.

## Variables de Entorno

Ver [env-vars.md](./env-vars.md) para referencia completa.
