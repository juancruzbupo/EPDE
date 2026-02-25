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

| Valor       | Meses        | Label         |
| ----------- | ------------ | ------------- |
| `MONTHLY`   | 1            | Mensual       |
| `QUARTERLY` | 3            | Trimestral    |
| `BIANNUAL`  | 6            | Semestral     |
| `ANNUAL`    | 12           | Anual         |
| `CUSTOM`    | configurable | Personalizado |

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

**Indices:** `email`
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

| Campo       | Tipo    | Notas                          |
| ----------- | ------- | ------------------------------ |
| id          | UUID    | PK                             |
| name        | String  | Unique                         |
| description | String? |                                |
| icon        | String? | Nombre de icono Lucide         |
| order       | Int     | Para ordenamiento (default: 0) |

**Categorias por defecto (seed):** Electricidad, Plomeria, Pintura, Techos y Cubiertas, Jardin y Exteriores, Climatizacion, Seguridad, Limpieza General, Estructural, Aberturas

### Task

| Campo             | Tipo           | Notas                        |
| ----------------- | -------------- | ---------------------------- |
| id                | UUID           | PK                           |
| maintenancePlanId | String         | FK → MaintenancePlan         |
| categoryId        | String         | FK → Category                |
| name              | String         |                              |
| description       | String?        |                              |
| priority          | TaskPriority   | Default: MEDIUM              |
| recurrenceType    | RecurrenceType | Default: ANNUAL              |
| recurrenceMonths  | Int?           | Para CUSTOM                  |
| nextDueDate       | DateTime       | Proxima fecha de vencimiento |
| order             | Int            | Orden dentro del plan        |
| status            | TaskStatus     | Default: PENDING             |
| createdAt         | DateTime       |                              |
| updatedAt         | DateTime       |                              |
| deletedAt         | DateTime?      | Soft delete                  |

**Indices:** `maintenancePlanId`, `nextDueDate`, `status`
**Status se actualiza via cron:** PENDING → UPCOMING (30 dias) → OVERDUE

### TaskLog

| Campo       | Tipo     | Notas          |
| ----------- | -------- | -------------- |
| id          | UUID     | PK             |
| taskId      | String   | FK → Task      |
| completedAt | DateTime | Default: now() |
| completedBy | String   | FK → User      |
| notes       | String?  |                |
| photoUrl    | String?  |                |

**Indice:** `taskId`

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

| Campo       | Tipo         | Notas            |
| ----------- | ------------ | ---------------- |
| id          | UUID         | PK               |
| propertyId  | String       | FK → Property    |
| requestedBy | String       | FK → User        |
| title       | String       |                  |
| description | String?      |                  |
| status      | BudgetStatus | Default: PENDING |
| createdAt   | DateTime     |                  |
| updatedAt   | DateTime     |                  |

**Indices:** `propertyId`, `status`
**Relaciones:** `property`, `requester`, `lineItems`, `response` (1:1)

### BudgetLineItem

| Campo           | Tipo   | Notas                                  |
| --------------- | ------ | -------------------------------------- |
| id              | UUID   | PK                                     |
| budgetRequestId | String | FK → BudgetRequest (onDelete: Cascade) |
| description     | String |                                        |
| quantity        | Float  |                                        |
| unitPrice       | Float  |                                        |
| subtotal        | Float  | quantity \* unitPrice                  |

### BudgetResponse

| Campo           | Tipo      | Notas                                               |
| --------------- | --------- | --------------------------------------------------- |
| id              | UUID      | PK                                                  |
| budgetRequestId | String    | FK → BudgetRequest, Unique (1:1, onDelete: Cascade) |
| totalAmount     | Float     | Suma de subtotals                                   |
| estimatedDays   | Int?      |                                                     |
| notes           | String?   |                                                     |
| validUntil      | DateTime? | Formato: YYYY-MM-DD                                 |
| respondedAt     | DateTime  |                                                     |

### ServiceRequest

| Campo       | Tipo           | Notas                    |
| ----------- | -------------- | ------------------------ |
| id          | UUID           | PK                       |
| propertyId  | String         | FK → Property            |
| requestedBy | String         | FK → User                |
| title       | String         |                          |
| description | String         | Requerido (min 10 chars) |
| urgency     | ServiceUrgency | Default: MEDIUM          |
| status      | ServiceStatus  | Default: OPEN            |
| createdAt   | DateTime       |                          |
| updatedAt   | DateTime       |                          |

**Indices:** `propertyId`, `status`
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

**Indices:** `[userId, read]`, `createdAt`

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

### Seed Data

El seed (`prisma/seed.ts`) crea:

1. Usuario admin: `admin@epde.com` / `Admin123!`
2. 10 categorias de mantenimiento por defecto
