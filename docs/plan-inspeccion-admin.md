# Plan de implementación — Herramientas de inspección admin

14 features para optimizar el flujo de la arquitecta, desde la preparación hasta el seguimiento.

**Implementado:**

- [x] Checklist de inspección con 152 items por sector
- [x] Evaluación de items (OK/Atención/Profesional) con hallazgos
- [x] Generación de plan desde inspección completada
- [x] Cálculo de Risk Score (`computeRiskScore()`)
- [x] UI de sectores colapsables
- [x] Guías de inspección con renderer estructurado
- [x] Baseline TaskLogs desde inspección

---

## Fase 1 — Quick wins (1-2 días) — Pendiente

### 1. Sectores al crear la propiedad

Agregar checkbox grid de `activeSectors` al `create-property-dialog.tsx` (copiar de `edit-property-dialog.tsx`). Actualizar `createPropertySchema` para aceptar el campo.

**Archivos:**

- `apps/web/src/app/(dashboard)/properties/create-property-dialog.tsx`
- `packages/shared/src/schemas/property.ts` (agregar `activeSectors` al create schema)
- `apps/api/src/properties/properties.service.ts` (pasar el campo al create)

### 2. Aplicar múltiples templates a la vez

Cambiar `template-application-dialog.tsx` de selección única (radio) a múltiple (checkboxes). Al confirmar, aplicar todos los seleccionados en secuencia.

**Archivos:**

- `apps/web/src/app/(dashboard)/properties/[id]/plan-components/template-application-dialog.tsx`
- `apps/web/src/hooks/use-plans.ts` (mutar N veces o crear endpoint batch)

### 3. Sector por defecto en templates

Agregar campo `defaultSector: PropertySector | null` a `TaskTemplate`. Cuando se aplica un template, las tareas heredan el sector automáticamente.

**Archivos:**

- `packages/shared/src/types/entities/category-template.ts`
- `packages/shared/src/schemas/task-template.ts`
- `apps/api/prisma/schema.prisma` (migración)
- `apps/api/src/tasks/task-lifecycle.service.ts` (bulkAdd pasa el sector)
- `apps/web/src/app/(dashboard)/templates/` (UI para editar defaultSector en template)

### 4. Calcular fechas automáticamente

Helper `suggestDueDate(priority, recurrenceType, recurrenceMonths)` en `@epde/shared`. Pre-fill `nextDueDate` en `task-dialog.tsx` cuando cambia la prioridad. Override manual permitido.

**Lógica:**

- URGENT → hoy + 7 días
- HIGH → hoy + 30 días
- MEDIUM → hoy + recurrenceMonths meses
- LOW → hoy + 3-6 meses (mitad de recurrencia o 90 días, el mayor)

**Archivos:**

- `packages/shared/src/utils/` (nuevo helper)
- `apps/web/src/app/(dashboard)/properties/[id]/task-dialog.tsx`

### 5. Validación antes de activar el plan

Al hacer click en "Activar plan", mostrar warnings si:

- Hay sectores sin tareas asignadas
- Más de 5 tareas vencen el mismo mes
- Tareas urgentes sin fecha dentro de 7 días
- Tareas que requieren profesional sin marcar

**Archivos:**

- `apps/web/src/app/(dashboard)/properties/[id]/plan-components/plan-status-bar.tsx`
- Nuevo componente: `plan-validation-dialog.tsx`

---

## Fase 2 — Checklist de inspección (3-5 días) — IMPLEMENTADA

### 6. [x] Checklist de inspección por sector

**Modelo nuevo:**

```
InspectionChecklist {
  id: UUID
  propertyId: UUID
  inspectedAt: DateTime
  inspectedBy: UUID (user)
  notes: String? (narrativa general)
  items: InspectionItem[]
}

InspectionItem {
  id: UUID
  checklistId: UUID
  sector: PropertySector
  name: String
  description: String? (guía markdown)
  status: PENDING | OK | NEEDS_ATTENTION | NEEDS_PROFESSIONAL
  finding: String? (qué encontró)
  photoUrl: String?
  taskId: UUID? (si se creó tarea desde este item)
  isCustom: Boolean (true si lo agregó la arquitecta)
  order: Int
}
```

**Archivos:**

- `apps/api/prisma/schema.prisma` (2 tablas nuevas)
- `apps/api/src/inspections/` (nuevo módulo: controller, service, repository)
- `packages/shared/src/types/entities/inspection.ts`
- `packages/shared/src/schemas/inspection.ts`
- `apps/web/src/app/(dashboard)/properties/[id]/inspection-tab.tsx` (nueva pestaña admin)
- Templates de inspección: datos seed con items por sector + guía markdown

### 7. [x] Quick-add hallazgo

Formulario rápido dentro del checklist: sector + qué encontró + severidad + foto. Al guardar, crea automáticamente una tarea en el plan con:

- `recurrenceType: ON_DETECTION`
- `professionalRequirement` según severidad
- Sector del hallazgo
- Descripción pre-llenada
- Foto adjunta

**Archivos:**

- `apps/web/src/app/(dashboard)/properties/[id]/inspection-tab.tsx` (formulario inline)
- `apps/api/src/inspections/inspections.service.ts` (crear tarea desde hallazgo)

---

## Fase 3 — Detección de duplicados (1 día) — Pendiente

### 9. Detección de duplicados

Antes de aplicar un template, verificar si ya existen tareas con el mismo nombre en el plan. Mostrar warning con lista de duplicados y opción de "aplicar igual" o "saltar existentes".

**Archivos:**

- `apps/api/src/tasks/task-lifecycle.service.ts` (check antes de bulk add)
- `apps/web/src/app/(dashboard)/properties/[id]/plan-components/template-application-dialog.tsx`

---

## Backlog (cuando haya más volumen de clientes)

| #   | Feature                                                     | Razón para diferir                                           |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| 8   | Templates inteligentes (sugerencias por tipo/edad/sectores) | La arquitecta conoce sus templates; 5 min de ahorro          |
| 10  | Modo re-inspección (comparar con visita anterior)           | Necesita 2+ inspecciones por propiedad para tener data       |
| 11  | Vista calendario para distribuir fechas                     | Con 2-3 planes/mes, distribución manual alcanza              |
| 12  | Fotos directas a propiedad                                  | El checklist (punto 6) ya tiene photoUrl por item            |
| 13  | Notas narrativas en informe                                 | El checklist (punto 6) ya tiene campo notes general          |
| 14  | Alertas por edad de la vivienda                             | 5 reglas estáticas; la arquitecta ya lo sabe por experiencia |
