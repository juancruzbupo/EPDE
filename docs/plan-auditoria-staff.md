# Plan de remediación — Auditoría Staff Engineer

14 issues. Todos se implementan, ninguno queda para después.

---

## Tier 1 — Correctness/Security (1-2 días)

### C1: Remover `as never` en inspections repository

**Problema:** 5 casts a `never` que bypassean TypeScript.

**Archivos:**

- `apps/api/src/inspections/inspections.repository.ts`

**Qué hacer:**

- Importar `PropertySector` y `InspectionItemStatus` de Prisma client
- Tipar los parámetros del método `create` con las interfaces correctas
- Tipar `updateItem` con `InspectionItemStatus` en vez de `string`
- Tipar `addItem` con `PropertySector` en vez de `string`
- Eliminar todos los `as never`

---

### C2: Validación Zod en `linkTask` y `updateNotes`

**Problema:** 2 endpoints sin validación de input.

**Archivos:**

- `apps/api/src/inspections/inspections.controller.ts`
- `packages/shared/src/schemas/inspection.ts` (agregar schemas)

**Qué hacer:**

- Crear `linkTaskSchema` en shared: `{ taskId: z.string().uuid() }`
- Crear `updateNotesSchema` en shared: `{ notes: z.string().max(2000) }`
- Aplicar `ZodValidationPipe` en ambos endpoints

---

### C3: Reemplazar `prompt()` con Dialog

**Problema:** `window.prompt()` para capturar hallazgos en inspección.

**Archivos:**

- `apps/web/src/app/(dashboard)/properties/[id]/inspection-tab.tsx`

**Qué hacer:**

- Crear un state `findingDialog: { itemId: string; status: InspectionItemStatus } | null`
- Cuando el usuario clickea "Necesita atención" o "Requiere profesional", abrir un Dialog con Textarea
- Al confirmar, llamar a `handleUpdateItem` con el status y el finding
- Usar el componente `Dialog` de shadcn/ui que ya usa toda la app

---

## Tier 2 — Arquitectura (3-5 días)

### M2: Extraer `computeHealthIndex()` como función pura

**Problema:** Algoritmo de ISV duplicado entre single y batch.

**Archivos:**

- `apps/api/src/dashboard/dashboard.repository.ts` (líneas 656-900)

**Qué hacer:**

- Crear `apps/api/src/dashboard/health-index.calculator.ts`
- Extraer la lógica de scoring (compliance, condition, coverage, investment, trend) a una función pura
- Ambos métodos (`getPropertyHealthIndex` y `getPropertyHealthIndexBatch`) llaman a la misma función
- La función recibe datos crudos (tasks, logs, sectors) y devuelve el score + dimensions
- Sin dependencia de Prisma — pure computation

---

### M3: Endpoints CLIENT-accessible para inspecciones

**Problema:** El cliente no puede ver sus inspecciones.

**Archivos:**

- `apps/api/src/inspections/inspections.controller.ts`
- `apps/api/src/inspections/inspections.service.ts`

**Qué hacer:**

- `GET /inspections/property/:propertyId` → accesible para CLIENT (validar ownership: el user.id debe coincidir con property.userId)
- `GET /inspections/:id` → accesible para CLIENT (validar que la inspección pertenece a una propiedad del cliente)
- Los endpoints de escritura (create, updateItem, addItem, linkTask, updateNotes) siguen ADMIN-only
- Agregar método `verifyPropertyOwnership(propertyId, userId)` en el service

---

### M6: Mover items de inspección a `@epde/shared`

**Problema:** 150 líneas de datos de dominio hardcodeados en un componente React.

**Archivos:**

- `apps/web/src/app/(dashboard)/properties/[id]/inspection-tab.tsx` (líneas 320-471)
- `packages/shared/src/constants/inspection-items.ts` (nuevo)

**Qué hacer:**

- Crear `packages/shared/src/constants/inspection-items.ts` con `DEFAULT_INSPECTION_ITEMS: Record<PropertySector, { name: string; description: string }[]>`
- Exportar desde el barrel de shared
- Importar en inspection-tab.tsx en vez de la función `getDefaultItemsForSector`
- Si mobile necesita crear inspecciones en el futuro, los datos están disponibles

---

### I4: Migrar InspectionTab a React Query

**Problema:** Usa `useState` + `useEffect` manual, inconsistente con el resto.

**Archivos:**

- `apps/web/src/app/(dashboard)/properties/[id]/inspection-tab.tsx`
- `apps/web/src/hooks/use-inspections.ts` (nuevo)

**Qué hacer:**

