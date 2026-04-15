# ADR-012: Architectural remediation — closeout + ongoing enforcement map

## Estado

Aceptada — cierra el plan de 8 PRs (ARCH-1 a ARCH-8) ejecutado en abril 2026.

## Contexto

La auditoría arquitectónica del 2026-04-14 identificó **24 hallazgos** (7 medium, 3 critical, 8 inconsistencies, 6 drift-risk zones) en el monorepo EPDE. El plan de remediación agrupó los hallazgos en 8 PRs y los ejecutó en una semana.

Este ADR **no introduce convenciones nuevas**. Documenta: qué quedó enforzado por código, qué quedó enforzado por test, qué quedó como prose, y cómo sostener la coherencia.

## Lo que cambió

### Nuevas ESLint rules custom (enforzamiento en CI)

| Rule                                             | Scope                                                | Qué detecta                                                                                                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local/no-prisma-in-service`                     | `apps/api/src/**/*.service.ts`                       | `this.prisma.*` fuera de allowlist (auth-audit, metrics-collector). Cierra SIEMPRE #4.                                                                                              |
| `local/no-tx-without-soft-delete-filter`         | `apps/api/src/**/*.ts`                               | Reads/updates en modelos soft-deletable dentro de `$transaction` o `withTransaction` sin `deletedAt: null` filter. Cierra SIEMPRE #96. Ahora trackea ambos formatos (raw + helper). |
| `local/no-soft-deletable-include-without-filter` | `apps/api/src/**/*.ts`                               | Nested `include: { relation: true }` sin filter en modelo soft-deletable. Cierra SIEMPRE #93.                                                                                       |
| `local/mobile-query-requires-stale-time`         | `apps/mobile/src/hooks/**/*.ts`                      | `useQuery`/`useInfiniteQuery` sin `staleTime` explícito. Cierra SIEMPRE #100.                                                                                                       |
| `local/no-inline-risk-threshold`                 | `apps/web/src/**`, `apps/mobile/src/**`              | Comparaciones `riskScore >= 12` / `>= 6` en vez de `getRiskLevel(score)`.                                                                                                           |
| `max-lines: 150`                                 | `apps/web/src/hooks/use-*.ts` (excl. split variants) | Hook combinado que debe splittearse en `*-queries.ts` + `*-mutations.ts`. Cierra SIEMPRE #43.                                                                                       |

### Nuevos drift tests (enforzamiento en CI)

Ubicados en `packages/shared/src/__tests__/`:

| Test                           | Qué compara                                                                                | Qué cacha                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design-tokens-parity.test.ts` | `DESIGN_TOKENS_{LIGHT,DARK}` (shared) vs `:root`/`.dark` de `apps/web/src/app/globals.css` | Drift de valor de cualquier token entre JS y CSS. Cuando se escribió cachó 2 drifts reales.                                                                                                   |
| `typography-parity.test.ts`    | `TYPE` en `apps/mobile/src/lib/fonts.ts` vs tabla en `docs/design-system.md`               | fontSize/lineHeight drift entre código y doc. Cachó 1 drift (bodySm).                                                                                                                         |
| `query-keys-parity.test.ts`    | `QUERY_KEYS` en shared vs `apps/web/src/` y `apps/mobile/src/`                             | Dead keys + referencias a keys inexistentes. Cachó 1 dead key (taskTemplates).                                                                                                                |
| `zod-prisma-enum-sync.test.ts` | Enums de `apps/api/prisma/schema.prisma` vs TS enums en `packages/shared/src/types/`       | Drift entre valores de Prisma (autoritativo en DB) y TS enums que alimentan Zod/tipos. Sin esto, agregar un valor en Prisma sin actualizar TS deja Zod rechazando filas válidas, y viceversa. |

### Refactors estructurales

1. **`notifications-handler.service.ts` 628 LOC → 245 LOC facade + 7 handler classes por bounded context** (`handlers/{budget, service-request, task, referral, subscription, account, property-health}-handlers.ts`). Shared infra via `HandlerContext`.
2. **`referrals.service.ts`**: 11 `this.prisma.*` → 0. 6 métodos movidos a `UsersRepository`, tx boundary via `repo.withTransaction`. Nuevo `referrals.repository.spec.ts`.
3. **`inspections.service.ts` + `task-lifecycle.service.ts`**: mismo patrón (4 violations → 0). `MaintenancePlansRepository.existsForProperty` nuevo.
4. **`metrics-collector.service.ts`**: documentado como excepción (queries `pg_stat_activity`, no hay domain entity).

### Documentación

| ADR / doc    | Qué documenta                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------- |
| **ADR-010**  | Programa de recomendación (pre-existing, referenciado por contexto)                            |
| **ADR-011**  | Scope de `BaseRepository` — 3 criterios para extender + 4 categorías válidas para no extender  |
| **ADR-012**  | Este documento (closeout)                                                                      |
| `SIEMPRE #4` | Actualizado: allowlist de 2 services + pointer a `withTransaction` como idiom para tx boundary |

### Otros cambios

- **Routes central**: `apps/web/src/lib/routes.ts` con 20+ keys, 40 hrefs migrados en 27 archivos.
- **`BaseRepository.withTransaction`**: wrapper Prisma `$transaction` con soporte de `{ maxWait, timeout, isolationLevel }`.
- **Shared test coverage**: 14 files (~339 tests) → 18 files (383 tests). Nuevos: `errors.test.ts`, `due-date.test.ts`, más los 3 parity tests.
- **Factory exceptions**: header en `packages/shared/src/api/index.ts` listando los 4 dominios que skip el pattern intencionalmente (`auth`, `upload`, `landing-settings`, `inspections`).

## Lo que NO cambió (con rationale)

1. **Dedup `lib/api/*` mirror files entre web y mobile** (audit M4): ~30 archivos de 3 líneas cada uno. Extraer un helper ahorra ~45 LOC a cambio de indirección que rompe ctrl-click-to-source en IDEs. Net value negativo. Skipped.
2. **Split mobile hooks** (use-budgets 245 LOC, use-service-requests 211, use-task-operations 202): SIEMPRE #76 documenta que mobile combina por diseño — no hay admin rol en mobile así que no hay dos consumidores que justifiquen el split.
3. **Dark mode `dark:` Tailwind prefix mass coverage**: el audit inicial lo flaggeó como "0.2% coverage" pero la verificación mostró que shadcn + CSS variables patrón hace el flip automáticamente vía `.dark` class sobre `:root`. No hay gap real.

## Cómo sostener la coherencia (operativo)

**Cada SIEMPRE #N debe resolver en uno de estos 3 tipos de enforcement:**

1. **ESLint rule custom** en `eslint-rules/` — enforza en CI, falla el build.
2. **Drift test** en `packages/shared/src/__tests__/*-parity.test.ts` — enforza en CI, falla el build.
3. **Decorador o guard runtime** (menos común) — fallja en runtime.

Si una convención SIEMPRE #N queda como **prose-only** en `docs/ai-development-guide.md`, está **condenada a drift**. Esa era la enseñanza de la auditoría original.

**Cuando se agregue una nueva convención**:

- Primero evaluar si cabe en una rule existente (extender).
- Si no, crear rule o test nuevo.
- Solo si ambos son imposibles, documentar como prose + marcar como "manual enforcement via code review".

## Métricas del antes/después

| Dimensión                              | Audit 2026-04-14 | Post-remediación                  | Delta                                                  |
| -------------------------------------- | ---------------- | --------------------------------- | ------------------------------------------------------ |
| `this.prisma.*` violations en services | 15               | 0                                 | -15                                                    |
| Notifications handler LOC              | 628              | 245 (facade) + 7 × ~50 (handlers) | Cross-cutting hasta +220 por agregado, pero dispersado |
| Shared test count                      | ~339             | 383                               | +44                                                    |
| ESLint rules custom                    | 3                | 6                                 | +3                                                     |
| Drift tests (parity)                   | 1 (superficial)  | 3 (value-level)                   | +2                                                     |
| Tokens drifts en globals.css           | 2 (undetected)   | 0                                 | -2                                                     |
| Dead QUERY_KEYS entries                | 1                | 0                                 | -1                                                     |
| Typography drift doc ↔ code            | 1 (labelMd)      | 0                                 | -1                                                     |
| Web route hardcoded hrefs              | 40               | 0                                 | -40                                                    |
| ADRs referenciables                    | 10               | 12                                | +2                                                     |

**Score proyectado** (estimación de la auditoría para post-plan):

- Coherencia estructural: 8.0 → 8.5 ✓
- Seguimiento de patrones: 6.5 → 9.0 ✓
- Mantenibilidad: 7.0 → 8.5 ✓
- Claridad arquitectónica: 8.0 → 9.0 ✓
- **Promedio: 7.4 → 8.8** ✓

## Consecuencias

- **Pro**: la disciplina de "convención → enforcement" ahora es la norma. Un dev junior no puede quebrar silenciosamente las reglas de repository / soft-delete / query-key / token / typography / risk-threshold porque el CI las catcha.
- **Pro**: el god service de notificaciones se cortó — nuevos handlers agregan archivos chicos, no hinchan el existente. Merge conflicts por el mismo archivo son mucho menos probables.
- **Contra**: más archivos (7 handler files en notifications, 2 ADRs, 3 drift tests) → más superficie para revisar. Mitigado por el patrón consistente.
- **Contra**: algunos enforcement rules son duplicados entre root y apps/api eslint config para que husky/lint-staged funcionen desde cualquier CWD. Documentado en los headers. Si ESLint publica una mejor forma de compartir config spread, migrar.

## Siguiente

No hay siguiente PR planificado. El backlog de auditoría 2026-04-14 está cerrado. La próxima auditoría puede reusar el mismo plan-and-execute framework — los patrones establecidos (rules + drift tests + ADRs) son reutilizables.
