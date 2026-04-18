# Modelo de Datos

Base de datos PostgreSQL 16, ORM Prisma 6. **45 modelos**, 30 enums.

## Diagrama de Relaciones

```
User ─1:N─ Property ─1:1─ MaintenancePlan ─1:N─ Task
  │                │                                │
  │                ├─1:N─ BudgetRequest ─1:N─ BudgetLineItem
  │                │         └─1:1─ BudgetResponse
  │                │
  │                ├─1:N─ ServiceRequest ─1:N─ ServiceRequestPhoto
  │                │                │
  │                │                └─N:1─ Task (FK: taskId, nullable, onDelete: SetNull)
  │                │
  │                ├─1:N─ InspectionChecklist ─1:N─ InspectionItem
  │                │         │                        └─N:1─ Task (FK: taskId, nullable)
  │                │         └─ sourceInspectionId → MaintenancePlan (opcional)
  │                │
  │                └─1:N─ ISVSnapshot (monthly health index snapshots)
  │
  ├─1:N─ TaskLog
  ├─1:N─ TaskNote
  ├─1:N─ BudgetRequest (requester)
  ├─1:N─ ServiceRequest (requester)
  ├─1:N─ InspectionChecklist (inspector)
  └─1:N─ Notification

Category ─1:N─ Task
    └─N:1─ CategoryTemplate (FK: categoryTemplateId, nullable, onDelete: SetNull)

CategoryTemplate ─1:N─ TaskTemplate
                         └─ referenced by InspectionItem.taskTemplateId

Professional ─1:N─ ProfessionalSpecialtyAssignment
             ─1:N─ ProfessionalAttachment (matrícula, seguro RC, cert)
             ─1:N─ ProfessionalRating
             ─1:N─ ProfessionalTimelineNote
             ─1:N─ ProfessionalTag
             ─1:N─ ServiceRequestAssignment ──1:1── ServiceRequest
             ─1:N─ ProfessionalPayment

Property ─1:N─ TechnicalInspection ─N:1─ User (requester)
```

**Flujo principal:** Inspección → Plan. La arquitecta inspecciona la propiedad usando items generados desde TaskTemplates. Al completar la inspección, genera el plan de mantenimiento con prioridades ajustadas según hallazgos.

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

| Valor       | Label       |
| ----------- | ----------- |
| `EXCELLENT` | Excelente   |
| `GOOD`      | Bueno       |
| `FAIR`      | Aceptable   |
| `POOR`      | Deteriorado |
| `CRITICAL`  | Crítico     |

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

### PropertySector

| Valor           | Label         |
| --------------- | ------------- |
| `EXTERIOR`      | Exterior      |
| `ROOF`          | Techos        |
| `TERRACE`       | Terraza       |
| `INTERIOR`      | Interior      |
| `KITCHEN`       | Cocina        |
| `BATHROOM`      | Baños         |
| `BASEMENT`      | Subsuelo      |
| `GARDEN`        | Jardín        |
| `INSTALLATIONS` | Instalaciones |

### NotificationType

| Valor            | Descripcion                           |
| ---------------- | ------------------------------------- |
| `TASK_REMINDER`  | Recordatorio de tarea proxima/vencida |
| `BUDGET_UPDATE`  | Cambio de estado en presupuesto       |
| `SERVICE_UPDATE` | Cambio de estado en solicitud         |
| `SYSTEM`         | Notificacion del sistema              |

### TechnicalInspectionType

| Valor        | Descripcion                                 |
| ------------ | ------------------------------------------- |
| `BASIC`      | Inspección técnica básica (informe general) |
| `STRUCTURAL` | Inspección estructural profunda             |
| `SALE`       | Inspección para compraventa                 |

### TechnicalInspectionStatus

| Valor          | Descripcion                           |
| -------------- | ------------------------------------- |
| `REQUESTED`    | Cliente la solicitó                   |
| `SCHEDULED`    | Visita agendada                       |
| `IN_PROGRESS`  | Relevamiento en curso                 |
| `REPORT_READY` | PDF firmado subido, pendiente de pago |
| `PAID`         | Pago registrado. Terminal.            |
| `CANCELED`     | Soft-deleted. Terminal.               |

