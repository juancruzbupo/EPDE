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

**Current:** Single Redis 7 instance, 256MB maxmemory, volatile-lru eviction policy.

**Risk:** At 500+ users, Redis memory usage grows to ~50-100MB (token families + blacklist + lockout counters + health cache + BullMQ queues). If memory hits 256MB, volatile-lru evicts keys with TTL — which includes refresh token families, breaking active sessions silently.

**Action:**

1. **Managed Redis** (recommended): Use Upstash, AWS ElastiCache, or Redis Cloud with automatic failover, 1GB+ memory, and persistence
2. **Redis Cluster** (self-managed): ioredis supports Cluster mode natively �� change `new Redis(url)` to `new Redis.Cluster([{ host, port }])` in `redis.service.ts`
3. **Memory monitoring:** Add Prometheus gauge for Redis `used_memory` via `INFO memory` command. Alert at 80% of maxmemory

**Config change:**

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

**Current:** Single API instance on Render. Cron jobs use distributed locks (Redis SETNX) which work correctly with multiple instances.

**Action:**

1. **Render autoscaling:** Configure in `render.yaml`:
   ```yaml
   scaling:
     minInstances: 2
     maxInstances: 5
     targetMemoryPercent: 80
     targetCPUPercent: 70
   ```
2. **Verify statelessness:** The API is stateless by design — all state is in PostgreSQL + Redis. No local file storage, no in-memory sessions. ✅ Ready for multi-instance.
3. **Cron deduplication:** All 12 cron jobs already use `DistributedLockService.withLock()` — only one instance executes each cron. ✅ Already handled.
4. **Health check:** Already configured at `/api/v1/health` checking DB + Redis.

**Connection pool consideration:** With N instances × 20 connections each = 100 connections for 5 instances. Neon pooler handles this. Verify `connection_limit` in DATABASE_URL.

---

## L5 — Per-Endpoint Rate Limiting

**When:** API abuse detected or > 1000 users

**Current:** 3-tier global throttle (short: 10/s, medium: 60/10s, long: 300/min) + email-aware throttle on login/forgot-password.

**Action (when needed):**

1. Add `@Throttle({ custom: { limit: X, ttl: Y } })` to specific endpoints:
   - Dashboard analytics: `limit: 10, ttl: 60_000` (expensive queries)
   - File upload: `limit: 5, ttl: 60_000` (bandwidth intensive)
   - Bulk operations: `limit: 3, ttl: 60_000`
2. Consider IP + userId composite key for authenticated endpoints (prevent single user from hogging resources)

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
