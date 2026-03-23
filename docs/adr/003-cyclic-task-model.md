# ADR-003: Tareas cíclicas — COMPLETED es transitorio

## Estado

Aceptada

## Contexto

Las tareas de mantenimiento preventivo son recurrentes (mensual, trimestral, anual). Al completar una tarea, debe reprogramarse automáticamente para el próximo ciclo.

## Decisión

- Al completar una tarea, el server crea un `TaskLog` (registro de completación) y resetea el status a `PENDING` con nueva `nextDueDate`
- `TaskStatus.COMPLETED` es un estado transitorio — nunca persiste más de milisegundos
- Para contar completaciones: usar `taskLogs: { some: {} }` en Prisma, nunca `status === COMPLETED`

## Consecuencias

- Las queries que cuenten "tareas completadas" por status siempre retornarán 0 — es un error silencioso común
- `TaskLog` es la fuente de verdad para el historial de completaciones
- La dimensión "compliance" del ISV usa TaskLog presence, no task status
- Documentado en SIEMPRE #93 del ai-development-guide