### TechnicalInspectionPaymentStatus

| Valor      | Descripcion                       |
| ---------- | --------------------------------- |
| `PENDING`  | Sin pagar todavía                 |
| `PAID`     | Pago recibido y registrado        |
| `CANCELED` | Inspección cancelada, no se cobra |

### InspectionPriceTier

Tier de superficie que define el precio al crear una inspección técnica. Snapshot congelado en `TechnicalInspection.priceTier`.

| Valor    | Rango      | Notas                                                        |
| -------- | ---------- | ------------------------------------------------------------ |
| `SMALL`  | ≤ 120 m²   | Casas chicas en PB                                           |
| `MEDIUM` | 120–250 m² | Default. También fallback si `Property.squareMeters` es null |
| `LARGE`  | > 250 m²   | Casas grandes o en varios niveles                            |

## Entidades

### User

| Campo                 | Tipo       | Notas                                         |
| --------------------- | ---------- | --------------------------------------------- |
| id                    | UUID       | PK, auto-generated                            |
| email                 | String     | Unique                                        |
| passwordHash          | String?    | Null hasta que el cliente setea password      |
| name                  | String     |                                               |
| phone                 | String?    |                                               |
| role                  | UserRole   | Default: CLIENT                               |
| status                | UserStatus | Default: INVITED                              |
| activatedAt           | DateTime?  | Fecha de activacion (set-password)            |
| subscriptionExpiresAt | DateTime?  | Fin de suscripcion (6 meses desde activacion) |
| createdAt             | DateTime   |                                               |
| updatedAt             | DateTime   |                                               |
| deletedAt             | DateTime?  | Soft delete                                   |

**Indices:** `email`, `[role, deletedAt]`, `[status, subscriptionExpiresAt]`
**Soft delete:** Si — `findByEmail` debe usar `writeModel` para encontrar eliminados

### Property

| Campo         | Tipo             | Notas              |
| ------------- | ---------------- | ------------------ |
| id            | UUID             | PK                 |
| userId        | String           | FK → User          |
| address       | String           |                    |
| city          | String           |                    |
| type          | PropertyType     | Default: HOUSE     |
| activeSectors | PropertySector[] | 9 sectores activos |
| yearBuilt     | Int?             |                    |
| squareMeters  | Float?           |                    |
| photoUrl      | String?          | URL de foto en R2  |
| createdBy     | String?          | Auditoria          |
| updatedBy     | String?          | Auditoria          |
| createdAt     | DateTime         |                    |
| updatedAt     | DateTime         |                    |
| deletedAt     | DateTime?        | Soft delete        |

**Indices:** `userId`, `[userId, deletedAt]`
**Relaciones:** `user`, `maintenancePlan` (1:1), `budgetRequests`, `serviceRequests`, `isvSnapshots`

### MaintenancePlan

| Campo              | Tipo       | Notas                             |
| ------------------ | ---------- | --------------------------------- |
| id                 | UUID       | PK                                |
| propertyId         | String     | FK → Property, Unique (1:1)       |
| name               | String     |                                   |
| status             | PlanStatus | Default: DRAFT                    |
| sourceInspectionId | String?    | FK → InspectionChecklist (origen) |
| createdBy          | String?    | Auditoria                         |
| updatedBy          | String?    | Auditoria                         |
| createdAt          | DateTime   |                                   |
| updatedAt          | DateTime   |                                   |

**Relaciones:** `property`, `tasks`
**Flujo:** El plan se genera desde una inspección completada via `POST /inspections/:id/generate-plan`. La transacción crea plan + tasks + baseline TaskLogs + marca checklist COMPLETED, con timeout de 30s (P2028 → `InternalServerErrorException`).
**Back-reference:** Cuando el `InspectionChecklist` origen se soft-deletea, `sourceInspectionId` se nulla en este plan (ver InspectionChecklist).

### Category

