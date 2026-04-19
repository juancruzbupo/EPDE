# Backlog — Oportunidades de negocio y features futuras

## Re-inspección profesional (servicio premium)

**Qué es:** La arquitecta vuelve a visitar la propiedad después de X meses (6/12) para re-evaluar el estado de todos los puntos del plan. Compara contra la inspección original y ajusta prioridades.

**Por qué es una oportunidad de negocio:**

- Se cobra como servicio adicional (no está incluido en el diagnóstico inicial)
- Genera confianza: un profesional valida que el mantenimiento del cliente está bien hecho
- Detecta nuevos problemas que el cliente no vería → más solicitudes de servicio
- Alimenta el ISV con datos reales de campo (no solo lo que el cliente reporta)

**Cómo se implementaría:**

- La arquitectura ya lo soporta: se pueden crear múltiples `InspectionChecklist` por propiedad
- Nueva inspección genera items desde las tareas existentes del plan (no desde templates)
- Al completar, ajusta prioridades y `professionalRequirement` de tareas existentes (no crea un plan nuevo)
- Nuevo endpoint: `POST /inspections/:checklistId/apply-to-plan` que actualiza tareas del plan vigente
- UI: botón "Re-inspección" en el tab de inspección cuando ya existe un plan

**Cuándo implementar:** Cuando el flujo core (inspección inicial → plan → cliente opera) esté validado con clientes reales y haya demanda de seguimiento profesional.

**Modelo de pricing sugerido:**

- Incluir 1 re-inspección anual en el plan base (retención)
- Re-inspecciones adicionales como servicio pago
- O paquete premium con re-inspecciones trimestrales

## Composite Risk Score v2 (con costos reales)

> **v1 IMPLEMENTADA** (2026-04-08) — `computeRiskScore()` en `@epde/shared`, campo `riskScore` en Task, plan viewer ordena por score, badge visual en tareas.

**Fórmula actual (v1):** `priority_weight × severity_weight × sector_weight`

- Priority: URGENT=4, HIGH=3, MEDIUM=2, LOW=1
- Severity: NEEDS_PROFESSIONAL=3, NEEDS_ATTENTION=2, OK=1
- Sector: estructurales (ROOF, EXTERIOR, BASEMENT, INSTALLATIONS) = 1.5x, resto = 1.0x

**v2 futura:** Reemplazar `sector_weight` por costos reales de reparación (promedio de presupuestos aprobados por tipo). Requiere acumular datos de BudgetResponse.totalAmount agrupados por categoría.

## Server-side PDF generation

**Qué es:** Generar PDFs del informe técnico (inspección, plan, ISV) desde el servidor para envío automático por email.

**Estado actual:** Existe `/properties/[id]/report/` con 12 componentes que renderizan el informe en HTML. El usuario puede imprimir a PDF con `window.print()`.

**Por qué no ahora:** `window.print()` es suficiente para MVP. Server-side se necesita cuando queramos enviar informes por email automáticamente (ej: después de completar inspección).

**Cómo se implementaría:**

- Puppeteer o Playwright en el backend para renderizar la página de reporte
- Endpoint `GET /reports/:propertyId/pdf` que genera y retorna el PDF
- Integración con EmailQueueService para envío automático

---

### Inspección — Pendientes

**Fase 1 — Quick wins** (todas implementadas)

1. ~~**Sectores al crear la propiedad**~~ — DONE. `create-property-dialog.tsx` renderiza checkbox grid de `PROPERTY_SECTOR_LABELS`; `createPropertySchema` acepta `activeSectors`.
2. ~~**Aplicar múltiples templates a la vez**~~ — DONE. `template-application-dialog.tsx` con checkboxes + "Seleccionar todos"; `handleApplyTemplates` aplica en secuencia vía `useBulkAddTasks`.
3. ~~**Sector por defecto en templates**~~ — DONE. `TaskTemplate.defaultSector` en schema; `bulkAddFromTemplate` hereda `tpl.defaultSector ?? undefined`.
4. ~~**Calcular fechas automáticamente**~~ — DONE. `suggestDueDate` en `packages/shared/src/utils/due-date.ts` + tests.
5. ~~**Validación antes de activar el plan**~~ — DONE. `plan-validation-dialog.tsx` chequea 5 reglas (empty tasks = error; sectores sin tareas, urgentes sin fecha en 7 días, >5 tareas/mes, tareas sin sector = warnings). Cableado al flujo de activación en `plan-editor.tsx`.

**Fase 3 — Detección de duplicados**

