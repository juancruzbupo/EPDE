# Security Runbook — EPDE

Operational playbook for the security controls in the EPDE monorepo. Written for oncall / ops — assumes familiarity with the codebase but not with every auth detail.

---

## Quick reference: where each control lives

| Control                         | File                                                                                                                   | Notes                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| JWT sign/verify config          | [apps/api/src/auth/auth.module.ts](apps/api/src/auth/auth.module.ts)                                                   | HS256 + `iss=epde-api` + `aud=epde-client`                                                   |
| JWT strategy (validate)         | [apps/api/src/auth/strategies/jwt.strategy.ts](apps/api/src/auth/strategies/jwt.strategy.ts)                           | Reads cookie then Bearer header                                                              |
| Token rotation (Lua)            | [apps/api/src/auth/token.service.ts](apps/api/src/auth/token.service.ts)                                               | `rotateRefreshToken` + `ROTATE_LUA`                                                          |
| Strict blacklist (fail-closed)  | [apps/api/src/common/guards/strict-blacklist.guard.ts](apps/api/src/common/guards/strict-blacklist.guard.ts)           | Gated by `@StrictAuth()`                                                                     |
| Email-aware rate limiter        | [apps/api/src/common/guards/email-aware-throttler.guard.ts](apps/api/src/common/guards/email-aware-throttler.guard.ts) | Key = `ip:email`                                                                             |
| Account lockout                 | [apps/api/src/auth/login-attempt.service.ts](apps/api/src/auth/login-attempt.service.ts)                               | 10 fails / 15 min                                                                            |
| Mass-assignment defense         | [apps/api/src/common/pipes/zod-validation.pipe.ts](apps/api/src/common/pipes/zod-validation.pipe.ts)                   | `ZodObject.strict()`                                                                         |
| Soft-delete extension           | [apps/api/src/prisma/prisma.service.ts](apps/api/src/prisma/prisma.service.ts)                                         | `this.softDelete.{model}`                                                                    |
| CSP headers                     | [apps/web/next.config.ts](apps/web/next.config.ts)                                                                     | `headers()` callback                                                                         |
| Web middleware role gate (edge) | [apps/web/src/middleware.ts](apps/web/src/middleware.ts)                                                               | Decodifica JWT y redirige CLIENT fuera de `ADMIN_ONLY_PREFIXES`                              |
| Web admin guard (server-side)   | [apps/web/src/lib/server-auth.ts](apps/web/src/lib/server-auth.ts)                                                     | `requireAdmin()` en layouts de `(dashboard)/{clients,categories,landing-settings,templates}` |
| `$transaction` soft-delete lint | [eslint-rules/no-tx-without-soft-delete-filter.mjs](eslint-rules/no-tx-without-soft-delete-filter.mjs)                 | Error en lint si falta `deletedAt: null` en tx                                               |
| Mobile query persister          | [apps/mobile/src/app/\_layout.tsx](apps/mobile/src/app/_layout.tsx)                                                    | `dehydrateOptions.shouldDehydrateQuery` + `CACHE_SCHEMA_VERSION`                             |

---

## Incident response

### 1. Redis is down

**Symptoms:** `ServiceUnavailableException` at login, refresh, and on endpoints marked `@StrictAuth()`. Revoked tokens may still work on other endpoints during the outage.

**What still works:**

- Reading data (`GET /...`) with a valid, non-revoked access token
- Most mutations with valid tokens

**What fails:**

- Login (`generateTokenPair` requires Redis for token family storage)
- Token refresh (`rotateRefreshToken` requires Redis Lua script)
- Password change (`@StrictAuth()` — fail-closed blacklist)
- Destructive admin endpoints: `DELETE /properties/:id`, `DELETE /clients/:id`

**Action:**

1. Check Redis health: `redis-cli -u $REDIS_URL ping`
2. Check connection limits in Upstash dashboard
3. If Redis is recovering, existing sessions continue working (fail-open default on `isBlacklisted`). New logins remain blocked until Redis returns
4. Post-incident: audit `auth_audit_log` for any anomalous activity during the window

---

### 2. Token reuse attack detected

**Symptoms:** log entry `token_reuse_attack` in `AuthAuditService` logs + `authAuditLog` table. Redis key `rt:{family}` was deleted automatically.

**Happens when:**

- Attacker stole a refresh token (via XSS, SSRF, log leak) and tried to use it after the legitimate client already rotated it
- Or client has a bug that sends stale refresh tokens

**Action:**

1. Check Sentry for the `token_reuse_attack` event and correlate with the user ID
2. Query `authAuditLog` for all activity by that user in the last 24h: `SELECT * FROM "AuthAuditLog" WHERE "userId" = '...' ORDER BY "createdAt" DESC`
3. If you see suspicious geo/IP patterns, force a password reset for that user
4. If many unrelated users hit this, consider rotating `JWT_SECRET` — **this logs everyone out**

---

### 3. Account lockout triggered

**Symptoms:** Users report "Demasiados intentos fallidos. Intentá de nuevo en 15 minutos." HTTP 429 from `/auth/login`.

**Triggered by:** 10+ failed login attempts against the same email within 15 min. Redis key: `epde:login_fail:{email}`.

**To manually unlock a specific account:**

```bash
redis-cli -u $REDIS_URL DEL "epde:login_fail:user@example.com"
```

**If a real user is locked out because they forgot their password:**

1. Tell them to wait 15 min, OR
2. Manually clear the counter, OR
3. Tell them to use `/forgot-password` (separate counter, not affected)

**If the attack is ongoing (many emails locked):**