| Campo              | Tipo      | Notas                                     |
| ------------------ | --------- | ----------------------------------------- |
| id                 | UUID      | PK                                        |
| name               | String    | @@unique([name, deletedAt])               |
| description        | String?   |                                           |
| icon               | String?   | Nombre de icono Lucide                    |
| order              | Int       | Para ordenamiento (default: 0)            |
| categoryTemplateId | String?   | FK → CategoryTemplate (onDelete: SetNull) |
| deletedAt          | DateTime? | Soft delete                               |

**Indices:** `[deletedAt]`
**Soft delete:** Si — via Prisma extension (misma mecanica que User, Property, Task). El unique compuesto `[name, deletedAt]` permite recrear categorias con el mismo nombre si la anterior fue soft-deleted.
**Categorias por defecto (seed):** Estructura, Techos y Cubiertas, Instalación Eléctrica, Instalación Sanitaria, Gas y Calefacción, Aberturas, Pintura y Revestimientos, Jardín y Exteriores, Climatización, Humedad e Impermeabilización, Seguridad contra Incendio, Control de Plagas, Pisos y Contrapisos, Mobiliario y Equipamiento Fijo (14 categorias, vinculadas a CategoryTemplates via FK)

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
| inspectionFinding        | String?                 | Hallazgo de la inspección origen |
| inspectionPhotoUrl       | String?                 | Foto del hallazgo                |
| riskScore                | Int                     | Score compuesto de riesgo (0-18) |
| sector                   | PropertySector?         | Sector de la vivienda            |
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

| Campo       | Tipo           | Notas                                        |
| ----------- | -------------- | -------------------------------------------- |
| id          | UUID           | PK                                           |
| propertyId  | String         | FK → Property                                |
| requestedBy | String         | FK → User                                    |
| taskId      | String?        | FK → Task (opcional, vincula a tarea origen) |
| title       | String         |                                              |
| description | String         | Requerido (min 10 chars)                     |
| urgency     | ServiceUrgency | Default: MEDIUM                              |
| status      | ServiceStatus  | Default: OPEN                                |
| updatedBy   | String?        | ID del usuario que realizo el ultimo cambio  |
| createdBy   | String?        | Auditoria                                    |
| createdAt   | DateTime       |                                              |
| updatedAt   | DateTime       |                                              |
| deletedAt   | DateTime?      | Soft delete                                  |

**Indices:** `propertyId`, `status`, `taskId`, `[propertyId, deletedAt]`, `[requestedBy, status]`, `[status, urgency]`
**Soft delete:** Si — via Prisma extension
**Relaciones:** `property`, `requester`, `task`, `photos`

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

### ISVSnapshot

Snapshot mensual del Índice de Salud de la Vivienda (ISV). Generado por cron job el 1ro de cada mes (02:00 UTC).

| Campo        | Tipo       | Notas                                    |
| ------------ | ---------- | ---------------------------------------- |
| id           | UUID       | PK                                       |
| propertyId   | String     | FK → Property                            |
| snapshotDate | DateTime   | Fecha del snapshot (1ro mes)             |
| score        | Int        | Score global ISV (0-100)                 |
| label        | String(50) | Excelente/Bueno/Regular/Crítico          |
| compliance   | Int        | Dimensión: cumplimiento (35%)            |
| condition    | Int        | Dimensión: condición (30%)               |
| coverage     | Int        | Dimensión: cobertura (20%)               |
| investment   | Int        | Dimensión: inversión (15%)               |
| trend        | Int        | Tendencia (>50 mejora, <50 declina)      |
| sectorScores | Json       | Array de {sector, score, overdue, total} |
| createdAt    | DateTime   |                                          |

**Indices:** `propertyId`, `@@unique([propertyId, snapshotDate])`
**Cascade:** onDelete de Property elimina sus ISVSnapshots
**ISV Label:** score ≥80 "Excelente", ≥60 "Bueno", ≥40 "Regular", ≥20 "Necesita atención", <20 "Crítico"
**Legacy `trend`:** Snapshots creados antes del commit `43f624b` tienen `trend=50` porque el batch no computaba tendencia correctamente. Hoy ningún consumidor lee trend histórico (`findLatestForProperties` solo selecciona `score`/`label`). Si una feature futura lo consume, requiere backfill time-machine (reconstruir estado a la fecha del snapshot).