9. ~~**Detección de duplicados**~~ — DONE. `bulkAddFromTemplate` filtra por nombre case-insensitive (whole-plan, no solo categoría) y devuelve `{ created, skipped, skippedNames }`. Toast en `useBulkAddTasks` muestra ambos counts + primeras 3 omitidas. Decisión: NO se implementa "aplicar igual" — crear tareas con nombres duplicados es UX activamente peor que saltarlas silenciosamente.

**Backlog largo plazo**

| #   | Feature                                                     | Razón para diferir                                           |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 8   | Templates inteligentes (sugerencias por tipo/edad/sectores) | La arquitecta conoce sus templates; 5 min de ahorro          |
| 10  | Modo re-inspección (comparar con visita anterior)           | Necesita 2+ inspecciones por propiedad para tener data       |
| 11  | Vista calendario para distribuir fechas                     | Con 2-3 planes/mes, distribución manual alcanza              |
| 12  | Fotos directas a propiedad                                  | El checklist ya tiene photoUrl por item                      |
| 13  | Notas narrativas en informe                                 | El checklist ya tiene campo notes general                    |
| 14  | Alertas por edad de la vivienda                             | 5 reglas estáticas; la arquitecta ya lo sabe por experiencia |

---

### Mejoras UX — Pendientes

**Fase 1 — Rápidas**

2. **Tooltips en métricas del dashboard** — Agregar tooltips con ícono Info en ISV, stat cards y health card (solo web). Textos explicativos para cada métrica.

**Fase 2 — Medianas**

4. **Formulario de completar tarea simplificado** — Modo rápido (2 campos: condición visual + quién lo hizo) con defaults inteligentes. Botón "Agregar más detalles" expande formulario completo.
5. **Formulario de contacto en la landing** — Formulario simple (nombre, email/teléfono, dirección) en sección CTA final. Submit envía email a EPDE. WhatsApp como alternativa al lado.
6. **Guía PDF de primer uso** — PDF 4-6 páginas con capturas: qué es EPDE, dashboard, tareas, servicios, app mobile, contacto. Linkear desde welcome card, email de invitación y landing.

**Fase 3 — Grandes**

7. **Onboarding interactivo con tour guiado** — `react-joyride` en web (5 pasos: health card, stats, tareas, sidebar, notificaciones). En mobile: carrusel de 4 slides en primer acceso.
8. **Notificaciones por WhatsApp** — Integración WhatsApp Business API (Twilio o Meta). Recordatorios, resumen semanal, presupuestos cotizados. Preferencias por usuario. Campo `phone` en User.
9. **Galería de fotos en el dashboard** — Sección "Estado visual" con últimas 4-6 fotos (inspecciones + tareas). Click abre foto con contexto. En mobile: carrusel horizontal.

## Dashboard admin — Fase 3 (métricas avanzadas)

> **Fases 1 y 2 IMPLEMENTADAS** (abril 2026) — ver commits `0c6a147d..2da7b005`. El dashboard responde 9 preguntas ejecutivas en 60 segundos (revenue, cobranza, inspecciones, launch tracking, ISV, certificados, profesionales, clientes en riesgo, ciclo operativo).
>
> La Fase 3 son 8 features que quedan diferidas porque hoy se ejecutarían sobre data insuficiente. Cada una tiene un **trigger cuantitativo** que indica cuándo vale la pena implementarla.

### PR-3.1 Cohort analysis por mes de ingreso

**Qué es:** Matriz de retención por cohorte mensual. Compara si los clientes que entraron en enero siguen activos vs los de marzo.

**Trigger para implementar:**

- ≥50 clientes total con plan activo
- ≥6 cohortes mensuales distintas (6+ meses operando)
- Alguien pregunta "¿los clientes de qué mes retienen más?" al menos una vez

**Shape propuesto:**

1. Backend: query agregando `MaintenancePlan.createdAt` por mes × `subscriptionExpiresAt` por mes.
2. Frontend: heatmap con `@visx/heatmap` (cohort × months-active).
3. Cacheable 1h — el dato cambia lento.

**Tiempo estimado:** 2h

### PR-3.2 Conversion funnel desde landing

**Qué es:** Tracking de `landing visit → WhatsApp click → conversación → cliente creado → plan pagado`. Responde "¿qué parte de la landing pierde usuarios?".

**Trigger para implementar:**

- Tráfico mensual estable ≥200 visitas/mes a la landing
- ≥3 conversiones/mes para tener data estadística
- Presupuesto para una herramienta de analytics (Plausible ≈ USD 9/mes, PostHog free tier)

