# Modelo de Datos

Base de datos PostgreSQL 16, ORM Prisma 6.

## Diagrama de Relaciones

```
User ─1:N─ Property ─1:1─ MaintenancePlan ─1:N─ Task
  │                │                                │
  │                ├─1:N─ BudgetRequest ─1:N─ BudgetLineItem
  │                │         └─1:1─ BudgetResponse
  │                │
  │                └─1:N─ ServiceRequest ─1:N─ ServiceRequestPhoto
  │
  ├─1:N─ TaskLog
  ├─1:N─ TaskNote
  ├─1:N─ BudgetRequest (requester)
  ├─1:N─ ServiceRequest (requester)
  └─1:N─ Notification

Category ─1:N─ Task

CategoryTemplate ─1:N─ TaskTemplate
```

## Enums

### UserRole

| Valor    | Descripcion                       |
| -------- | --------------------------------- |
| `CLIENT` | Cliente con acceso al portal      |
| `ADMIN`  | Administrador con acceso completo |

### UserStatus

| Valor      | Descripcion                     |
| ---------- | ------------------------------- |
| `INVITED`  | Invitado, aun no seteo password |
| `ACTIVE`   | Activo con password configurado |
| `INACTIVE` | Desactivado                     |

### PropertyType

| Valor           | Label         |
| --------------- | ------------- |
| `HOUSE`         | Casa          |
| `APARTMENT`     | Departamento  |
| `DUPLEX`        | Duplex        |
| `COUNTRY_HOUSE` | Casa de Campo |
| `OTHER`         | Otro          |

### PlanStatus

| Valor      | Descripcion              |
| ---------- | ------------------------ |
| `DRAFT`    | Borrador, en edicion     |
| `ACTIVE`   | Plan activo en ejecucion |
| `ARCHIVED` | Archivado                |

### TaskPriority / ServiceUrgency

| Valor    | Label   |
| -------- | ------- |
| `LOW`    | Baja    |
| `MEDIUM` | Media   |
| `HIGH`   | Alta    |
| `URGENT` | Urgente |

### RecurrenceType

| Valor          | Meses        | Label           |
| -------------- | ------------ | --------------- |
| `MONTHLY`      | 1            | Mensual         |
| `QUARTERLY`    | 3            | Trimestral      |
| `BIANNUAL`     | 6            | Semestral       |
| `ANNUAL`       | 12           | Anual           |
| `CUSTOM`       | configurable | Personalizado   |
| `ON_DETECTION` | —            | Segun deteccion |

> **ON_DETECTION**: Tareas que no tienen fecha de vencimiento programada (`nextDueDate = null`). Permanecen en estado PENDING tras completarse. El scheduler las ignora.

### TaskType

| Valor         | Label       |
| ------------- | ----------- |
| `INSPECTION`  | Inspeccion  |
| `CLEANING`    | Limpieza    |
| `TEST`        | Prueba      |
| `TREATMENT`   | Tratamiento |
| `SEALING`     | Sellado     |
| `LUBRICATION` | Lubricacion |
| `ADJUSTMENT`  | Ajuste      |
| `MEASUREMENT` | Medicion    |
| `EVALUATION`  | Evaluacion  |

### ProfessionalRequirement

| Valor                      | Label                     |
| -------------------------- | ------------------------- |
| `OWNER_CAN_DO`             | Propietario puede hacerlo |
| `PROFESSIONAL_RECOMMENDED` | Profesional recomendado   |
| `PROFESSIONAL_REQUIRED`    | Profesional obligatorio   |

### TaskResult

| Valor                  | Label                |
| ---------------------- | -------------------- |
| `OK`                   | OK                   |
| `OK_WITH_OBSERVATIONS` | OK con observaciones |
| `NEEDS_ATTENTION`      | Requiere atencion    |
| `NEEDS_REPAIR`         | Requiere reparacion  |
| `NEEDS_URGENT_REPAIR`  | Reparacion urgente   |
| `NOT_APPLICABLE`       | No aplica            |

