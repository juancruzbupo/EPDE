# ADR-018: Professionals directory — internal admin tool

## Estado

Aceptada — implementada en abril 2026.

## Contexto

Muchas de las tareas del catálogo de mantenimiento requieren profesional matriculado (plomero, electricista, arquitecto, etc.). La auditoría de 2026-04-18 del schema de `TaskTemplate` encontró **66 tareas** marcadas con `professionalRequirement` en `PROFESSIONAL_REQUIRED` o `PROFESSIONAL_RECOMMENDED`, repartidas en **13 especialidades distintas**.

Cuando un cliente genera una `ServiceRequest` de ese tipo, el admin necesita derivarle el trabajo a un profesional. Hasta ahora esto era completamente externo a la plataforma — WhatsApp personal, planillas, memoria. Eso producía:

- El admin se olvida a quién llamó, cuánto pagó, cómo trabajó
- Derivaciones inconsistentes (mismo plomero para dos clientes vecinos, o tres trabajos simultáneos a uno que ya está saturado)
- Imposibilidad de hacer crecer el equipo (nadie más del staff tiene la info en su cabeza)
- Sin trazabilidad de matrícula/seguro (riesgo legal si contratamos a alguien con documentación vencida)

## Decisión

Creamos un **directorio interno de profesionales matriculados**, visible solo para admin, con:

1. CRUD de profesionales con matrícula obligatoria + seguro RC opcional (con fechas de vencimiento que dispara un cron de alerta)
2. Asignación 1:1 entre `ServiceRequest` y `Professional`, con sugerencia automática top-3 al abrir el asignador (filtrado por especialidad + zona, ordenado por tier + rating bayesiano + anti-fatiga)
3. Sistema de valoración del admin (1-5 general + 3 sub-ratings: puntualidad, calidad, precio) + timeline de notas privadas + tags operativos
4. Tracking de pagos que EPDE hace al profesional (status PENDING → PAID) por trabajo
5. Sistema de tier A/B/C/BLOCKED para escala de confianza rápida

### Decisiones de diseño

**Entidad pasiva (sin auth)**: el profesional no tiene cuenta ni login. Es una entrada en la base que el admin mantiene. Si en el futuro queremos un portal profesional, la migración es aditiva.

**Matrícula obligatoria al crear**: `registrationNumber` + `registrationBody` son campos requeridos en el `Professional` row. El comprobante en sí (foto) se sube después como `ProfessionalAttachment` de tipo `MATRICULA` con `expiresAt` obligatorio. Esto nos permite tener al profesional en el sistema rápido, pero el cron de expiry ya detecta que no hay matrícula subida cuando venga el momento.

**EPDE paga al profesional (no el cliente directo)**: el cliente paga a EPDE por el servicio, EPDE le paga al profesional su parte. Eso es lo que justifica la existencia del modelo `ProfessionalPayment` y el lock-in comercial (si el cliente llamara al profesional directo, EPDE pierde la comisión — por eso el cliente nunca ve el nombre del profesional en su propia UI, ni siquiera en la notificación del SR).

**Ratings solo del admin**: el cliente puede dejar un comentario post-completación de SR, pero ese comentario no afecta el score numérico. Evita review bombing de un cliente enojado único, le da al admin control editorial, y prepara el terreno para abrir rating de cliente cuando escalemos con un baseline ya calibrado.

**Rating bayesiano con prior (m=3.5, C=5)**: un profesional nuevo con 1 rating de 5⭐ no debería empatar con uno veterano con 50 ratings de 4.5⭐. Usamos smoothing: `(sum + m·C) / (count + C)`.

**Smart match con anti-fatiga**: sort primario por tier, secundario por rating, terciario por `lastAssignedAt DESC`. El criterio terciario rota carga — evita que siempre asignemos al mismo "más fresco" arriba, balanceando la carga entre profesionales del mismo tier + rating.

**Blocked professionals**: no se pueden asignar nuevos SRs, pero los existentes se mantienen hasta cerrar. Razón obligatoria en el campo `blockedReason` (enforced en el Zod schema + service).

**Matrícula / seguro RC vencidos → auto-unavailable**: el cron `matricula-expiry` (diario 11:00 UTC) no sólo notifica sino que flipea `availability` a `UNAVAILABLE` cuando algo efectivamente vence. El admin recibe notificación con razón explícita. No bloquea la asignación a rajatabla (admin retains control) pero filtra del smart-match.

## Modelo de datos

7 modelos nuevos + 5 enums en `apps/api/prisma/schema.prisma`:

