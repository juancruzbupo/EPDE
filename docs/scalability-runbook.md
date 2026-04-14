# Scalability Runbook — EPDE

Pre-2000 user infrastructure guide. Code changes for pre-50/200/500 users are already implemented. This document covers infrastructure items that require ops/deployment changes, not code.

---

## Current Scale Readiness

| Scale          | Status            | Notes                                                                       |
| -------------- | ----------------- | --------------------------------------------------------------------------- |
| 0-50 users     | ✅ Ready          | Streak batch query, email 10x concurrency, Sentry cron alerting             |
| 50-200 users   | ✅ Ready          | Health index cache (Redis 6h TTL), token rotation retry, slow query logging |
| 200-500 users  | ✅ Ready          | User triple index, notification maxPages 5                                  |
| 500-2000 users | ⚠️ Requires infra | See items below                                                             |

---

## L1 — Redis Cluster / Managed Service

**When:** > 500 concurrent sessions (typically ~500 active users)

**Current:** Single Redis 7 instance, 512MB maxmemory (dev), volatile-lru eviction policy.

**Risk:** At 500+ users, Redis memory usage grows to ~50-100MB (token families + blacklist + lockout counters + health cache + BullMQ queues). If memory hits the ceiling, volatile-lru evicts keys with TTL — which includes refresh token families, breaking active sessions silently.

**Action:**

1. **Managed Redis** (recommended): Use Upstash, AWS ElastiCache, or Redis Cloud with automatic failover, 1GB+ memory, and persistence
2. **Redis Cluster** (self-managed): ioredis supports Cluster mode natively �� change `new Redis(url)` to `new Redis.Cluster([{ host, port }])` in `redis.service.ts`
3. **Memory monitoring:** ✅ Implemented — `RedisService.getMemoryInfo()` + Prometheus gauges `redis_memory_bytes` / `redis_memory_percentage` via `MetricsCollectorService` (30s interval). Alert at 80% of maxmemory

**Migration to managed Redis — zero code changes required:**

All Redis consumers already handle `rediss://` (TLS) URLs:

- `RedisService` (redis.service.ts:30-34): auto-enables `tls: { rejectUnauthorized: true }` for `rediss://`
- `config.module.ts`: enforces `rediss://` in production
- `BullModule.forRootAsync` (core.module.ts:67-87): parses URL, applies TLS conditionally
- `ThrottlerStorageRedisService` (core.module.ts:32-35): passes URL to `new Redis(url)` — ioredis auto-detects `rediss://` protocol

To migrate: update `REDIS_URL` env var in Render dashboard. No code deploy required.

```env
# Production REDIS_URL should point to managed Redis with TLS
REDIS_URL=rediss://default:password@your-redis.upstash.io:6379
```

---

## L2 — Mobile Cache Reduction

**When:** Users report slow app / high storage usage on older devices

**Current:** React Query `gcTime: 24h` + AsyncStorage persistence. Keeps 24h of cached data on device.

**Action:**

1. Reduce `gcTime` in `apps/mobile/src/lib/query-client.ts` from `24 * 60 * 60_000` to `6 * 60 * 60_000`
2. Add "Limpiar caché" button in `apps/mobile/src/app/(tabs)/profile.tsx` that calls `queryClient.clear()` + `AsyncStorage.clear()` for cache keys
3. Monitor AsyncStorage size in Sentry breadcrumbs

**Estimated effort:** 3 hours

---

## L3 — Database Backup Automation

**When:** Before production launch (any scale)

**Current:** Neon (production DB) provides automatic daily backups with 7-day retention on paid plans. Local development uses Docker volume with no backup.

**Action:**

1. **Verify Neon plan** includes point-in-time recovery (PITR) — available on Scale plan
2. **Document restore procedure:**
   ```bash
   # Neon dashboard → Branches → Create branch from backup point
   # Update DATABASE_URL to point to restored branch
   # Verify data: SELECT COUNT(*) FROM "User", "Property", "Task"
   ```
3. **Test restore quarterly:** Create a branch from 24h backup, connect staging API, verify data integrity
4. **RTO/RPO targets:** RTO = 15 minutes (branch creation + deploy), RPO = 24 hours (daily backup)

---

## L4 — Horizontal Scaling / Autoscaling

**When:** > 200 concurrent API requests (typically ~500 active users)

**Current:** ✅ Configured in `render.yaml` — min 2 / max 5 instances, 80% memory / 70% CPU targets.

**Statelessness:** The API is stateless by design — all state is in PostgreSQL + Redis. No local file storage, no in-memory sessions. ✅ Ready for multi-instance.

**Cron deduplication:** All 12 cron jobs use `DistributedLockService.withLock()` — only one instance executes each cron. All 12 also report heartbeats via `Sentry.withMonitor()` for silent-failure detection. ✅ Already handled.

**Health checks:**