### ConditionFound

| Valor       | Label     |
| ----------- | --------- |
| `EXCELLENT` | Excelente |
| `GOOD`      | Bueno     |
| `FAIR`      | Regular   |
| `POOR`      | Malo      |
| `CRITICAL`  | Critico   |

### TaskExecutor

| Valor                | Label                  |
| -------------------- | ---------------------- |
| `OWNER`              | Propietario            |
| `HIRED_PROFESSIONAL` | Profesional contratado |
| `EPDE_PROFESSIONAL`  | Profesional EPDE       |

### ActionTaken

| Valor             | Label            |
| ----------------- | ---------------- |
| `INSPECTION_ONLY` | Solo inspeccion  |
| `CLEANING`        | Limpieza         |
| `MINOR_REPAIR`    | Reparacion menor |
| `MAJOR_REPAIR`    | Reparacion mayor |
| `REPLACEMENT`     | Reemplazo        |
| `TREATMENT`       | Tratamiento      |
| `SEALING`         | Sellado          |
| `ADJUSTMENT`      | Ajuste           |
| `FULL_SERVICE`    | Service completo |
| `NO_ACTION`       | Sin accion       |

### TaskStatus

| Valor       | Descripcion                    |
| ----------- | ------------------------------ |
| `PENDING`   | Pendiente, no cercana a vencer |
| `UPCOMING`  | Proxima a vencer (30 dias)     |
| `OVERDUE`   | Vencida                        |
| `COMPLETED` | Completada                     |

### BudgetStatus

| Valor         | Descripcion            | Transiciones validas |
| ------------- | ---------------------- | -------------------- |
| `PENDING`     | Solicitado por cliente | → QUOTED             |
| `QUOTED`      | Admin envio cotizacion | → APPROVED, REJECTED |
| `APPROVED`    | Cliente aprobo         | → IN_PROGRESS        |
| `REJECTED`    | Cliente rechazo        | (terminal)           |
| `IN_PROGRESS` | Trabajo en progreso    | → COMPLETED          |
| `COMPLETED`   | Trabajo finalizado     | (terminal)           |

### ServiceStatus

| Valor         | Descripcion           | Transiciones validas |
| ------------- | --------------------- | -------------------- |
| `OPEN`        | Solicitud nueva       | → IN_REVIEW          |
| `IN_REVIEW`   | En revision por admin | → IN_PROGRESS        |
| `IN_PROGRESS` | En trabajo            | → RESOLVED           |
| `RESOLVED`    | Resuelto              | → CLOSED             |
| `CLOSED`      | Cerrado               | (terminal)           |

### NotificationType

| Valor            | Descripcion                           |
| ---------------- | ------------------------------------- |
| `TASK_REMINDER`  | Recordatorio de tarea proxima/vencida |
| `BUDGET_UPDATE`  | Cambio de estado en presupuesto       |
| `SERVICE_UPDATE` | Cambio de estado en solicitud         |
| `SYSTEM`         | Notificacion del sistema              |

## Entidades

### User

| Campo        | Tipo       | Notas                                    |
| ------------ | ---------- | ---------------------------------------- |
| id           | UUID       | PK, auto-generated                       |
| email        | String     | Unique                                   |
| passwordHash | String?    | Null hasta que el cliente setea password |
| name         | String     |                                          |
| phone        | String?    |                                          |
| role         | UserRole   | Default: CLIENT                          |
| status       | UserStatus | Default: INVITED                         |
| createdAt    | DateTime   |                                          |
| updatedAt    | DateTime   |                                          |
| deletedAt    | DateTime?  | Soft delete                              |

**Indices:** `email`, `[role, deletedAt]`
**Soft delete:** Si — `findByEmail` debe usar `writeModel` para encontrar eliminados

### Property