- Review `@epde/api` logs for IPs hitting many emails
- Consider blocking the IP range at the edge (Cloudflare/Render)

---

### 4. Rotate `JWT_SECRET`

**When:** suspected secret compromise, or scheduled rotation (quarterly recommended).

**Impact:** **Every session is invalidated.** All users must log in again. Mobile apps will auto-refresh → fail → redirect to login.

**Steps:**

1. Generate new secret: `openssl rand -hex 32`
2. Update in Render dashboard env vars (`JWT_SECRET`)
3. Trigger new deploy
4. Monitor Sentry for any 401 spikes (expected for a few minutes)
5. Purge stale Redis keys (optional, they'll TTL out): `redis-cli --scan --pattern 'epde:rt:*' | xargs redis-cli DEL`

---

### 5. Rotate database credentials

**When:** Neon / DB password compromised.

**Steps:**

1. In Neon dashboard, rotate the role password for `neondb_owner`
2. Update `DATABASE_URL` in Render dashboard + in your local `.env`
3. Trigger new deploy
4. Verify health check: `curl https://api.epde.com.ar/api/v1/health`
5. If the old password was committed anywhere historically: `git log --all -S '<old-password>'`

---

### 6. Invalidate all sessions (emergency logout)

**When:** mass compromise, legal hold, or major auth change.

**Steps:**

```bash
# Clear all refresh token families
redis-cli -u $REDIS_URL --scan --pattern 'epde:rt:*' | xargs redis-cli -u $REDIS_URL DEL

# Clear all blacklist entries (not strictly needed — they TTL out)
redis-cli -u $REDIS_URL --scan --pattern 'epde:bl:*' | xargs redis-cli -u $REDIS_URL DEL

# Clear all login fail counters (optional — gives users a clean slate)
redis-cli -u $REDIS_URL --scan --pattern 'epde:login_fail:*' | xargs redis-cli -u $REDIS_URL DEL
```

After flush, active access tokens still work until they expire (15 min max). To fully invalidate immediately, rotate `JWT_SECRET` (see §4).

---

### 7. Suspected CSP violation

**When:** users report broken UI, or you see `Content-Security-Policy-Report-Only` reports in Sentry (when/if we enable report-only mode).

**Current CSP** (web only): see [apps/web/next.config.ts](apps/web/next.config.ts). Notable: `'unsafe-inline'` is allowed for script + style because Next.js App Router requires it. If this tightens (nonce-based), update this runbook.

**Common causes:**

- New third-party embed (YouTube, Google Maps, etc.) — add to `frame-src` or `connect-src`
- New image CDN — add to `img-src`
- Sentry new region — add to `connect-src`

**Temporary relief during incident:** comment out the CSP header in `next.config.ts` and redeploy. Do **not** ship this permanently.

---

## Security boundaries (what is and isn't enforced)

### Enforced at the API layer

- ✅ Input validation: every endpoint behind `ZodValidationPipe` with `.strict()` mode (rejects unknown keys)
- ✅ Rate limiting: per-IP default + per-email on login/forgot-password
- ✅ Account lockout: 10 fails / 15 min per email
- ✅ Auth: JWT HS256 + iss/aud claims + JTI blacklist + family rotation + reuse detection
- ✅ Roles: `@Roles(...)` required on every non-`@Public` endpoint (`RolesGuard` default-deny)
- ✅ Subscription: `SubscriptionGuard` blocks CLIENTs with expired subs on every request
- ✅ Ownership: services verify `userId` before returning/modifying client-owned resources (SIEMPRE #56)
- ✅ Soft-delete: reads auto-filter `deletedAt: null` via Prisma extension (with caveats — SIEMPRE #72, #82); `$transaction` callbacks enforzados por la ESLint rule `local/no-tx-without-soft-delete-filter` (SIEMPRE #96)
- ✅ Role-based routing (web): middleware edge (fast path) + server-side layout guard (`requireAdmin()`) defense-in-depth sobre `/clients`, `/categories`, `/landing-settings`, `/templates` (SIEMPRE #98)
- ✅ CORS: explicit origin whitelist, `*` rejected at bootstrap with `credentials: true`
- ✅ Fail-closed blacklist on destructive admin + password-change endpoints
- ✅ Pino redact on sensitive request headers + body fields

### NOT enforced (documented gaps)

- ❌ Mobile cert pinning (SIEMPRE #28 — pre-release TODO)
- ❌ Mobile root/jailbreak detection (L4 — accepted risk, evaluate pre-release)
- ❌ CSP nonce-based (M1 — follow-up work, `unsafe-inline` acceptable for Next.js App Router)
- ❌ Forced password reset for legacy weak passwords (M7 — product decision)

---

## Audit events to monitor in Sentry

Set Sentry alerts on these `AuthAuditService` events:

- `token_reuse_attack` — **HIGH priority**, potential account compromise
- `subscription_expired_refresh` — spike indicates billing issue, not security
- `login_failed` — sustained spike = brute-force attempt

Normal events (info, not alerts):

- `login`, `logout`, `password_set`, `token_rotated`

---

## Quarterly security review checklist

- [ ] `pnpm audit --audit-level=high` — review and patch findings
- [ ] Rotate `JWT_SECRET` (see §4)
- [ ] Review pnpm overrides in root `package.json` — can any be removed because upstream fixed?
- [ ] Check Dependabot PRs backlog
- [ ] Run `pnpm -F @epde/api test:e2e` to verify auth flows still work
- [ ] Review `authAuditLog` for any `token_reuse_attack` events in the last quarter
- [ ] Verify Redis TLS is enforced in production (`rediss://`)
- [ ] Verify CORS origin whitelist is current (no stale staging domains)
