# ADR-004: ISV — cálculo de 5 dimensiones con batch para listas

## Estado

Aceptada

## Contexto

El Índice de Salud de la Vivienda (ISV) necesita ser consistente entre todas las vistas (dashboard, property detail, properties table).

## Decisión

- **Una sola función de cálculo**: `getPropertyHealthIndex()` en `DashboardRepository` — fórmula de 5 dimensiones ponderadas
- **Dimensiones**: Compliance (35%), Condition (30%), Coverage (20%), Investment (15%), Trend (implícito)
- **Thresholds**: >=80 Excelente, >=60 Bueno, >=40 Regular, >=20 Necesita atención, <20 Crítico
- **Batch para listas**: `getPropertyHealthIndexBatch(planIds[])` hace 2 queries totales (tasks + logs) y computa per-plan en memoria, evitando N+1
- **Constantes compartidas**: `CONDITION_SCORE_PERCENT` y `PREVENTIVE_ACTIONS` en `@epde/shared`
- **Snapshots mensuales**: Cron job (`ISVSnapshotService`) almacena snapshots para historial y detección de caídas significativas (>=15 puntos), pero NO se usan para mostrar el ISV actual

## Decisiones descartadas

- `getClientHealthScore()` (fórmula simplificada `completion% - overdue% × 50`): eliminada por generar valores diferentes al ISV real
- Snapshots como fuente para tabla de properties: eliminado — hasta 30 días de desfase

## Consecuencias

- Todas las vistas muestran exactamente el mismo número
- La lista de properties hace 2 DB queries (batch) en vez de 3×N (individual)
- Los snapshots mensuales sirven solo para historial (gráfico de evolución) y alertas de caída
- El cron de snapshots (`ISVSnapshotService`, 1ro de cada mes 02:00 UTC) sigue existiendo intencionalmente — no es redundante con el cálculo real-time. Propósito: registro histórico para el gráfico de evolución + detección de caídas >=15 puntos para alertar al propietario
