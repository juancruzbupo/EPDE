# ADR-011: Scope of `BaseRepository` — when to extend and when not to

## Estado

Aceptada — documenta el patrón ya en uso (PRs A-H de arch-remediation, abril 2026).

## Contexto

La clase `BaseRepository<T, M, TCreateInput, TUpdateInput>` vive en `apps/api/src/common/repositories/base.repository.ts`. Expone `findById`, `findByIdSelect`, `findMany` (cursor pagination), `create`, `update`, `softDelete`, `hardDelete`, `count` y `withTransaction`, además de los accesores `model` y `writeModel` que aplican (o no) la extensión de soft-delete.

En el momento de escribir esta ADR, **17 de 37 repositorios la extienden (~46%)**. Los 20 restantes no. La auditoría arquitectónica del 2026-04-14 marcó esto como "patrón a medio aplicar" — si la mitad no la usa, la abstracción no gana peso, y un dev nuevo no puede predecir cuándo le toca.

Esta ADR fija el criterio. No cambia código; solo enuncia la regla que los PRs recientes están aplicando.

## Decisión

**Un repositorio extiende `BaseRepository` cuando simultáneamente:**

1. El repositorio envuelve **un solo modelo Prisma**, y lo hace en forma 1:1 (no es un helper cross-model ni lee raw SQL).
2. El modelo usa **cursor-based pagination** (la standard del proyecto) y/o **soft-delete** (si el modelo está en `SOFT_DELETABLE_MODELS`). Cualquiera de las dos alcanza para que las utilities de `BaseRepository` aporten valor.
3. Las operaciones del repo son mayormente **CRUD estándar**: find by id, list, create, update, soft-delete. Custom business queries encima (`findPendingByReferredUser`, `findExpiringSubscriptions`) están OK, siempre que el modelo-base del repo sea el del include/where principal.

**NO extiende cuando:**

1. **Es cross-model**: la mayor parte de los métodos del repo operan sobre JOINs entre varios modelos o usan raw SQL (`$queryRaw`). Ej: `AnalyticsRepository`, `HealthIndexRepository`, `DashboardRepository`, `ISVSnapshotRepository`.
2. **No hay modelo base claro**: repositorios utility que leen/aggregan desde varias fuentes sin una entidad principal. Ej: `UserLookupRepository` (proyecciones narrow para emails / admin IDs), `DataCleanupRepository` (batch deletes orquestados).
3. **El modelo no usa cursor-pagination ni soft-delete**: bases inmutables/append-only tipo `FailedNotificationRepository`, `PushTokensRepository`, `BudgetAuditLogRepository`, `TaskAuditLogRepository`, `ServiceRequestAuditLogRepository`, `MilestoneRepository`. El CRUD genérico no aplica (no hay "update", no hay "softDelete") y `findMany` con cursor tampoco tiene sentido para audit logs que se leen time-ordered.
4. **Es un sub-recurso** con acceso siempre mediado por el parent (`BudgetCommentsRepository`, `BudgetAttachmentsRepository`, `ServiceRequestCommentsRepository`, `ServiceRequestAttachmentsRepository`, `TaskNotesRepository`, `TaskLogsRepository`): el repo vive solo para colocar queries cohesivas del sub-recurso — cursor pagination y soft-delete no suelen aplicar y el parent ya enforza ownership.

## Cómo aplicar la regla

- **Al crear un nuevo `*.repository.ts`**, decidir primero si cumple los 3 criterios de "extiende". Si sí → extender. Si no → agregar un **header comment JSDoc** al tope del archivo con la razón, usando una de las 4 categorías (cross-model / no-base / append-only / sub-recurso).
- El header debe apuntar a esta ADR: `See ADR-011.`
- Al hacer code review: si un nuevo repo no extiende y no tiene header, el reviewer pide uno o un refactor.

## Ejemplos

```ts
// apps/api/src/auth/milestone.repository.ts
/**
 * Append-only milestone tracker: rows are never updated or soft-deleted —
 * a new row is inserted each time a streak threshold is crossed. Neither
 * the cursor pagination nor the softDelete() helpers in BaseRepository
 * make sense here, so the repo works directly with the prisma client.
 * See ADR-011 (append-only).
 */
```

```ts
// apps/api/src/dashboard/analytics.repository.ts
/**
 * Cross-model analytics: aggregations that span Budget + ServiceRequest +
 * Task + ISVSnapshot. BaseRepository's single-model contract doesn't fit
 * — this repo is mostly groupBy / raw SQL. See ADR-011 (cross-model).
 */
```

## Consecuencias

- **Pro**: un dev nuevo puede predecir en 5 segundos si debe extender. La regla es operable sin leer la implementación de `BaseRepository`.
- **Pro**: las 4 categorías "no extiende" son estables — cubren el 100% de los casos observados. Si aparece un 5to, actualizar esta ADR.
- **Contra**: se acepta que el ratio de adopción nunca va a llegar a 100%. El 46% actual es **~= el 46% correcto** dados los tipos de datos del proyecto (abundancia de audit logs + sub-recursos + analytics).
- **Contra**: los header comments son un enforcement blando. Un ESLint rule custom "new repository extending nothing must have a block comment mentioning ADR-011" queda fuera de scope por ahora; el code review cubre.
