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
| createdBy    | String?      | Auditoria         |
| updatedBy    | String?      | Auditoria         |
| createdAt    | DateTime     |                   |
| updatedAt    | DateTime     |                   |
| deletedAt    | DateTime?    | Soft delete       |

**Indices:** `userId`, `[userId, deletedAt]`
**Relaciones:** `user`, `maintenancePlan` (1:1), `budgetRequests`, `serviceRequests`

### MaintenancePlan

| Campo      | Tipo       | Notas                       |
| ---------- | ---------- | --------------------------- |
| id         | UUID       | PK                          |
| propertyId | String     | FK → Property, Unique (1:1) |
| name       | String     |                             |
| status     | PlanStatus | Default: DRAFT              |
| createdBy  | String?    | Auditoria                   |
| updatedBy  | String?    | Auditoria                   |
| createdAt  | DateTime   |                             |
| updatedAt  | DateTime   |                             |

**Relaciones:** `property`, `tasks`

### Category

| Campo       | Tipo      | Notas                          |
| ----------- | --------- | ------------------------------ |
| id          | UUID      | PK                             |
| name        | String    | @@unique([name, deletedAt])    |
| description | String?   |                                |
| icon        | String?   | Nombre de icono Lucide         |
| order       | Int       | Para ordenamiento (default: 0) |
| deletedAt   | DateTime? | Soft delete                    |

**Indices:** `[deletedAt]`
**Soft delete:** Si — via Prisma extension (misma mecanica que User, Property, Task). El unique compuesto `[name, deletedAt]` permite recrear categorias con el mismo nombre si la anterior fue soft-deleted.
**Categorias por defecto (seed):** Electricidad, Plomeria, Pintura, Techos y Cubiertas, Jardin y Exteriores, Climatizacion, Seguridad, Limpieza General, Estructural, Aberturas

### Task

| Campo                    | Tipo                    | Notas                            |
| ------------------------ | ----------------------- | -------------------------------- |
| id                       | UUID                    | PK                               |
| maintenancePlanId        | String                  | FK → MaintenancePlan             |
| categoryId               | String                  | FK → Category                    |
| name                     | String                  |                                  |
| description              | String?                 |                                  |
| priority                 | TaskPriority            | Default: MEDIUM                  |
| recurrenceType           | RecurrenceType          | Default: ANNUAL                  |
| recurrenceMonths         | Int?                    | Para CUSTOM                      |
| nextDueDate              | DateTime?               | Null para ON_DETECTION           |
| order                    | Int                     | Orden dentro del plan            |
| status                   | TaskStatus              | Default: PENDING                 |
| taskType                 | TaskType                | Default: INSPECTION              |
| professionalRequirement  | ProfessionalRequirement | Default: OWNER_CAN_DO            |
| technicalDescription     | String?                 | Descripcion tecnica del template |
| estimatedDurationMinutes | Int?                    | Duracion estimada en minutos     |
| createdAt                | DateTime                |                                  |
| updatedAt                | DateTime                |                                  |
| createdBy                | String?                 | Auditoria                        |
| updatedBy                | String?                 | Auditoria                        |
| deletedAt                | DateTime?               | Soft delete                      |

**Indices:** `maintenancePlanId`, `nextDueDate`, `status`, `categoryId`, `[status, nextDueDate]`, `[status, deletedAt]`, `[maintenancePlanId, status]`, `[nextDueDate, status]`, `[maintenancePlanId, deletedAt, status]`
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

**Indices:** `taskId`, `authorId`

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
| createdBy   | String?      | Auditoria                                   |
| createdAt   | DateTime     |                                             |
| updatedAt   | DateTime     |                                             |
| deletedAt   | DateTime?    | Soft delete                                 |

**Indices:** `propertyId`, `status`, `[propertyId, deletedAt]`, `[requestedBy, status]`, `[status, createdAt]`
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
| createdBy   | String?        | Auditoria                                   |
| createdAt   | DateTime       |                                             |
| updatedAt   | DateTime       |                                             |
| deletedAt   | DateTime?      | Soft delete                                 |

