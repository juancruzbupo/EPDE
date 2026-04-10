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

**Fase 1 — Quick wins**

1. **Sectores al crear la propiedad** — Agregar checkbox grid de `activeSectors` al `create-property-dialog.tsx`. Actualizar `createPropertySchema`.
2. **Aplicar múltiples templates a la vez** — Cambiar `template-application-dialog.tsx` de selección única a múltiple (checkboxes). Aplicar todos los seleccionados en secuencia.
3. **Sector por defecto en templates** — Agregar campo `defaultSector: PropertySector | null` a `TaskTemplate`. Tareas heredan sector al aplicar template.
4. **Calcular fechas automáticamente** — Helper `suggestDueDate(priority, recurrenceType, recurrenceMonths)` en `@epde/shared`. Pre-fill `nextDueDate` según prioridad.
5. **Validación antes de activar el plan** — Warnings al activar: sectores sin tareas, >5 tareas vencen el mismo mes, urgentes sin fecha en 7 días, tareas de profesional sin marcar.

**Fase 3 — Detección de duplicados**

9. **Detección de duplicados** — Antes de aplicar un template, verificar si ya existen tareas con el mismo nombre en el plan. Warning con lista y opción "aplicar igual" o "saltar existentes".

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