**Shape propuesto:**

1. Integrar Plausible self-hosted o free tier PostHog.
2. Eventos: `landing_view`, `cta_whatsapp_click`, `whatsapp_redirect_opened`.
3. Correlacionar con `User.createdAt` y `MaintenancePlan.createdAt` en dashboard analytics tab.

**Tiempo estimado:** 3h (setup + eventos + UI)

### PR-3.3 Churn post-6 meses

**Qué es:** Tasa de renovación al cumplir 6 meses del plan (pasan a suscripción mensual vs se van silenciosamente).

**Trigger para implementar:**

- ≥10 clientes con plan que hayan cumplido 6m desde `createdAt`
- Modelo `Subscription` con periodicidad mensual (no existe hoy — el plan es pago único + 6m sistema)

**Shape propuesto:**

1. Primero: agregar modelo `Subscription { userId, startDate, endDate, status }` para trackear renovaciones mensuales.
2. Query: clientes con plan +6m sin suscripción activa = churned.
3. Card en dashboard: "6 de 10 clientes renovaron (60%)" + tendencia.

**Tiempo estimado:** 1.5h una vez que exista el modelo (dependencia)

### PR-3.4 Costo operativo vs revenue (margen bruto)

**Qué es:** Revenue mensual − costos directos = margen bruto. Costos directos incluyen: pagos a profesionales, salario estimado arquitecta, operativos fijos (hosting, herramientas).

**Trigger para implementar:**

- Revenue mensual estable ≥$500k (sentido costear cuando hay plata real)
- Decisión de contratar (2da arquitecta, asistente) que requiera ver margen
- Al cumplir 1 año de operación (balance de cierre)

**Shape propuesto:**

1. Nuevo modelo `OperationalCost { month, category, amount, notes }` — admin carga manualmente.
2. Query: revenue consolidado − SUM(OperationalCost + ProfessionalPayment) del mismo mes.
3. Card en dashboard con margen + % sobre revenue. Alert si margen cae bajo 30%.

**Tiempo estimado:** 2.5h

### PR-3.5 Tiempo WhatsApp → primer contacto

**Qué es:** Métrica de customer experience — cuánto tarda EPDE en responder el primer WhatsApp que recibe.

**Trigger para implementar:**

- Integración WhatsApp Business API formal (Twilio/Meta) — ver Fase 3 de "Mejoras UX" arriba, PR-8
- O: tolerancia a métrica aproximada (tiempo `User.createdAt` → `MaintenancePlan.createdAt` como proxy)

**Shape propuesto (aproximado sin API):**

- Query: `AVG(MaintenancePlan.createdAt - User.createdAt)` filtrado a casos con ambos en misma semana (descarta outliers).
- Card con promedio + meta configurable.

**Shape propuesto (con API):** webhook de WhatsApp registra primer mensaje inbound + primer reply; diferencia = SLA.

**Tiempo estimado:** 1h aproximado / 4h con API completa

### PR-3.6 Distribución geográfica

**Qué es:** Mapa de calor de propiedades por ciudad/barrio. Útil para escalar fuera de Paraná y detectar concentración.

**Trigger para implementar:**

- ≥30 propiedades total
- ≥3 ciudades o ≥5 barrios distintos en el portfolio
- Decisión estratégica de expandir (Santa Fe, Rosario, etc.)

**Shape propuesto:**

1. Sin mapa: tabla ordenada por count(property) per `Property.city` + per barrio extraído de `Property.address`.
2. Con mapa (futuro): Leaflet + geocoding de direcciones. Clusters por zoom level.

**Tiempo estimado:** 3h (sin mapa) / 5h (con mapa interactivo)

### PR-3.7 Notifications delivery rate

**Qué es:** % de notificaciones leídas vs enviadas, por tipo. Valida si los recordatorios automáticos sirven o se ignoran.

**Trigger para implementar:**

- ≥100 notificaciones enviadas total (muestra suficiente)
- Sospecha de que las notifs se ignoran ("nadie responde mis recordatorios")

**Shape propuesto:**

1. Data ya existe (`Notification.readAt`).
2. Query: `(count(readAt not null) / count(*)) × 100` por `Notification.type`.
3. Card en dashboard analytics: barras horizontales con rate por tipo.

**Tiempo estimado:** 1h

### PR-3.8 Acumulación horaria del admin

**Qué es:** Tracking manual de horas de Noelia dedicadas a cada tipo de trabajo (diagnóstico, inspección, admin overhead, respuesta WhatsApp). Input: admin logea horas al finalizar tareas clave.

