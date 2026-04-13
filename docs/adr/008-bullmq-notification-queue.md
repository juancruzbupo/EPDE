# ADR-008: BullMQ para colas de notificaciones y emails

## Estado

Aceptada

## Contexto

El sistema necesita enviar notificaciones (in-app, push, email) como side-effects de operaciones de dominio (crear presupuesto, cambiar estado de servicio, etc.). Estas operaciones deben ser fire-and-forget desde la perspectiva del dominio — el usuario no espera a que el email se envíe.

Opciones evaluadas:

1. **EventEmitter2** — simple, en-memoria, sin retry ni persistencia
2. **BullMQ sobre Redis** — job queue con retry, backoff, dead-letter, concurrencia configurable
3. **RxJS Subjects** — reactivo, en-memoria, buen fit con NestJS

## Decisión

Usar BullMQ con Redis para las colas `email` y `notification`:

- **Cola `email`**: concurrencia 5, 3 reintentos con backoff exponencial (2s), jobId para idempotencia
- **Cola `notification`**: concurrencia 5, 3 reintentos, jobs single y batch
- **NotificationsHandlerService** como dispatcher centralizado (ver ADR-006)
- **FailedNotification** como dead-letter queue en Postgres para fallos que no son de cola (ver `notification-retry.service.ts`)

## Justificación

- **Persistencia**: Redis persiste jobs entre reinicios del proceso
- **Retry con backoff**: BullMQ maneja reintentos automáticamente (no necesitamos código custom para esto)
- **Observabilidad**: `removeOnFail: false` mantiene jobs fallidos para inspección; `MetricsService` registra duración
- **Multi-instancia**: Con Redis compartido, múltiples instancias de la API procesan jobs sin duplicación

EventEmitter2 fue descartado porque pierde mensajes si el proceso se reinicia y no ofrece retry nativo. RxJS fue descartado porque no persiste (misma limitación que EventEmitter para producción).

## Consecuencias

- Redis es requisito de infraestructura (ya requerido por caching y distributed locks)
- BullMQ agrega ~500ms de latencia al enqueue (aceptable para side-effects no-blocking)
- Los procesadores (`WorkerHost`) deben ser idempotentes — un job puede procesarse más de una vez en caso de crash
- El dead-letter queue (FailedNotification en Postgres) complementa a BullMQ para fallos a nivel de handler (no de cola)