| Campo        | Tipo         | Notas             |
| ------------ | ------------ | ----------------- |
| id           | UUID         | PK                |
| userId       | String       | FK → User         |
| address      | String       |                   |
| city         | String       |                   |
| type         | PropertyType | Default: HOUSE    |
| yearBuilt    | Int?         |                   |
| squareMeters | Float?       |                   |
| photoUrl     | String?      | URL de foto en R2 |
| createdAt    | DateTime     |                   |
| updatedAt    | DateTime     |                   |
| deletedAt    | DateTime?    | Soft delete       |

**Indices:** `userId`
**Relaciones:** `user`, `maintenancePlan` (1:1), `budgetRequests`, `serviceRequests`

### MaintenancePlan

| Campo      | Tipo       | Notas                       |
| ---------- | ---------- | --------------------------- |
| id         | UUID       | PK                          |
| propertyId | String     | FK → Property, Unique (1:1) |
| name       | String     |                             |
| status     | PlanStatus | Default: DRAFT              |
| createdAt  | DateTime   |                             |
| updatedAt  | DateTime   |                             |

**Relaciones:** `property`, `tasks`

### Category

| Campo       | Tipo      | Notas                          |
| ----------- | --------- | ------------------------------ |
| id          | UUID      | PK                             |
| name        | String    | Unique                         |
| description | String?   |                                |
| icon        | String?   | Nombre de icono Lucide         |
| order       | Int       | Para ordenamiento (default: 0) |
| deletedAt   | DateTime? | Soft delete                    |

**Soft delete:** Si — via Prisma extension (misma mecanica que User, Property, Task)
**Categorias por defecto (seed):** Electricidad, Plomeria, Pintura, Techos y Cubiertas, Jardin y Exteriores, Climatizacion, Seguridad, Limpieza General, Estructural, Aberturas

### Task

| Campo                    | Tipo                     | Notas                            |
| ------------------------ | ------------------------ | -------------------------------- |
| id                       | UUID                     | PK                               |
| maintenancePlanId        | String                   | FK → MaintenancePlan             |
| categoryId               | String                   | FK → Category                    |
| name                     | String                   |                                  |
| description              | String?                  |                                  |
| priority                 | TaskPriority             | Default: MEDIUM                  |
| recurrenceType           | RecurrenceType           | Default: ANNUAL                  |
| recurrenceMonths         | Int?                     | Para CUSTOM                      |
| nextDueDate              | DateTime?                | Null para ON_DETECTION           |
| order                    | Int                      | Orden dentro del plan            |
| status                   | TaskStatus               | Default: PENDING                 |
| taskType                 | TaskType?                | Tipo de tarea del nomenclador    |
| professionalRequirement  | ProfessionalRequirement? | Nivel profesional requerido      |
| technicalDescription     | String?                  | Descripcion tecnica del template |
| estimatedDurationMinutes | Int?                     | Duracion estimada en minutos     |
| createdAt                | DateTime                 |                                  |
| updatedAt                | DateTime                 |                                  |
| deletedAt                | DateTime?                | Soft delete                      |

**Indices:** `maintenancePlanId`, `nextDueDate`, `status`, `categoryId`, `[status, nextDueDate]`, `[status, deletedAt]`
**Status se actualiza via cron:** PENDING → UPCOMING (30 dias) → OVERDUE (excluye ON_DETECTION)

### TaskLog

| Campo          | Tipo           | Notas                  |
| -------------- | -------------- | ---------------------- |
| id             | UUID           | PK                     |
| taskId         | String         | FK → Task              |
| completedAt    | DateTime       | Default: now()         |
| completedBy    | String         | FK → User              |
| result         | TaskResult     | Resultado de la tarea  |
| conditionFound | ConditionFound | Estado encontrado      |
| executor       | TaskExecutor   | Quien ejecuto la tarea |
| actionTaken    | ActionTaken    | Accion realizada       |
| cost           | Decimal(12,2)? | Costo de la tarea      |
| notes          | String?        | Max 2000 chars         |
| photoUrl       | String?        |                        |

**Indices:** `taskId`, `[completedBy, completedAt]`

