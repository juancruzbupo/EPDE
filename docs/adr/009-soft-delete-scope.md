# ADR-009: Alcance del soft-delete — 8 modelos con Prisma extension

## Estado

Aceptada (complementa ADR-002)

## Contexto

ADR-002 estableció el mecanismo de soft-delete (Prisma extension + BaseRepository). Esta ADR documenta **qué modelos** tienen soft-delete y por qué otros no.

## Modelos con soft-delete (extension automática)

Estos 8 modelos están declarados en `SOFT_DELETABLE_MODELS` en `prisma.service.ts`. La extension auto-filtra `deletedAt: null` en operaciones root (findMany, findFirst, findUnique, count, aggregate, groupBy):

| Modelo              | Motivo del soft-delete                                    |
| ------------------- | --------------------------------------------------------- |
| User                | Auditoría legal, posible reactivación                     |
| Property            | Cascada a planes/tareas, recuperación de datos            |
| Task                | Historia de mantenimiento, reportes retroactivos          |
| Category            | Tareas existentes la referencian, no se puede hard-delete |
| BudgetRequest       | Registro financiero y auditoría                           |
| ServiceRequest      | Trazabilidad de servicios prestados                       |
| InspectionChecklist | Auditoría de inspecciones realizadas                      |
| InspectionItem      | Parte de la checklist, mismo ciclo de vida                |

## Modelos con `deletedAt` pero SIN extension

Estos modelos tienen campo `deletedAt` en el schema pero **no** están en la extension. El filtrado es manual:

| Modelo           | Razón de exclusión de la extension                                                    |
| ---------------- | ------------------------------------------------------------------------------------- |
| MaintenancePlan  | Ciclo de vida controlado por `PlanStatus` (DRAFT→ACTIVE→ARCHIVED), no por soft-delete |
| TaskNote         | Bajo volumen, filtrado manual en `findWithDetails`                                    |
| BudgetComment    | Bajo volumen, filtrado manual en queries específicas                                  |
| BudgetAttachment | Bajo volumen, filtrado manual                                                         |
| TaskAuditLog     | Audit trail — soft-delete del log mismo es raro                                       |

## Caveat crítico: nested includes

La Prisma extension **solo intercepta operaciones root** del modelo. No aplica dentro de `include: { relation: true }` — esas son resueltas como JOINs internos que bypasean la extension.

**Regla**: Cualquier `include: { <modelo>: true }` donde el modelo tiene `deletedAt` DEBE agregar `where: { deletedAt: null }` explícitamente. Ver `apps/api/src/prisma/soft-delete-include.ts` para constantes helper.

## Criterios para agregar un modelo (agregado 2026-04-15)

Antes de extender la lista, validar los **3 criterios simultáneamente** (todos deben aplicar):

1. **Auditoría relevante** — hay una razón legal, comercial u operacional para mantener historia. Audit logs no califican: son append-only por construcción y no necesitan soft-delete.
2. **Recuperabilidad útil** — existe un flujo realista de "deshacer borrado" que alguien va a invocar (admin restaura cliente; user des-archiva propiedad). Si la única intención al borrar es remoción permanente, hard-delete alcanza.
3. **NO es state machine** — el ciclo de vida no está modelado por enum de estado. Si transiciones de status cubren el caso "removido pero visible" (ej. `PlanStatus.ARCHIVED`, `BudgetStatus.REJECTED`), usar la state machine — agregar soft-delete crea **dos formas** de significar "ya no está" y van a driftear.

Comentario equivalente vive en `apps/api/src/prisma/prisma.service.ts` arriba de `SOFT_DELETABLE_MODELS` para que el lector encuentre los criterios donde los necesita.

### Ejemplos de aplicación

- **MaintenancePlan**: criterio (3) lo descarta — `PlanStatus { DRAFT, ACTIVE, ARCHIVED }` ya cubre el lifecycle. Si alguien propone agregarlo "por consistencia", el comentario en `prisma.service.ts` lo bloquea.
- **Referral** (ADR-010): criterio (2) lo descarta — un referral nunca se "des-borra". Es append-only, transición one-way.
- **Notification**: criterio (1) lo descarta — sin valor de auditoría una vez que el user clear-all el inbox.

## Consecuencias

- 8 modelos es el balance correcto para este proyecto — agrega auditoría donde importa sin complejidad innecesaria
- Modelos de bajo volumen (notas, comentarios) no justifican el overhead de la extension
- El caveat de nested includes es la fuente más común de bugs — mitigado por SIEMPRE #93, helpers en `soft-delete-include.ts`, y code review
- Si un nuevo modelo necesita soft-delete: validar los 3 criterios primero, luego agregar a `SOFT_DELETABLE_MODELS`, migración `deletedAt`, y verificar todos sus `include` en repositorios existentes