**Indices:** `propertyId`, `status`, `[propertyId, deletedAt]`, `[requestedBy, status]`, `[status, urgency]`
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

- `Task` → cascade on delete de `MaintenancePlan`
- `TaskLog` → cascade on delete de `Task`
- `TaskNote` → cascade on delete de `Task`
- `BudgetRequest` → cascade on delete de `Property`
- `BudgetLineItem` → cascade on delete de `BudgetRequest`
- `BudgetResponse` → cascade on delete de `BudgetRequest`
- `ServiceRequest` → cascade on delete de `Property`
- `ServiceRequestPhoto` → cascade on delete de `ServiceRequest`
- `Notification` → cascade on delete de `User`
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

- `createdBy` y `updatedBy` en Property, MaintenancePlan, Task, BudgetRequest, ServiceRequest — registran ID del usuario que creo/modifico el registro
- `BudgetRequest.updatedBy` y `ServiceRequest.updatedBy` se setean automaticamente en cada `updateStatus()`

### Seed Data

El seed (`prisma/seed.ts`) crea:

1. Usuario admin: `admin@epde.com` / password configurable via `SEED_ADMIN_PASSWORD` (default: `Admin123!`, warning si usa default)
2. 10 categorias de mantenimiento por defecto
3. 9 CategoryTemplates con 45 TaskTemplates (nomenclador de tareas)
4. Datos demo (`prisma/seed-demo.ts`) — 3 usuarios cliente con propiedades, planes, tareas, historial, presupuestos, solicitudes y notificaciones

### Seed Demo

El seed demo (`prisma/seed-demo.ts`) crea un dataset realista con 3 perfiles de uso diferenciado. Se ejecuta automaticamente desde `seed.ts` si no existe el usuario `maria.gonzalez@demo.com`. Es idempotente.

#### Usuarios Demo

| Usuario          | Email                       | Password   | Perfil     | Propiedad        | Antiguedad |
| ---------------- | --------------------------- | ---------- | ---------- | ---------------- | ---------- |
| María González   | `maria.gonzalez@demo.com`   | `Demo123!` | Veterana   | Casa 1985, CABA  | 18 meses   |
| Carlos Rodríguez | `carlos.rodriguez@demo.com` | `Demo123!` | Intermedio | Casa 2015, Pilar | 6 meses    |
| Laura Fernández  | `laura.fernandez@demo.com`  | `Demo123!` | Nueva      | Casa 2023, Funes | 1 mes      |

#### Datos por Usuario

**María González** (uso intensivo, historial rico):

- 48 tareas (mezcla de estados: completadas, pendientes, vencidas)
- 51 task logs en 4 ciclos + 2 detecciones (grieta activa, humedad ascendente)
- 2 presupuestos: 1 COMPLETED (impermeabilización $185.000), 1 IN_PROGRESS (tratamiento humedad $280.000)
- 1 solicitud de servicio IN_PROGRESS (evaluación estructural)
- 4 notificaciones (2 no leídas)

**Carlos Rodríguez** (uso parcial, priorizó seguridad):

- 48 tareas (mayoría pendientes, priorizó gas y eléctrica)
- 14 task logs en 3 meses de actividad parcial
- 1 presupuesto QUOTED (puesta a tierra $95.000, pendiente de aprobación)
- 2 notificaciones

**Laura Fernández** (onboarding limpio):

- 48 tareas (todas pendientes, sin historial)
- Sin presupuestos, solicitudes ni historial
- 1 notificación de bienvenida

#### Resumen Cuantitativo

| Entidad        | Cantidad                             |
| -------------- | ------------------------------------ |
| Usuarios       | 4 (1 admin + 3 clientes)             |
| Propiedades    | 3                                    |
| Planes         | 3 (todos ACTIVE)                     |
| Categorías     | 9 (compartidas entre planes)         |
| Tareas         | 144 (48 × 3 propiedades)             |
| Task Logs      | 65 (María: 51, Carlos: 14, Laura: 0) |
| Presupuestos   | 3 (COMPLETED, IN_PROGRESS, QUOTED)   |
| Solicitudes    | 1 (IN_PROGRESS)                      |
| Notificaciones | 7                                    |