### CertificateCounter

Singleton para numeración secuencial atómica de certificados de mantenimiento preventivo (CERT-0001, CERT-0002...).

| Campo      | Tipo     | Notas                              |
| ---------- | -------- | ---------------------------------- |
| id         | String   | PK, siempre "singleton"            |
| lastNumber | Int      | Último número emitido (default: 0) |
| updatedAt  | DateTime | Auto-updated                       |

**Patrón:** Upsert atómico — `create: { lastNumber: 1 }` / `update: { lastNumber: { increment: 1 } }`. Retorna `CERT-NNNN` con zero-padding a 4 dígitos.
**No tiene relaciones:** Es un contador independiente. Los certificados no se persisten como entidad — se generan on-demand desde datos existentes (ISV, TaskLogs, InspectionChecklists).

### Professional

Directorio interno de profesionales matriculados al que EPDE deriva service requests. Admin-only, sin auth. Ver ADR-018.

| Campo              | Tipo                     | Notas                               |
| ------------------ | ------------------------ | ----------------------------------- |
| id                 | UUID                     | PK                                  |
| name               | VarChar(200)             |                                     |
| email              | VarChar(254)             |                                     |
| phone              | VarChar(30)              |                                     |
| registrationNumber | VarChar(50)              | Matrícula profesional (obligatoria) |
| registrationBody   | VarChar(200)             | COPIME, CPIC, etc. (obligatorio)    |
| serviceAreas       | String[]                 | Zonas que atiende                   |
| yearsOfExperience  | Int?                     |                                     |
| hourlyRateMin/Max  | Decimal(10,2)?           | Rango tarifario                     |
| availability       | ProfessionalAvailability | AVAILABLE/BUSY/UNAVAILABLE          |
| availableUntil     | DateTime?                | Para estado BUSY                    |
| tier               | ProfessionalTier         | A/B/C/BLOCKED (default: B)          |
| blockedReason      | VarChar(500)?            | Obligatoria cuando tier=BLOCKED     |
| notes              | VarChar(4000)?           | Notas libres del admin              |
| createdBy          | String                   | Admin que lo cargó                  |
| deletedAt          | DateTime?                | Soft delete                         |

**Soft delete**: sí — extension enforce filter en reads
**Índices**: `[deletedAt]`, `[availability, deletedAt]`, `[tier, deletedAt]`

### ProfessionalSpecialtyAssignment

M:N entre profesional y especialidad. Máximo 1 por profesional tiene `isPrimary: true`.

**Unique compuesto:** `[professionalId, specialty]`

**19 valores de `ProfessionalSpecialty`** (alineados a Argentina — ver ADR-018 revisado):

| Valor                  | Label                                    | Tier |
| ---------------------- | ---------------------------------------- | ---- |
| `PLUMBER`              | Plomero matriculado                      | 1    |
| `GASFITTER`            | Gasista matriculado (ENARGAS)            | 1    |
| `ELECTRICIAN`          | Electricista matriculado                 | 1    |
| `ARCHITECT_ENGINEER`   | Arquitecto / Ingeniero (+ documentación) | 2    |
| `MASON`                | Albañil / Maestro Mayor de Obras         | 2    |
| `ROOFER_WATERPROOFER`  | Techista / Impermeabilizador             | 2    |
| `HVAC_TECHNICIAN`      | Técnico HVAC / Aires acondicionados      | 3    |
| `PEST_CONTROL`         | Fumigador / Control de plagas            | 3    |
| `EXTINGUISHER_SERVICE` | Servicio de matafuegos                   | 3    |
| `DRAIN_CLEANER`        | Desobstrucción / Desagote cloacal        | 3    |
| `PAINTER`              | Pintor                                   | 4    |
| `CARPENTER`            | Carpintero / Ebanista                    | 4    |
| `LANDSCAPER`           | Jardinero / Paisajista                   | 4    |
| `SOLAR_SPECIALIST`     | Especialista en energía solar            | 4    |
| `WATER_TECHNICIAN`     | Técnico en agua potable (pozo)           | 4    |
| `LOCKSMITH`            | Cerrajero                                | 4    |
| `GLAZIER`              | Vidriero / Carpintero de aluminio        | 4    |
| `IRONWORKER`           | Herrero                                  | 4    |
| `DRYWALL_INSTALLER`    | Yesero / Durloquista                     | 4    |

