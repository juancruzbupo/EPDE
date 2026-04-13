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

## Consecuencias

- 8 modelos es el balance correcto para este proyecto — agrega auditoría donde importa sin complejidad innecesaria
- Modelos de bajo volumen (notas, comentarios) no justifican el overhead de la extension
- El caveat de nested includes es la fuente más común de bugs — mitigado por SIEMPRE #93, helpers en `soft-delete-include.ts`, y code review
- Si un nuevo modelo necesita soft-delete: agregar a `SOFT_DELETABLE_MODELS`, migración `deletedAt`, y verificar todos sus `include` en repositorios existentes
