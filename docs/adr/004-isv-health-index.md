# ADR-004: ISV — cálculo de 5 dimensiones con batch para listas

## Estado

Aceptada

## Contexto

El Índice de Salud de la Vivienda (ISV) necesita ser consistente entre todas las vistas (dashboard, property detail, properties table).

## Decisión

- **Una sola función de cálculo**: `computeHealthIndex(tasks, recentLogs, olderLogs, threeMonthsAgo)` en `HealthIndexRepository` — fórmula de 5 dimensiones ponderadas, invocada tanto por la versión single como batch
- **Dimensiones**: Compliance (35%), Condition (30%), Coverage (20%), Investment (15%), Trend (implícito)
- **Thresholds**: >=80 Excelente, >=60 Bueno, >=40 Regular, >=20 Necesita atención, <20 Crítico
- **Batch para listas**: `getPropertyHealthIndexBatch(planIds[])` hace 3 queries totales (tasks + recentLogs + olderLogs 3-6 meses) y computa per-plan en memoria, evitando N+1. El fetch de `olderLogs` es necesario para que trend se calcule correctamente en batch (antes del commit `43f624b` se omitía y trend caía al neutral 50)
- **Constantes compartidas**: `CONDITION_SCORE_PERCENT` y `PREVENTIVE_ACTIONS` en `@epde/shared`
- **Cache Redis (TTL 6h)**: Resultados cacheados bajo `health:*` + `streak:*`. `HealthIndexRepository.invalidateHealthCaches()` limpia ambos patrones vía `RedisService.delByPattern()` (SCAN + UNLINK en batches de 500, non-blocking). Se invoca tras `completeTask`/`updateTask`/`removeTask` y `generatePlanFromInspection` para evitar servir valores stale
- **Snapshots mensuales**: Cron job (`ISVSnapshotService`) almacena snapshots para historial y detección de caídas significativas (>=15 puntos), pero NO se usan para mostrar el ISV actual. Snapshots pre-`43f624b` tienen `trend=50` legacy — ver nota en `isv-snapshot.service.ts`

## Decisiones descartadas

- `getClientHealthScore()` (fórmula simplificada `completion% - overdue% × 50`): eliminada por generar valores diferentes al ISV real
- Snapshots como fuente para tabla de properties: eliminado — hasta 30 días de desfase

## Consecuencias

- Todas las vistas muestran exactamente el mismo número
- La lista de properties hace 3 DB queries (batch: tasks + recent/older logs) en vez de 3×N (individual)
- Los snapshots mensuales sirven solo para historial (gráfico de evolución) y alertas de caída
- El cron de snapshots (`ISVSnapshotService`, 1ro de cada mes 02:00 UTC) sigue existiendo intencionalmente — no es redundante con el cálculo real-time. Propósito: registro histórico para el gráfico de evolución + detección de caídas >=15 puntos para alertar al propietario
- Las mutaciones del plan (completar/editar/borrar task, generar plan) deben llamar `invalidateHealthCaches()` — si no, el usuario ve un ISV desactualizado hasta 6h (TTL)
- `HEALTH_INDEX_LIMITS` (tasks/logs) emite warn al truncar para detectar planes desproporcionados