### ProfessionalAttachment

Documentos subidos: matrícula, seguro RC, DNI, certificados de curso.

| Campo      | Tipo                       | Notas                                |
| ---------- | -------------------------- | ------------------------------------ |
| id         | UUID                       | PK                                   |
| type       | ProfessionalAttachmentType | MATRICULA/SEGURO_RC/DNI/CERT/OTRO    |
| url        | String                     | URL en Cloudflare R2                 |
| fileName   | VarChar(200)               |                                      |
| expiresAt  | DateTime?                  | Obligatorio para MATRICULA/SEGURO_RC |
| verifiedAt | DateTime?                  | Admin marcó como verificado          |
| verifiedBy | String?                    | Admin que lo verificó                |

**Cron `matricula-expiry`**: diariamente a las 11:00 UTC escanea attachments con `expiresAt ≤ 30d`, notifica al admin. Si vence, flipea availability del profesional a UNAVAILABLE.

### ProfessionalRating

Valoraciones del admin (1-5) con 3 sub-ratings opcionales (punctuality, quality, priceValue). El campo `clientComment` es capturado post-SR pero NO participa del score.

**Score agregado**: calculado bayesianamente en el service layer (prior m=3.5, pseudocount C=5). No persistido.

### ProfessionalTimelineNote / ProfessionalTag

