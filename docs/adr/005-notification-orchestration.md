# ADR-005: NotificationsHandlerService como punto único de side-effects

## Estado

Aceptada

## Contexto

Múltiples acciones del dominio (crear presupuesto, completar tarea, actualizar servicio) generan notificaciones, emails y push notifications. Sin centralización, cada service tendría lógica de notificación dispersa.

## Decisión

- `NotificationsHandlerService` es el **único punto de entrada** para side-effects de notificación
- Domain services llaman `void this.notificationsHandler.handleXxx()` (fire-and-forget)
- El handler orquesta: DB notification + BullMQ email queue + push notification
- Cada método del handler tiene su propio try/catch — errores de notificación nunca fallan la operación principal
- BullMQ procesa emails y push async con retry + exponential backoff

## Consecuencias

- Los domain services no conocen los detalles de notificación (email templates, push tokens, etc.)
- Un solo archivo para auditar toda la lógica de notificación
- Fire-and-forget: si Redis cae, las notificaciones se pierden pero la operación principal sigue funcionando
- Trade-off: el handler crece con cada nuevo tipo de notificación — monitorear tamaño
