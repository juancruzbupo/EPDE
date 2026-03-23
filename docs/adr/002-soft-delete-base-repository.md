# ADR-002: Soft-delete via BaseRepository + Prisma extension

## Estado

Aceptada

## Contexto

El sistema necesita soft-delete para auditoría y recuperación de datos. Prisma no tiene soft-delete nativo.

## Decisión

- Prisma client extension (`PrismaService.softDelete`) que auto-filtra `deletedAt: null` en todas las queries
- `BaseRepository<T>` expone `model` (soft-delete filtered) y `writeModel` (raw) como getters
- Los repositorios heredan de BaseRepository y acceden a datos via `this.model`

## Caveat crítico

La soft-delete extension **NO aplica dentro de `$transaction` callbacks**. Dentro de transacciones, se debe agregar `deletedAt: null` manualmente en los where clauses. Esto está documentado con JSDoc en PrismaService y mencionado en el ai-development-guide.

## Consecuencias

- Imposible olvidar el filtro de soft-delete en queries normales (es automático)
- Dentro de transacciones hay riesgo de incluir registros borrados si se olvida el filtro manual — mitigado con documentación y code review
- `writeModel` existe para operaciones que necesitan acceder a registros soft-deleted (ej: restore)
