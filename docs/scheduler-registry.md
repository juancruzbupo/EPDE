# Scheduler Registry — Cron Jobs

Todos los cron jobs del sistema, con su frecuencia, horario en Argentina, y SLA esperado.

## Jobs activos

| Job                        | Cron (UTC)   | Hora (AR)            | Servicio                         | Descripción                         | SLA    |
| -------------------------- | ------------ | -------------------- | -------------------------------- | ----------------------------------- | ------ |
| task-status-recalculation  | `0 9 * * *`  | 06:00 diario         | `TaskStatusService`              | PENDING→UPCOMING (30d) / OVERDUE    | <5min  |
| task-upcoming-reminders    | `5 9 * * *`  | 06:05 diario         | `TaskReminderService`            | Push a clientes con tareas próximas | <2min  |
| task-safety-sweep          | `10 9 * * *` | 06:10 diario         | `TaskSafetyService`              | Corrige anomalías de status         | <1min  |
| budget-expiration-check    | `30 9 * * *` | 06:30 diario         | `BudgetExpirationService`        | Cierra presupuestos vencidos        | <1min  |
| service-request-auto-close | `0 10 * * *` | 07:00 diario         | `ServiceRequestAutoCloseService` | Cierra SRs resueltas hace 7d+       | <1min  |
| subscription-reminder      | `0 9 * * *`  | 06:00 diario         | `SubscriptionReminderService`    | Notifica vencimiento de suscripción | <1min  |
| weekly-summary             | `0 12 * * 1` | 09:00 lunes          | `WeeklySummaryService`           | Resumen semanal push + email        | <10min |
| isv-monthly-snapshot       | `0 2 1 * *`  | 23:00 último día mes | `ISVSnapshotService`             | Snapshot ISV mensual por propiedad  | <15min |
| notification-cleanup       | `0 3 * * 0`  | 00:00 domingo        | `NotificationCleanupService`     | Limpia notificaciones leídas viejas | <5min  |
| data-cleanup               | `0 3 * * *`  | 00:00 diario         | `DataCleanupService`             | Limpieza de datos huérfanos         | <5min  |

## Notas

- Todos los jobs usan `DistributedLockService` para evitar ejecución duplicada en multi-instancia.
- `MetricsService.recordCronExecution()` registra duración de cada job.
- Si un job falla, el error se loguea pero no bloquea los siguientes (cada job es independiente).
- Horarios escalonados entre 06:00-07:00 AR para evitar contención en la DB.