| Modelo                            | Rol                                                                      |
| --------------------------------- | ------------------------------------------------------------------------ |
| `Professional`                    | Entidad raíz. Soft-delete, matrícula+body requeridos, tier, availability |
| `ProfessionalSpecialtyAssignment` | Multi-especialidad con una flag `isPrimary`                              |
| `ProfessionalAttachment`          | Comprobantes: matrícula, seguro RC, DNI, certs                           |
| `ProfessionalRating`              | Scores del admin + campo separado para comentario del cliente            |
| `ProfessionalTimelineNote`        | Feed de notas privadas tipo bitácora                                     |
| `ProfessionalTag`                 | Tags operativos (#confiable, #caro, #impuntual)                          |
| `ServiceRequestAssignment`        | 1:1 con SR. Unique constraint enforcement                                |
| `ProfessionalPayment`             | Pagos EPDE→profesional, status machine                                   |

Ver `docs/data-model.md` para el detalle completo.

## Endpoints

Admin-only, requieren rol `ADMIN`. Todos bajo `/professionals/*` excepto asignaciones (bajo `/service-requests/:id/assign`).

- `GET /professionals` — listado con filtros (search, specialty, tier, availability, zone)
- `GET /professionals/suggested?specialty=X&serviceArea=Y&limit=3` — smart match
- `GET /professionals/:id` — detalle con stats agregadas
- `POST /professionals` — crear (matrícula obligatoria)
- `PATCH /professionals/:id` — actualizar datos básicos + especialidades
- `PATCH /professionals/:id/tier` — cambiar tier (BLOCKED requiere razón)
- `PATCH /professionals/:id/availability` — AVAILABLE/BUSY/UNAVAILABLE
- `DELETE /professionals/:id` — soft-delete
- `POST/DELETE /professionals/:id/ratings/:id` — CRUD valoraciones
- `POST /professionals/:id/notes` — timeline note
- `POST/DELETE /professionals/:id/tags/:tag` — CRUD tags
- `POST/PATCH/DELETE /professionals/:id/attachments/:id` — docs + verify
- `POST/DELETE /service-requests/:id/assign` — asignar/quitar profesional
- `GET/POST /professionals/:id/payments` — listar / registrar pagos
- `PATCH /professional-payments/:id` — actualizar status

## Arquitectura

**ProfessionalsRepository** extiende BaseRepository (soft-delete, cursor pagination). Tiene `findManyWithInclude` y `findDetailById` para los dos modos de lectura + `computeStats` para agregaciones (rating bayesiano + counts + totales de pago).

**Sub-repos**: `ProfessionalSubRepository` (ratings, notes, tags, attachments), `AssignmentsRepository` (cross-model SR+Professional, ADR-011 cross-model), `PaymentsRepository` (sub-recurso, ADR-011 sub-recurso). Los dos últimos no extienden BaseRepository — documentado con JSDoc siguiendo ADR-011.

**No-prisma-in-service enforced**: toda lectura/escritura va por un repository.

**Scheduler hot zone**: `MatriculaExpiryService` agrega una importación más a `SchedulerModule`. Cron `0 11 * * *`.

## Riesgos y mitigaciones

| Riesgo                                                    | Mitigación                                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Admin se olvida de subir matrícula tras crear profesional | Cron detecta ausencia cuando llega la fecha de renovación; profesional sin matrícula aparece filtrado del smart-match   |
| Cliente ve nombre del profesional y lo llama directo      | Cliente nunca accede al recurso `/professionals` (middleware admin-only). SR muestra "EPDE está coordinando" sin nombre |
| Profesional nuevo empata con veterano por rating          | Bayesian smoothing con prior m=3.5, C=5                                                                                 |
| Smart-match siempre devuelve al mismo                     | Anti-fatiga por `lastAssignedAt DESC` como tiebreaker                                                                   |
| Block tier sin razón queda opaco                          | Zod + service + UI enforcement triple                                                                                   |

## Consecuencias

- **Pro**: el ecosistema se vuelve defensible — EPDE no es solo "lista de tareas", es también "red de profesionales filtrada y validada por nosotros"
- **Pro**: habilita futuros features — portal profesional, pagos P2P, comisiones por asignación, certificaciones internas
- **Pro**: el admin deja de depender de su memoria — puede haber reemplazo/crecimiento del staff sin perder contexto
- **Contra**: 7 modelos + 11+ endpoints + UI completa = superficie grande para mantener. Mitigado por consistencia de patrones (repository + service + controller)
- **Contra**: matrícula con `expiresAt` requiere disciplina operativa — si nadie actualiza el comprobante, el profesional termina unavailable y el admin se entera tarde. El cron mitiga pero no elimina

## Siguiente

- PR-9: seed demo data
- Futuro (no committeado): portal del profesional (auth, vista de SRs asignadas, sync de availability), comisiones automáticas por SR cerrada, integración con calendario para bookings