### TaskNote

| Campo     | Tipo     | Notas     |
| --------- | -------- | --------- |
| id        | UUID     | PK        |
| taskId    | String   | FK → Task |
| authorId  | String   | FK → User |
| content   | String   |           |
| createdAt | DateTime |           |

**Indice:** `taskId`

### BudgetRequest

| Campo       | Tipo         | Notas                                       |
| ----------- | ------------ | ------------------------------------------- |
| id          | UUID         | PK                                          |
| propertyId  | String       | FK → Property                               |
| requestedBy | String       | FK → User                                   |
| title       | String       |                                             |
| description | String?      |                                             |
| status      | BudgetStatus | Default: PENDING                            |
| updatedBy   | String?      | ID del usuario que realizo el ultimo cambio |
| version     | Int          | Optimistic locking counter (default: 0)     |
| createdAt   | DateTime     |                                             |
| updatedAt   | DateTime     |                                             |
| deletedAt   | DateTime?    | Soft delete                                 |

**Indices:** `propertyId`, `status`, `[propertyId, deletedAt]`
**Soft delete:** Si — via Prisma extension
**Relaciones:** `property`, `requester`, `lineItems`, `response` (1:1)

### BudgetLineItem

| Campo           | Tipo          | Notas                                  |
| --------------- | ------------- | -------------------------------------- |
| id              | UUID          | PK                                     |
| budgetRequestId | String        | FK → BudgetRequest (onDelete: Cascade) |
| description     | String        |                                        |
| quantity        | Decimal(12,4) | Precision decimal para cantidades      |
| unitPrice       | Decimal(12,2) | Precision decimal para montos          |
| subtotal        | Decimal(14,2) | quantity \* unitPrice                  |

### BudgetResponse

| Campo           | Tipo          | Notas                                               |
| --------------- | ------------- | --------------------------------------------------- |
| id              | UUID          | PK                                                  |
| budgetRequestId | String        | FK → BudgetRequest, Unique (1:1, onDelete: Cascade) |
| totalAmount     | Decimal(14,2) | Suma de subtotals (precision decimal)               |
| estimatedDays   | Int?          |                                                     |
| notes           | String?       |                                                     |
| validUntil      | DateTime?     | Formato: YYYY-MM-DD                                 |
| respondedAt     | DateTime      |                                                     |

### ServiceRequest

| Campo       | Tipo           | Notas                                       |
| ----------- | -------------- | ------------------------------------------- |
| id          | UUID           | PK                                          |
| propertyId  | String         | FK → Property                               |
| requestedBy | String         | FK → User                                   |
| title       | String         |                                             |
| description | String         | Requerido (min 10 chars)                    |
| urgency     | ServiceUrgency | Default: MEDIUM                             |
| status      | ServiceStatus  | Default: OPEN                               |
| updatedBy   | String?        | ID del usuario que realizo el ultimo cambio |
| createdAt   | DateTime       |                                             |
| updatedAt   | DateTime       |                                             |
| deletedAt   | DateTime?      | Soft delete                                 |

**Indices:** `propertyId`, `status`, `[propertyId, deletedAt]`
**Soft delete:** Si — via Prisma extension
**Relaciones:** `property`, `requester`, `photos`

### ServiceRequestPhoto

| Campo            | Tipo     | Notas                                   |
| ---------------- | -------- | --------------------------------------- |
| id               | UUID     | PK                                      |
| serviceRequestId | String   | FK → ServiceRequest (onDelete: Cascade) |
| url              | String   | URL en Cloudflare R2                    |
| createdAt        | DateTime |                                         |

**Maximo:** 5 fotos por solicitud (validacion Zod)

### Notification

| Campo     | Tipo             | Notas              |
| --------- | ---------------- | ------------------ |
| id        | UUID             | PK                 |
| userId    | String           | FK → User          |
| type      | NotificationType |                    |
| title     | String           |                    |
| message   | String           |                    |
| read      | Boolean          | Default: false     |
| data      | Json?            | Metadata adicional |
| createdAt | DateTime         |                    |

