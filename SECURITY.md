# Security Policy

## Reportar una vulnerabilidad

Si encontrás una vulnerabilidad de seguridad en EPDE, **NO abras un issue público en GitHub**.

Reportala privadamente:

- Email: juancruzbupo@gmail.com (asunto: `[SECURITY] EPDE - <descripción breve>`)
- Incluir: pasos para reproducir, impacto observado, versión/commit afectado.

Se responde en menos de 72hs. Se publicará el fix antes de discutir el detalle público.

## Versiones soportadas

Solo `main` recibe parches de seguridad. No hay branches de mantenimiento de versiones anteriores.

## Modelo de seguridad

Lectura recomendada antes de tocar código de auth o data access:

- [ADR-002 — Soft-delete via BaseRepository](docs/adr/002-soft-delete-base-repository.md)
- [ADR-009 — Alcance del soft-delete + criterios](docs/adr/009-soft-delete-scope.md)
- [ADR-017 — Security fail mode policy](docs/adr/017-security-fail-mode-policy.md)

Convenciones enforzadas en CI (ESLint rules custom):

- `local/no-prisma-in-service` — services no inyectan PrismaService directo (forzar paso por Repository → soft-delete + ownership checks aplicados consistentemente)
- `local/no-tx-without-soft-delete-filter` — transacciones sobre modelos soft-deletable deben filtrar `deletedAt: null` manual (la extensión de Prisma no aplica dentro de `$transaction`)
- `local/no-soft-deletable-include-without-filter` — nested includes en modelos soft-deletable deben filtrar (la extensión solo intercepta operaciones root)

## Procedimiento de rotación de secretos

Cuándo rotar y cómo, ver [ADR-017 sección "Procedimiento de rotación"](docs/adr/017-security-fail-mode-policy.md#procedimiento-de-rotación-de-secretos-referenciado-por-securitymd).

Resumen rápido (rotaciones rutinarias cada 6-12 meses según secreto):

| Secreto | Frecuencia base | Trigger inmediato |
|---|---|---|
| `JWT_SECRET` | 6 meses | Sospecha de leak; un dev sale del equipo |
| `DATABASE_URL` password | 12 meses | Mismo |
| `REDIS_URL` token | 12 meses | Mismo |
| `RESEND_API_KEY` | 12 meses | Mismo |
| `R2_*` keys | 12 meses | Mismo |

**Importante**: rotar `JWT_SECRET` invalida todos los tokens activos → logout masivo. Coordinar con horario de bajo tráfico.

## Validaciones automáticas en startup

`apps/api/src/config/config.module.ts` rechaza al boot:

- `JWT_SECRET` con menos de 32 chars
- `JWT_SECRET` con valores conocidos como placeholders públicos (`your-super-secret-jwt-key-change-in-production`, `secret`, `changeme`, etc.)
- `CORS_ORIGIN` ausente en production/staging
- `CORS_ORIGIN` con protocol no-HTTPS en production
- `REDIS_URL` sin TLS (`rediss://`) en production
- `DATABASE_URL` sin `connection_limit=` en production

Si un valor no pasa, el proceso muere con mensaje explícito antes de aceptar requests.

## Dependencias vulnerables

Política: `pnpm audit` se corre en cada PR. Se aceptan vulnerabilidades en dependencias **dev/build-only** (eslint, vite, shadcn-cli) si no hay fix disponible. Vulnerabilidades en runtime deps deben pinearse vía `pnpm.overrides` en `package.json` o documentarse explícitamente.

Overrides actuales (ver [package.json](package.json) sección `pnpm.overrides`): multer, serialize-javascript, express-rate-limit, follow-redirects, node-forge, path-to-regexp, tar, undici, lodash, ajv, @xmldom/xmldom.

## File uploads

Validados con magic bytes (no solo MIME del cliente):

- Allowlist en `apps/api/src/upload/upload.controller.ts` — solo image/jpeg, image/png, image/webp, image/gif, application/pdf
- SVG explícitamente NO permitido (puede contener `<script>`)
- Filename sanitizado con regex `[^a-zA-Z0-9._-]` → `_`
- Tamaño máximo: 10MB
- Content-Disposition: attachment

Si necesitás aceptar un nuevo tipo, validar magic bytes + considerar XSS implications.

## Endpoints sensibles que requieren `StrictBlacklistGuard`

Endpoints con efecto de credenciales o destructivo deben usar el guard fail-closed:

```ts
@StrictAuth()
@UseGuards(StrictBlacklistGuard)
```

Lista actual: ver [ADR-017](docs/adr/017-security-fail-mode-policy.md#endpoints-sensibles-que-deben-usar-strictblacklistguard).

Si agregás un endpoint que cumple los criterios documentados (modifica credentials / es destructivo / expone PII de otros usuarios), aplicar el guard.