- Crear hook `useInspections(propertyId)` con `useQuery`
- Crear mutations: `useCreateInspection`, `useUpdateInspectionItem`, `useAddInspectionItem`
- Reemplazar el fetch manual por los hooks
- Integrar con `QUERY_KEYS` y `invalidateQueries` para consistency con el resto

---

### I1: Validación de ownership en inspecciones

**Problema:** No se verifica que el item/checklist pertenece a una propiedad accesible.

**Archivos:**

- `apps/api/src/inspections/inspections.service.ts`

**Qué hacer:**

- En `updateItem`, `addItem`, `linkTask`, `updateNotes`: verificar que el checklist/item pertenece a una propiedad válida
- Agregar método `verifyItemAccess(itemId)` que hace join con checklist → property
- Pattern: mismo que `TaskLifecycleService.verifyTaskAccess`

---

## Tier 3 — Performance/Mantenibilidad (3-5 días)

### M1: Splitear `dashboard.repository.ts`

**Problema:** 1201 líneas, God Object.

**Archivos:**

- `apps/api/src/dashboard/dashboard.repository.ts`

**Qué hacer:**

- `dashboard-stats.repository.ts` — admin stats, client stats, counts
- `health-index.repository.ts` — ISV scoring, batch health, sector scores, streak
- `analytics.repository.ts` — completion trends, condition distribution, category breakdown, expenses
- `DashboardModule` importa los 3 y los inyecta donde corresponda
- `DashboardService` se actualiza para usar los 3 repositories

---

### M4: Optimizar weekly summary con batch

**Problema:** ~13 queries por cliente, no escala.

**Archivos:**

- `apps/api/src/scheduler/weekly-summary.service.ts`

**Qué hacer:**

- Cargar todos los clientes activos con sus planIds en una sola query
- Usar `getPropertyHealthIndexBatch` para todos los planIds juntos
- Agrupar task stats por planId en una query con `groupBy`
- Reducir de ~13 queries/cliente a ~5 queries total (independiente del número de clientes)

---

### M5: Agregar `deletedAt` a InspectionChecklist

**Problema:** Sin soft-delete, inconsistente con el resto.

**Archivos:**

- `apps/api/prisma/schema.prisma`
- `apps/api/src/inspections/inspections.repository.ts`

**Qué hacer:**

- Agregar `deletedAt DateTime?` al modelo `InspectionChecklist`
- Agregar `deletedAt DateTime?` al modelo `InspectionItem`
- Migración
- Actualizar queries con `deletedAt: null` o usar `prisma.softDelete`
- Agregar endpoint `DELETE /inspections/:id` (soft-delete)

---

### I3: PlanEditor — reducir 17 useState

**Problema:** Demasiados estados locales, difícil de mantener.

**Archivos:**

- `apps/web/src/app/(dashboard)/properties/[id]/plan-editor.tsx`

**Qué hacer:**

- Agrupar los estados de dialogs en un `useReducer`:
  ```typescript
  type DialogState = {
    task: { open: boolean; editing: TaskPublic | null };
    delete: { taskId: string | null };
    template: { open: boolean };
    validation: { open: boolean };
    complete: { task: TaskPublic | null };
    bulkComplete: { open: boolean };
    service: { info: ServiceDialogInfo | null };
    status: { transition: PlanStatus | null };
  };
  ```
- Reducer con actions: `OPEN_TASK_DIALOG`, `CLOSE_TASK_DIALOG`, etc.
- El componente pasa de 17 `useState` a 1 `useReducer` + 4-5 `useState` para filtros/selección

---

### I5: String literal `'URGENT'` en dashboard

**Problema:** Inconsistente con el resto que usa `TaskPriority.URGENT`.

**Archivos:**

- `apps/api/src/dashboard/dashboard.repository.ts`

**Qué hacer:**

- Buscar todas las ocurrencias de string literals de enums en el archivo
- Reemplazar con las constantes del enum correspondiente
- Verificar que no hay más en el proyecto con `grep -r "'URGENT'" apps/api/src/`

---

## Orden de ejecución

| Día | Items                   | Esfuerzo  |
| --- | ----------------------- | --------- |
| 1   | C1 + C2 + C3 + I5       | 4-5 horas |
| 2   | M6 + I4                 | 3-4 horas |
| 3   | M2 + M3                 | 4-5 horas |
| 4   | I1 + M5                 | 3-4 horas |
| 5-6 | M1 (split dashboard)    | 6-8 horas |
| 7   | M4 (batch optimization) | 4-5 horas |
| 8   | I3 (PlanEditor reducer) | 3-4 horas |

**Total estimado: 8 días de desarrollo.**
