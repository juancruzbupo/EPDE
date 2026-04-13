# ADR 001 — Async Execution Patterns

**Status:** Accepted  
**Date:** 2026-04-13  
**Deciders:** Engineering team

---

## Contexto

El API tiene tres mecanismos para diferir o desacoplar trabajo del request/response cycle:

1. **`@Cron` (NestJS Scheduler)** — jobs temporizados que corren en el proceso API.
2. **BullMQ queues** — jobs encolados procesados por workers (`notification`, `emails`).
3. **Fire-and-forget** — llamadas `async` sin `await` dentro de un request handler.

Sin una regla explícita, los desarrolladores eligen el patrón por familiaridad o por el que ya ven en contexto, produciendo mezcla de patrones para el mismo tipo de problema.

---

## Decisión

### Cuándo usar `@Cron`

Usar para trabajo **periódico y sin disparador de usuario**:

- Recálculo de estado de tareas (daily, 06:00 AR)
- Recordatorios de suscripción (daily, 06:05 AR)
- Snapshot ISV (daily, 06:10 AR)
- Aniversarios de propiedad (daily, 10:00 AR)
- Limpieza de notificaciones viejas (weekly, Sunday 03:00 UTC)
- Challenge semanal (weekly, Monday 08:00 AR)
- Verificación de streaks (daily, 00:05 AR)

**Reglas:**

- Todos los jobs DEBEN estar envueltos en `DistributedLockService.withLock()` para evitar ejecución simultánea en multi-instancia.
- Todos DEBEN reportar a Sentry Cron Monitor (`captureCheckIn`) + `MetricsService`.
- Todos DEBEN tener deduplicación de notificaciones (`findToday*Ids()` en el repository correspondiente).
- Documentar en `docs/scheduler-registry.md` al agregar un job nuevo.

### Cuándo usar BullMQ

Usar para trabajo **disparado por acción de usuario** que puede fallar y necesita reintentos:

- Envío de emails transaccionales (reset password, activación de cuenta, presupuesto)
- Envío de notificaciones push (ServiceRequest creado, budget aprobado, tarea vencida)

**Reglas:**

- Usar las queues existentes: `notification` (queue `NotificationQueue`) y `emails` (queue `EmailQueue`).
- Los producers son `NotificationsHandlerService` y `EmailService` — no crear producers ad-hoc en feature services.
- Los jobs DEBEN definir `attempts` y `backoff` en la job options. Default: 3 intentos, backoff exponencial.
- NUNCA crear una nueva queue BullMQ sin consenso del equipo — la lista actual cubre todos los casos de uso.

### Cuándo usar fire-and-forget

Usar **solo** para efectos secundarios **no críticos y sin reintentos** dentro de un request:

- `notificationsHandler.handleProblemDetected()` dentro de `completeTask` — la tarea ya completó; la notificación es best-effort.
- Cualquier caso donde la falla NO debe revertir la operación principal.

**Reglas:**

- El patrón es `void someAsyncFn()` o `someAsyncFn().catch((e) => this.logger.error(e))`.
- NUNCA usar fire-and-forget para emails o acciones visibles al usuario.
- NUNCA usar fire-and-forget si la operación modifica datos críticos (pagos, estado de suscripción, logs de auditoría).
- Documentar en JSDoc del call site que el efecto es fire-and-forget y por qué.

---

## Consecuencias

| Escenario                                                      | Patrón correcto               |
| -------------------------------------------------------------- | ----------------------------- |
| Enviar email de reset password                                 | BullMQ (`emails` queue)       |
| Notificar al admin de nuevo ServiceRequest                     | BullMQ (`notification` queue) |
| Recalcular tareas vencidas cada noche                          | `@Cron` + DistributedLock     |
| Registrar en log que se detectó un problema al completar tarea | Fire-and-forget (`void`)      |
| Limpiar notificaciones antiguas semanalmente                   | `@Cron` + DistributedLock     |
| Enviar push notification cuando se aprueba un presupuesto      | BullMQ (`notification` queue) |

### Por qué no un cuarto patrón (setTimeout, setInterval)

`setTimeout`/`setInterval` nativos no se integran con el lifecycle de NestJS, no respetan `onApplicationShutdown`, y no tienen visibilidad en Sentry ni métricas. Están prohibidos — usar `@Cron` o BullMQ.

### Por qué no async workers externos (SQS, Cloud Tasks)

El volumen actual (< 1000 usuarios) no justifica la complejidad operacional de un servicio de colas externo. BullMQ + Redis cubre la durabilidad y reintentos necesarios. Revisitar si el volumen supera 50k eventos/día.