**Indices:** `[userId, read]`, `createdAt`, `[userId, type, createdAt]`

### CategoryTemplate

| Campo        | Tipo         | Notas              |
| ------------ | ------------ | ------------------ |
| id           | CUID         | PK, auto-generated |
| name         | String(100)  |                    |
| icon         | String(10)?  | Emoji de categoria |
| description  | String(500)? |                    |
| displayOrder | Int          | Default: 0         |
| createdAt    | DateTime     |                    |
| updatedAt    | DateTime     |                    |

**Relaciones:** `tasks` (TaskTemplate[])

### TaskTemplate

| Campo                    | Tipo                    | Notas                 |
| ------------------------ | ----------------------- | --------------------- |
| id                       | CUID                    | PK, auto-generated    |
| categoryId               | String                  | FK → CategoryTemplate |
| name                     | String(200)             |                       |
| taskType                 | TaskType                |                       |
| professionalRequirement  | ProfessionalRequirement | Default: OWNER_CAN_DO |
| technicalDescription     | String(1000)?           |                       |
| priority                 | TaskPriority            | Default: MEDIUM       |
| recurrenceType           | RecurrenceType          |                       |
| recurrenceMonths         | Int                     | Default: 12           |
| estimatedDurationMinutes | Int?                    |                       |
| displayOrder             | Int                     | Default: 0            |
| createdAt                | DateTime                |                       |
| updatedAt                | DateTime                |                       |

**Indices:** `categoryId`
**Cascade:** onDelete de CategoryTemplate elimina sus TaskTemplates

## Notas de Implementacion

### Prisma Select y Permisos

Cuando se usa `select` en relaciones, TODOS los campos necesarios para verificacion de permisos deben estar incluidos:

```typescript
// INCORRECTO — userId no esta disponible para el check de permisos
const INCLUDE = {
  property: { select: { id: true, address: true, city: true } },
};

// CORRECTO — incluye userId para verificar acceso
const INCLUDE = {
  property: { select: { id: true, address: true, city: true, userId: true } },
};
```

### Cascade Deletes

- `BudgetLineItem` → cascade on delete de `BudgetRequest`
- `BudgetResponse` → cascade on delete de `BudgetRequest`
- `ServiceRequestPhoto` → cascade on delete de `ServiceRequest`
- `TaskTemplate` → cascade on delete de `CategoryTemplate`

### Restrict Deletes

- `Task` → restrict on delete de `Category` (previene eliminar categorias con tareas)
- `TaskLog` → restrict on delete de `User` (previene eliminar usuarios con logs)
- `TaskNote` → restrict on delete de `User` (previene eliminar usuarios con notas)

### Tipos Decimal (Montos)

Los campos monetarios usan `Decimal` (no `Float`) para evitar errores de redondeo IEEE 754:

- `BudgetLineItem.quantity`: `Decimal(12,4)`
- `BudgetLineItem.unitPrice`: `Decimal(12,2)`
- `BudgetLineItem.subtotal`: `Decimal(14,2)`
- `BudgetResponse.totalAmount`: `Decimal(14,2)`
- `TaskLog.cost`: `Decimal(12,2)`

En el backend se usa `Prisma.Decimal` para aritmetica. Los valores se serializan como strings JSON.

### Campos de Auditoria

`BudgetRequest.updatedBy` y `ServiceRequest.updatedBy` registran el ID del usuario que realizo el ultimo cambio de estado. Se setea automaticamente en cada `updateStatus()`.

### Seed Data

El seed (`prisma/seed.ts`) crea:

1. Usuario admin: `admin@epde.com` / password configurable via `SEED_ADMIN_PASSWORD` (default: `Admin123!`, warning si usa default)
2. 10 categorias de mantenimiento por defecto
3. 9 CategoryTemplates con 45 TaskTemplates (nomenclador de tareas)