Notas privadas del admin (feed cronológico) + tags operativos (#confiable, #caro, etc.). Tags son únicos por profesional, normalizados a lowercase con prefijo `#`.

### ServiceRequestAssignment

Link 1:1 entre ServiceRequest y Professional (unique constraint en `serviceRequestId`).

- Profesionales `tier=BLOCKED` rechazan asignaciones nuevas
- SRs `CLOSED` rechazan asignaciones nuevas
- Las asignaciones existentes se mantienen aunque el profesional sea bloqueado posteriormente

### ProfessionalPayment

Pagos que EPDE le hace al profesional. Status machine: `PENDING → PAID` (o `CANCELED`). Al marcar PAID se setea `paidAt`.

### TechnicalInspection

Inspección técnica firmada por la arquitecta matriculada (servicio pagado aparte del plan). Ver ADR-019 para pricing, flujo y motivación.

| Campo                 | Tipo                             | Notas                                               |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| id                    | UUID                             | PK                                                  |
| inspectionNumber      | String(20)                       | `INSP-YYYY-NNNN`, único, counter atómico por año    |
| propertyId            | UUID                             | FK → Property (cascade)                             |
| requestedBy           | UUID                             | FK → User (restrict — requester no se puede borrar) |
| type                  | TechnicalInspectionType          | BASIC / STRUCTURAL / SALE                           |
| status                | TechnicalInspectionStatus        | Default: REQUESTED                                  |
| clientNotes           | String(2000)?                    | Notas del cliente al solicitar                      |
| adminNotes            | String(4000)?                    | Notas internas del admin                            |
| scheduledFor          | DateTime?                        | Fecha coordinada para la visita                     |
| completedAt           | DateTime?                        | Set automáticamente al pasar a REPORT_READY         |
| deliverableUrl        | String?                          | URL del PDF firmado                                 |
| deliverableFileName   | String(200)?                     | Nombre original del archivo                         |
| feeAmount             | Decimal(12,2)                    | Precio congelado al crear (tier-dependiente)        |
| priceTier             | InspectionPriceTier              | Snapshot del tier de superficie aplicado            |
| propertySqm           | Float?                           | Snapshot de `Property.squareMeters` al crear        |
| feeStatus             | TechnicalInspectionPaymentStatus | PENDING / PAID / CANCELED                           |
| hadActivePlan         | Boolean                          | Snapshot: si tenía plan activo al solicitar         |
| paidAt                | DateTime?                        | Set al registrar pago                               |
| paymentMethod         | String(50)?                      | transferencia / efectivo / mercadopago / otro       |
| paymentReceiptUrl     | String?                          | Comprobante del cliente (opcional)                  |
| createdAt / updatedAt | DateTime                         |                                                     |
| deletedAt             | DateTime?                        | Soft delete                                         |

**Indices:** `[propertyId]`, `[requestedBy]`, `[status]`, `[deletedAt]`, `[status, createdAt]`
**Soft delete:** Sí — criterio audit relevance (registro profesional firmado con valor legal).
**Invariantes:**

- `feeAmount` inmutable post-create (precio congelado).
- `status=PAID` requiere `deliverableUrl ≠ null`.
- Solo CLIENT con `subscriptionExpiresAt >= now` puede crear.
- Transiciones permitidas: `REQUESTED → SCHEDULED → IN_PROGRESS → REPORT_READY → PAID`, cualquier no-terminal puede ir a `CANCELED`.

### TechnicalInspectionCounter

Singleton (`id = "singleton"`) que sostiene el counter atómico por año para generar `inspectionNumber`. Campo `yearlyCounters: Json` tipo `{ "2026": 42, "2027": 0 }`. Mismo pattern que BudgetRequest.

### InspectionChecklist

Checklist de inspección visual de una propiedad. Genera los items desde TaskTemplates filtrados por los sectores activos de la propiedad.

| Campo       | Tipo                      | Notas                                          |
| ----------- | ------------------------- | ---------------------------------------------- |
| id          | UUID                      | PK                                             |
| propertyId  | String                    | FK → Property                                  |
| inspectedBy | String                    | FK → User (inspector/arquitecta)               |
| inspectedAt | DateTime                  | Fecha de la inspección (default: now)          |
| notes       | String(2000)              | Notas generales                                |
| status      | InspectionChecklistStatus | Default: DRAFT. COMPLETED tras generar plan    |
| completedAt | DateTime?                 | Set al pasar a COMPLETED (post plan-generated) |
| deletedAt   | DateTime?                 | Soft delete                                    |

**Indices:** `[propertyId, inspectedAt DESC]`, `[propertyId, status]` (busca drafts activos)
**Soft delete:** Si — via Prisma extension. Al soft-deletear, se nulla `MaintenancePlan.sourceInspectionId` para evitar FK huérfanas.
**Relaciones:** `property`, `inspector`, `items[]`

**Lock post-generación:** Un checklist en estado `COMPLETED` no se puede editar. La transición DRAFT→COMPLETED se dispara al generar el plan. El guard `findActiveDraftByProperty` previene dos drafts concurrentes por propiedad (devuelve `ConflictException`).

### InspectionItem

Item individual de una inspección. Cada item corresponde a un TaskTemplate y se evalúa como OK, Necesita atención, o Requiere profesional.

| Campo           | Tipo                 | Notas                                   |
| --------------- | -------------------- | --------------------------------------- |
| id              | UUID                 | PK                                      |
| checklistId     | String               | FK → InspectionChecklist (cascade)      |
| sector          | PropertySector       | Sector de la vivienda                   |
| name            | String(200)          | Nombre del punto de inspección          |
| description     | String(2000)?        | Descripción del template                |
| status          | InspectionItemStatus | Default: PENDING                        |
| finding         | String(2000)?        | Hallazgo encontrado                     |
| photoUrl        | String?              | Foto del hallazgo                       |
| taskId          | String?              | FK → Task (se vincula al generar plan)  |
| taskTemplateId  | String?              | ID del TaskTemplate origen              |
| inspectionGuide | Text?                | Guía markdown (snapshot del template)   |
| guideImageUrls  | String[]             | URLs de imágenes de referencia          |
| isCustom        | Boolean              | Default: false (true = agregado manual) |
| order           | Int                  | Orden dentro del checklist              |
| deletedAt       | DateTime?            | Soft delete                             |

**Indices:** `[checklistId, sector]`, `[checklistId, order]`, `[taskTemplateId]`
**Soft delete:** Si — via Prisma extension
**InspectionItemStatus:** `PENDING` | `OK` | `NEEDS_ATTENTION` | `NEEDS_PROFESSIONAL`

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

| Campo                    | Tipo                    | Notas                                        |
| ------------------------ | ----------------------- | -------------------------------------------- |
| id                       | CUID                    | PK, auto-generated                           |
| categoryId               | String                  | FK → CategoryTemplate                        |
| name                     | String(200)             |                                              |
| taskType                 | TaskType                |                                              |
| professionalRequirement  | ProfessionalRequirement | Default: OWNER_CAN_DO                        |
| technicalDescription     | String(1000)?           |                                              |
| priority                 | TaskPriority            | Default: MEDIUM                              |
| recurrenceType           | RecurrenceType          |                                              |
| recurrenceMonths         | Int                     | Default: 12                                  |
| estimatedDurationMinutes | Int?                    |                                              |
| defaultSector            | PropertySector?         | Sector donde aplica la tarea                 |
| inspectionGuide          | Text?                   | Guía markdown de inspección                  |
| guideImageUrls           | String[]                | URLs de imágenes de referencia (default: []) |
| displayOrder             | Int                     | Default: 0                                   |
| createdAt                | DateTime                |                                              |
| updatedAt                | DateTime                |                                              |

**Indices:** `categoryId`, `[categoryId, displayOrder]`
**Cascade:** onDelete de CategoryTemplate elimina sus TaskTemplates
**inspectionGuide:** Markdown con secciones (Qué buscar, Cómo evaluar, Procedimiento, Normativa). Editable desde admin con formulario estructurado. 152/152 templates tienen guía.

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
- `ISVSnapshot` → cascade on delete de `Property`
- `ServiceRequest.taskId` → SetNull on delete de `Task`
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
2. 14 categorias de mantenimiento por defecto (vinculadas a CategoryTemplates via FK)
3. 14 CategoryTemplates con ~90 TaskTemplates (nomenclador de tareas). Seed usa upsert por nombre — solo inserta categorías faltantes
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

- 71 tareas (mezcla de estados: completadas, pendientes, vencidas)
- 51 task logs en 4 ciclos + 2 detecciones (grieta activa, humedad ascendente)
- 2 presupuestos: 1 COMPLETED (impermeabilización $185.000), 1 IN_PROGRESS (tratamiento humedad $280.000)
- 1 solicitud de servicio IN_PROGRESS (evaluación estructural)
- 4 notificaciones (2 no leídas)

**Carlos Rodríguez** (uso parcial, priorizó seguridad):

- 71 tareas (mayoría pendientes, priorizó gas y eléctrica)
- 14 task logs en 3 meses de actividad parcial
- 1 presupuesto QUOTED (puesta a tierra $95.000, pendiente de aprobación)
- 2 notificaciones

**Laura Fernández** (onboarding limpio):

- 71 tareas (todas pendientes, sin historial)
- Sin presupuestos, solicitudes ni historial
- 1 notificación de bienvenida

#### Resumen Cuantitativo

| Entidad        | Cantidad                             |
| -------------- | ------------------------------------ |
| Usuarios       | 4 (1 admin + 3 clientes)             |
| Propiedades    | 3                                    |
| Planes         | 3 (todos ACTIVE)                     |
| Categorías     | 13 (compartidas entre planes)        |
| Tareas         | 213 (71 × 3 propiedades)             |
| Task Logs      | 65 (María: 51, Carlos: 14, Laura: 0) |
| Presupuestos   | 3 (COMPLETED, IN_PROGRESS, QUOTED)   |
| Solicitudes    | 2 (IN_PROGRESS, OPEN)                |
| ISV Snapshots  | 18 (María: 12, Carlos: 5, Laura: 1)  |
| Notificaciones | 7                                    |