- Liveness (`/api/v1/health`): DB + Redis ping — used by Render load balancer
- Readiness (`/api/v1/health/ready`): DB + Redis + queue backlog — for deployment verification

**Connection pool sizing:**

| Instances | `connection_limit` | Total connections | Neon pooler capacity |
| --------- | ------------------ | ----------------- | -------------------- |
| 2 (min)   | 20                 | 40                | 100 (60% headroom)   |
| 5 (max)   | 20                 | 100               | 100 (saturated)      |

Formula: `connection_limit = neon_pooler_max / max_instances`. With Neon's 100 pooled connections and 5 max instances, use `connection_limit=20`. BullMQ workers connect to Redis (not DB), so they don't count toward the pool.

---

## L5 — Per-Endpoint Rate Limiting

**When:** API abuse detected or > 1000 users

**Current:** ✅ Comprehensive per-endpoint rate limiting implemented.

**Strategy:**

1. **Global 3-tier** (ThrottlerModule): 10/s, 60/10s, 300/min — applies to all endpoints by default
2. **Per-endpoint `@Throttle`**: 40+ endpoints have custom limits. Highlights:
   - Auth: 5/min login, 3/hour password reset, `EmailAwareThrottlerGuard` (IP+email composite key)
   - Upload: 3/s, 20/min
   - Dashboard analytics: 10/min (aggregation queries — tighter than class-level 30/min)
   - Write operations: 5-10/min depending on endpoint
3. **Storage**: Redis-backed via `ThrottlerStorageRedisService` — survives instance restarts

**Deferred:** IP + userId composite key for authenticated endpoints — implement when abuse is detected. Current IP-only throttle is appropriate for B2B SaaS with known user base.

---

## Connection Pool Configuration

**DATABASE_URL must include `connection_limit` in production:**

```env
# Development (single instance, local PG)
DATABASE_URL="postgresql://epde:password@localhost:5433/epde?schema=public&connection_limit=5"

# Production (Neon pooler, multiple instances)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.neon.tech/neondb?schema=public&connection_limit=20&sslmode=require"
```

**Why:** Prisma default pool is 1-4 connections per instance. With cron jobs + concurrent requests, this exhausts quickly. Set to 20 for production.

---

## Monitoring Checklist

| Metric                | Tool                         | Alert Threshold                        |
| --------------------- | ---------------------------- | -------------------------------------- |
| Redis used_memory     | Prometheus/Upstash dashboard | > 80% of maxmemory                     |
| DB connection count   | `pg_stat_activity`           | > 80% of connection_limit              |
| Email queue depth     | BullMQ metrics               | > 100 waiting jobs                     |
| Cron execution time   | `cron_execution_ms` metric   | > 60s for any cron                     |
| Cron failures         | Sentry                       | Any `captureException` from scheduler/ |
| API response time p99 | Sentry performance           | > 2s                                   |
| Slow queries          | Prisma event log             | > 500ms                                |

---

## Quarterly Scale Review Checklist

- [ ] `pnpm audit --audit-level=high`
- [ ] Check Redis memory usage (Upstash dashboard or `INFO memory`)
- [ ] Check DB connection pool utilization (`pg_stat_activity`)
- [ ] Review Sentry for cron failures in last quarter
- [ ] Test Neon backup restore (create branch from 24h backup)
- [ ] Review email queue depth trends (BullMQ dashboard)
- [ ] Check if any `findMany` queries lack `take` limits (grep codebase)
- [ ] Verify health index cache hit rate (Redis key count for `health:*`)
- [ ] Monitor `health:*` + `streak:*` key churn — `invalidateHealthCaches()` corre en cada mutación de task (`complete`/`update`/`remove`) y en `generatePlanFromInspection`. Si hit rate cae bruscamente, revisar si una mutación se está disparando en loop

## Health index cache invalidation

**Keys:** `health:*` (por propiedad/plan) + `streak:*` (rachas de cumplimiento). TTL 6h.

**Invalidación:** `HealthIndexRepository.invalidateHealthCaches()` usa `RedisService.delByPattern()`, que ejecuta `SCAN MATCH <prefix>:<pattern> COUNT 500` + `UNLINK` (no-blocking) en batches. Escala a decenas de miles de keys sin bloquear el event loop.

**Callers autorizados (obligatorios):**

- `TaskLifecycleService.completeTask / updateTask / removeTask` — cambian compliance/condition/investment/trend
- `InspectionsService.generatePlanFromInspection` — siembra plan + TaskLogs baseline

**Failure mode:** Si Redis está caído, `invalidateHealthCaches()` loguea warn y sigue (fail-open). El usuario puede ver ISV stale hasta que el TTL expira o Redis vuelve. No reintentamos porque no vale bloquear el request.

**Límite `HEALTH_INDEX_LIMITS`:** Emitimos warn al truncar tasks/recentLogs/olderLogs. Si aparece en logs, revisar el plan: >1000 tareas o >10k logs indica uso atípico.