**Trigger para implementar:**

- Decisión de contratar ayuda (segunda arquitecta, asistente)
- Sensación de "no me alcanzan las horas" — medir antes de delegar
- Facturación mensual ≥$400k que justifique optimización operativa

**Shape propuesto:**

1. Nuevo modelo `AdminTimeLog { userId, category, hours, date, notes }`.
2. UI simple: admin va al final de cada semana y logea horas por categoría.
3. Chart en dashboard: distribución semanal + tendencia mensual.

**Tiempo estimado:** 4h (modelo + migración + UI admin + chart)

### Señales generales "es hora de Fase 3"

Independientes de un trigger específico:

- Abriste el dashboard y sentiste que te faltaba una pregunta respondida
- Tomaste una decisión empresarial en base a gut feeling en vez de data
- Un cliente/socio pregunta "¿cuántos clientes tienen?" y dudás el número

Cuando pase **cualquiera de estas tres**, abrí este backlog y elegí el PR más relevante.

---

## Deuda técnica arquitectónica (audit round 2 — Fase C diferida)

> Ambos items fueron identificados en la auditoría arquitectónica de 2026-04-14 (ver commits `a989491`..`af56fe8`). Son riesgos hipotéticos que hoy NO han causado incidentes; el backlog los captura para cuando una feature real los fuerce al frente.

### SchedulerModule adapter layer

**Qué es**: `apps/api/src/scheduler/scheduler.module.ts` importa 9 feature modules (`TasksModule`, `BudgetsModule`, `ServiceRequestsModule`, `NotificationsModule`, `EmailModule`, `DashboardModule`, `PropertiesModule`, `UsersModule`, `AuthModule`). Cada cron nuevo potencialmente agrega otro import. Mitigado hoy por SIEMPRE #94 (ESLint rule que bloquea imports `scheduler/` desde domain modules), pero la dirección `scheduler → domain` es un hot-zone.

**Estado 2026-04-14**: verificado, sigue en 9 imports. Trigger de 12+ aún no alcanzado.

**Por qué está diferido**:

- No ha causado un ciclo real
- Refactor es 2-3 semanas (15 cron services + re-provider de repos)
- El audit explícitamente dijo "no tocar ahora"

**Trigger para activar**:

- Feature nueva necesita invocar un cron desde un domain module (ej. "re-inspección" podría querer programar un recordatorio).
- Aparece un ciclo de imports que forza un `forwardRef()`.
- SchedulerModule crece a 12+ imports.

**Shape propuesto cuando se active**:

1. Crear `apps/api/src/scheduler/adapters/scheduler-domain-access.module.ts` que re-exporta solo los repos/services que crons consumen (no los feature modules enteros).
2. Migrar 1 cron service como prueba del patrón (recomendable: `ISVSnapshotService` — usa solo `PropertiesRepository.findWithActivePlans`, `DashboardRepository.getPropertyHealthIndexBatch`, `ISVSnapshotRepository`).
3. El resto de crons migran oportunisticamente cuando se tocan por otra razón.
4. Cuando todos migraron, `SchedulerModule` importa solo `SchedulerDomainAccessModule` + `ScheduleModule.forRoot()`.

### Runtime schema validation en mutation responses

**Qué es**: Los hooks web y mobile leen campos anidados directamente desde la respuesta (`response.data.task.category.name`). Si la API cambia shape sin sync de ambos lados, TypeScript compila (porque el tipo en `@epde/shared` se actualiza), pero el acceso inline puede romper en runtime.

**Por qué está diferido**:

- Factories unificadas en `@epde/shared/api/*` hacen que ambas plataformas consuman de una sola fuente — drift silencioso es hoy muy difícil.
- Zod runtime validation agrega latencia + complejidad.
- No se ha observado un incidente de este tipo.

**Trigger para activar**:

- Un incidente donde una API change rompe una plataforma y no la otra.
- Integración con un endpoint externo (no-EPDE) donde el contract no es controlado.
- Migración a tRPC / GraphQL (contract-first sería redundante).

**Shape propuesto cuando se active**:

1. Crear `packages/shared/src/schemas/responses/` con Zod schemas por mutation crítica (empezar con `completeTask`, `respondBudget`, `updateServiceStatus`).
2. Factories `createXQueries(apiClient)` añaden `.safeParse()` internamente y logean drift a Sentry en dev; fallan duro en tests.
3. Hooks siguen igual — el cambio es transparente.
4. Documentar SIEMPRE rule para nuevos factories.
