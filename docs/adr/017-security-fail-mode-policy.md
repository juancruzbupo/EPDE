# ADR 017 — Security fail mode policy: cuándo fail-open, cuándo fail-closed

**Estado**: Aceptada
**Fecha**: 2026-04-15

## Contexto

EPDE depende de Redis para tres cosas críticas de seguridad:

1. **Token rotation** — Lua script atómico en `rt:{family}` para detectar reuse attacks (`token.service.ts:rotateRefreshToken`).
2. **Access token blacklist** — `bl:{jti}` con TTL hasta expiry del token (`token.service.ts:blacklistAccessToken`).
3. **Rate limiting** — buckets por IP / IP+email para login, password reset, etc.

Cada uno de estos puede comportarse de dos formas cuando Redis no responde:

- **Fail-open**: bajo timeout/error, asumir "el cheque pasó" y dejar pasar el request. Prioriza disponibilidad.
- **Fail-closed**: bajo timeout/error, rechazar el request. Prioriza seguridad estricta.

La auditoría de seguridad del 2026-04-15 marcó dos comportamientos como hallazgos altos:
- `isBlacklisted()` (default) es fail-open — si Redis está caído, tokens en blacklist pasan.
- `revokeFamily()` previo a PR-S3 era fail-pass-through — si Redis fallaba, la familia **no** se revocaba pero el cliente recibía 500, dejando refresh tokens válidos hasta su expiry.

Esta ADR documenta la política explícita: **qué endpoint usa qué modo y por qué**. Sin esta política, futuros endpoints copian-pegan el patrón equivocado.

## Decisión

### Política general

| Operación | Modo | Justificación |
|---|---|---|
| Lectura de blacklist en cada request (`JwtAuthGuard`) | **fail-open** | El bus principal de la API depende de esto. Caer toda la API por un blip de Redis es peor que dejar pasar un token revocado por ≤15 min hasta que expire naturalmente. |
| Lectura de blacklist en endpoints sensibles (`StrictBlacklistGuard`) | **fail-closed** | Acciones destructivas o de credenciales — peor scenario es admitir un token que el usuario revocó hace minutos. |
| Escritura de blacklist al logout (`blacklistAccessToken`) | **fail-soft** (warn + continue) | Logout es best-effort; el cliente igual rota cookies. |
| Token rotation (`rotateRefreshToken` Lua eval) | **fail-closed** con retry | 3 reintentos exponenciales (100/200/400ms), si fallan → 503. Sin retry, refresh fallaría visiblemente bajo cualquier blip. |
| Revocación de familia (`revokeFamily`) | **fail-closed** con retry | Crítico bajo reuse-attack: si revoca falla, attacker mantiene refresh. PR-S3 agregó 3 reintentos + 503 final. |
| Rate limiting (`@nestjs/throttler`) | **fail-open** | Es defensa en profundidad; account lockout en `LoginAttemptService` es la guardia primaria. |

### Endpoints sensibles que DEBEN usar StrictBlacklistGuard

Cualquier endpoint que cumpla **uno** de estos criterios:

- Modifica credentials (password change, 2FA enable, recovery email)
- Operaciones admin destructivas (delete user, archive cliente con datos)
- Side-effect financiero o irreversible (approve budget, mark service as completed)
- Exposición de PII de otros usuarios (admin listings)

Ya están protegidos:
- `PATCH /auth/me/password` (`auth.controller.ts:275`)
- `clients.controller.ts:83` (admin client management)
- `referrals/admin-referrals.controller.ts:34` (admin referral oversight)

Si agregás un endpoint que cumple los criterios, agregar:
```ts
@StrictAuth()
@UseGuards(StrictBlacklistGuard)
@Patch('sensitive-operation')
```

### Decoradores y guards involucrados

- `@StrictAuth()` — metadata decorator marcando "este endpoint requiere fail-closed blacklist check"
- `StrictBlacklistGuard` — guard que lee la metadata + llama `tokenService.isBlacklistedStrict()`
- `JwtAuthGuard` (global) — usa `isBlacklisted()` (fail-open) para todos los demás endpoints

## Cuándo agregar reintentos en lugar de fail-open

Cuando una operación es:
- **Crítica** (no podemos perder consistencia)
- **De baja frecuencia** (no costaría performance retry)
- **Tiene un caller esperando** (puede tolerar 100-700ms extra)

Ejemplos: token rotation, family revocation. Patrón canónico:

```ts
let lastError: Error | undefined;
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    await operation();
    return;
  } catch (error) {
    lastError = error as Error;
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt)));
    }
  }
}
throw new ServiceUnavailableException('...');
```

Buscar este patrón en `token.service.ts` (rotateRefreshToken eval + revokeFamily) como referencia.

## Procedimiento de rotación de secretos (referenciado por SECURITY.md)

Cuando rotar:

| Secreto | Frecuencia | Trigger inmediato |
|---|---|---|
| `JWT_SECRET` | Cada 6 meses | Sospecha de leak; un dev sale del equipo |
| `DATABASE_URL` (password) | Cada 12 meses | Sospecha de leak; rotación de Neon credentials |
| `REDIS_URL` (Upstash token) | Cada 12 meses | Mismo |
| `RESEND_API_KEY` | Cada 12 meses | Mismo |
| `R2_*` (Cloudflare) | Cada 12 meses | Mismo |

Pasos para `JWT_SECRET`:

1. Generar nuevo secreto: `openssl rand -hex 32`
2. Actualizar el env var en el deploy (Vercel/Render/Fly/wherever)
3. Verificar que el deploy startup logueó la longitud del secreto (sin el valor)
4. **Todos los usuarios deben re-loguearse** — los tokens firmados con el secreto viejo serán rechazados. Sin coordinación, puede causar logout masivo.
5. Para evitar logout masivo: deploy con `JWT_SECRET_PREVIOUS` que valida tokens viejos por una ventana de 24h. (No implementado actualmente — agregar si rotación se vuelve frecuente.)

Pasos para credentials (DB, Redis, Resend, R2):

1. Generar nueva credential en el panel del provider
2. Actualizar env var en el deploy con el nuevo valor
3. Verificar conectividad post-deploy
4. Revocar la credential vieja en el provider

## Consecuencias

**Positivo**
- Política explícita evita "copiar el patrón equivocado". Nuevos endpoints sensibles encuentran este doc + el `StrictBlacklistGuard` y lo usan.
- El trade-off availability-vs-security está documentado por endpoint, no asumido.
- Procedimiento de rotación es referenciable en runbooks.

**Negativo**
- Mantenimiento: si agregamos un nuevo Redis-dependent guard, hay que decidir y documentar acá. Sin esta ADR el dev podría no saber que existe el patrón.
- La fail-open de `JwtAuthGuard` global sigue siendo una decisión consciente — un Redis caído da una ventana de hasta 15 min donde tokens revocados pasan. Mitigación: monitoring de Redis health + alertas en latency p99.

## Cuándo revisitar

- Si Redis tiene un outage real y se observa que tokens revocados pasaron → considerar mover `JwtAuthGuard` a fail-closed (costo: caída total de la api durante outage).
- Si se agrega 2FA → debe usar `StrictBlacklistGuard` por default.
- Si se introduce token versioning (rotación rolling) → reemplaza el patrón actual.
