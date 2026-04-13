# Scheduler Registry — Cron Jobs

Todos los cron jobs del sistema, con su frecuencia, horario en Argentina, y SLA esperado.

## Jobs activos

| Job                        | Cron (UTC)   | Hora (AR)            | Servicio                         | Entidades tocadas             | Descripción                          | SLA    |
| -------------------------- | ------------ | -------------------- | -------------------------------- | ----------------------------- | ------------------------------------ | ------ |
| task-status-recalculation  | `0 9 * * *`  | 06:00 diario         | `TaskStatusService`              | Task                          | PENDING→UPCOMING (30d) / OVERDUE     | <5min  |
| subscription-reminder      | `0 9 * * *`  | 06:00 diario         | `SubscriptionReminderService`    | User, Notification            | Notifica vencimiento de suscripción  | <1min  |
| task-upcoming-reminders    | `5 9 * * *`  | 06:05 diario         | `TaskReminderService`            | Task, Notification, Email     | Push a clientes con tareas próximas  | <2min  |
| task-safety-sweep          | `10 9 * * *` | 06:10 diario         | `TaskSafetyService`              | Task                          | Corrige anomalías de status          | <1min  |
| budget-expiration-check    | `30 9 * * *` | 06:30 diario         | `BudgetExpirationService`        | BudgetRequest                 | Cierra presupuestos vencidos         | <1min  |
| service-request-auto-close | `0 10 * * *` | 07:00 diario         | `ServiceRequestAutoCloseService` | ServiceRequest                | Cierra SRs resueltas hace 7d+        | <1min  |
| weekly-challenge-generate  | `0 11 * * 1` | 08:00 lunes          | `WeeklyChallengeService`         | WeeklyChallenge               | Genera desafío semanal para clientes | <2min  |
| weekly-summary             | `0 12 * * 1` | 09:00 lunes          | `WeeklySummaryService`           | TaskLog, User, Email          | Resumen semanal push + email         | <10min |
| anniversary-check          | `0 13 * * *` | 10:00 diario         | `AnniversaryService`             | User, Email, Push             | Celebra aniversario de 1 año         | <2min  |
| isv-monthly-snapshot       | `0 2 1 * *`  | 23:00 último día mes | `ISVSnapshotService`             | ISVSnapshot                   | Snapshot ISV mensual por propiedad   | <15min |
| notification-cleanup       | `0 3 * * 0`  | 00:00 domingo        | `NotificationCleanupService`     | Notification                  | Limpia notificaciones leídas viejas  | <5min  |
| data-cleanup               | `0 3 * * *`  | 00:00 diario         | `DataCleanupService`             | varios (soft-deleted records) | Limpieza de datos huérfanos          | <5min  |

## Secuenciación intencional (ventana 06:00-06:10 AR)

Los primeros tres jobs diarios están escalonados por diseño:

1. **task-status** (06:00) — Recalcula los estados de todas las tareas primero.
2. **subscription-reminder** (06:00) — Corre en paralelo con task-status (entidades distintas, sin contención).
3. **task-reminder** (06:05) — Lee los estados **ya actualizados** por task-status antes de enviar notificaciones.
4. **task-safety** (06:10) — Barre anomalías después de que task-status y task-reminder terminaron.

**Regla para nuevos jobs:** Si el job toca `Task` o `Notification` entre 06:00 y 06:15 AR, verificar si necesita esperar a que `task-status` termine. Si el job genera notificaciones de tipo `TASK_REMINDER` en cualquier horario, agregar deduplicación via `NotificationsRepository.findTodayReminderTaskIds()`.

## Mecanismos de deduplicación

| Job                     | Mecanismo                                                                |
| ----------------------- | ------------------------------------------------------------------------ |
| task-upcoming-reminders | `findTodayReminderTaskIds()` — skip tasks ya notificadas hoy             |
| subscription-reminder   | `findTodaySubscriptionReminderUserIds()` — skip users ya notificados hoy |
| isv-monthly-snapshot    | `upsert` por `(propertyId, year, month)` — idempotente                   |
| anniversary-check       | Filtra por `activatedAt` exacto ±1 día — baja colisión                   |

## Notas operativas

- Todos los jobs usan `DistributedLockService.withLock()` con watchdog para evitar ejecución duplicada en multi-instancia.
- `MetricsService.recordCronExecution()` registra duración de cada job.
- `Sentry.withMonitor()` reporta ejecución exitosa/fallida a Sentry Cron Monitors.
- Si un job falla, el error se loguea + Sentry pero no bloquea los siguientes (cada job es independiente).
- El `SchedulerModule` importa 9 módulos de dominio — cualquier cambio en módulos importados **debe verificar** que los cron jobs asociados siguen funcionando (ver comentario en `scheduler.module.ts`).
