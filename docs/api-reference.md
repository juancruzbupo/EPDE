# API Reference

Base URL: `http://localhost:3001/api/v1`
Swagger UI: `http://localhost:3001/api/docs`

## Autenticacion

Todas las rutas requieren autenticacion JWT excepto las marcadas con `@Public()`.

### Tokens

- **Access token**: cookie HttpOnly `access_token`, expira en 15 minutos. Contiene `jti` (JWT ID) para blacklisting
- **Refresh token**: cookie HttpOnly `refresh_token`, expira en 7 dias. Contiene `family` UUID + `generation` counter
- Ambos se envian automaticamente con `withCredentials: true`
- Web usa singleton pattern para deduplicar refreshes concurrentes (multiples 401 = 1 solo refresh)
- El frontend intercepta 401 y refresca automaticamente. En 403 (rol revocado mid-session), fuerza logout sin intentar refresh
- Token state almacenado en Redis (families, blacklist)
- El JTI es obligatorio en todos los access tokens — tokens sin JTI son rechazados

### Flow (Token Rotation)

1. `POST /auth/login` → crea familia de tokens, genera par access+refresh, setea cookies
2. Requests posteriores envian cookies automaticamente
3. `JwtStrategy` verifica que el JTI del access token no este en blacklist (Redis) y que el campo `purpose` (si presente) sea `'access'`
4. Al expirar access token → POST /auth/refresh → rota refresh token atomicamente (Lua script en Redis, nueva generation)
5. Si la generation no coincide → **token reuse attack** → revoca toda la family (Lua retorna -1)
6. `POST /auth/logout` → blacklist access JTI + revocar family + limpia cookies

---

## Formato de Respuesta

### Exitosa (paginada)

```json
{
  "data": [...],
  "nextCursor": "uuid-or-null",
  "hasMore": true,
  "total": 42
}
```

### Exitosa (singular)

El objeto directamente (sin wrapper).

### Error

```json
{
  "statusCode": 400,
  "message": "Mensaje descriptivo",
  "error": "Bad Request"
}
```

### Validacion

```json
{
  "statusCode": 400,
  "message": ["campo debe ser un email valido", "campo es requerido"],
  "error": "Bad Request"
}
```

---

## Endpoints

### Health

| Metodo | Ruta      | Auth | Descripcion                            |
| ------ | --------- | ---- | -------------------------------------- |
| GET    | `/health` | No   | Health check (DB + Redis via Terminus) |

**Respuesta:**

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

Si algun componente falla, `status` sera `"error"` y el campo `error` contendra el detalle.

**Nota:** Swagger UI (`/api/docs`) solo esta disponible en entornos no-produccion.

---

### Auth

| Metodo | Ruta                    | Auth | Rol   | Descripcion                      |
| ------ | ----------------------- | ---- | ----- | -------------------------------- |
| POST   | `/auth/login`           | No   | —     | Login con email y password       |
| POST   | `/auth/refresh`         | No   | —     | Refrescar access token           |
| POST   | `/auth/logout`          | Si   | —     | Cerrar sesion                    |
| GET    | `/auth/me`              | Si   | —     | Obtener usuario actual           |
| POST   | `/auth/set-password`    | No   | —     | Configurar password (invitacion) |
| POST   | `/auth/forgot-password` | No   | —     | Solicitar reset de contraseña    |
| POST   | `/auth/reset-password`  | No   | —     | Resetear contraseña con token    |
| PATCH  | `/auth/me`              | Si   | Ambos | Actualizar perfil (nombre, tel)  |
| PATCH  | `/auth/me/password`     | Si   | Ambos | Cambiar contraseña               |

**POST /auth/login**

```json
{ "email": "admin@epde.com", "password": "Admin123!" }
```

**POST /auth/set-password**

```json
{ "token": "jwt-token-from-email", "newPassword": "MyPassword1" }
```

Rate limit: 5 requests/minuto en login. 15 requests/minuto en refresh. 3 requests/hora + burst protection 1 request/5 segundos en set-password.

Solo usuarios con status ACTIVE pueden loguearse. Usuarios INACTIVE reciben 401.

---

### Clientes (ADMIN only)

| Metodo | Ruta           | Auth | Rol   | Descripcion             |
| ------ | -------------- | ---- | ----- | ----------------------- |
| GET    | `/clients`     | Si   | ADMIN | Listar clientes         |
| GET    | `/clients/:id` | Si   | ADMIN | Detalle de cliente      |
| POST   | `/clients`     | Si   | ADMIN | Crear/invitar cliente   |
| PATCH  | `/clients/:id` | Si   | ADMIN | Actualizar cliente      |
| DELETE | `/clients/:id` | Si   | ADMIN | Eliminar cliente (soft) |

**GET /clients** — Query params:

- `search` (string) — Busca por nombre o email
- `status` (INVITED | ACTIVE | INACTIVE)
- `cursor` (uuid)
- `take` (1-100, default: 20)

**POST /clients**

```json
{ "email": "cliente@email.com", "name": "Juan Perez", "phone": "+5491112345678" }
```

- Si el email existe soft-deleted → restaura el usuario
- Si el email existe activo → 409 Conflict
- Envia email de invitacion con link para setear password

---

### Propiedades

| Metodo | Ruta                             | Auth | Rol   | Descripcion              |
| ------ | -------------------------------- | ---- | ----- | ------------------------ |
| GET    | `/properties`                    | Si   | Ambos | Listar propiedades       |
| GET    | `/properties/:id`                | Si   | Ambos | Detalle                  |
| POST   | `/properties`                    | Si   | ADMIN | Crear propiedad          |
| PATCH  | `/properties/:id`                | Si   | ADMIN | Actualizar               |
| DELETE | `/properties/:id`                | Si   | ADMIN | Eliminar (soft)          |
| GET    | `/properties/:id/health-index`   | Si   | Ambos | ISV en tiempo real       |
| GET    | `/properties/:id/health-history` | Si   | Ambos | Historial ISV (12 meses) |
| GET    | `/properties/:id/expenses`       | Si   | Ambos | Gastos de la propiedad   |
| GET    | `/properties/:id/photos`         | Si   | Ambos | Galería de fotos         |

**GET /properties** — Query params:

- `search`, `userId`, `city`, `type`, `cursor`, `take`
- CLIENT solo ve sus propiedades (filtro automatico)

**POST /properties**

```json
{
  "userId": "uuid-del-cliente",
  "address": "Av. Corrientes 1234",
  "city": "CABA",
  "type": "APARTMENT",
  "yearBuilt": 1990,
  "squareMeters": 85
}
```

**GET /properties** incluye `latestISV` en cada propiedad (último snapshot ISV):

```json
{
  "data": [
    {
      "id": "uuid",
      "address": "...",
      "latestISV": { "score": 72, "label": "Bueno" }
    }
  ]
}
```

**GET /properties/:id/health-index** — ISV calculado en tiempo real:

```json
{
  "data": {
    "score": 72,
    "label": "Bueno",
    "dimensions": {
      "compliance": 80,
      "condition": 70,
      "coverage": 65,
      "investment": 60,
      "trend": 52
    },
    "sectorScores": [{ "sector": "INTERIOR", "score": 80, "overdue": 1, "total": 12 }]
  }
}
```

**GET /properties/:id/health-history** — Últimos 12 snapshots mensuales:

```json
{
  "data": [
    {
      "month": "2025-08",
      "score": 78,
      "label": "Bueno",
      "compliance": 90,
      "condition": 80,
      "coverage": 70,
      "investment": 65,
      "trend": 50
    }
  ]
}
```

---

### Categorias

| Metodo | Ruta              | Auth | Rol   | Descripcion       |
| ------ | ----------------- | ---- | ----- | ----------------- |
| GET    | `/categories`     | Si   | Ambos | Listar categorias |
| POST   | `/categories`     | Si   | ADMIN | Crear categoria   |
| PATCH  | `/categories/:id` | Si   | ADMIN | Actualizar        |
| DELETE | `/categories/:id` | Si   | ADMIN | Eliminar (soft)   |

---

### Planes de Mantenimiento

| Metodo | Ruta                                            | Auth | Rol   | Descripcion             |
| ------ | ----------------------------------------------- | ---- | ----- | ----------------------- |
| GET    | `/maintenance-plans`                            | Si   | Ambos | Listar planes           |
| GET    | `/maintenance-plans/tasks`                      | Si   | Ambos | Listar todas las tareas |
| GET    | `/maintenance-plans/:id`                        | Si   | Ambos | Obtener plan por ID     |
| PATCH  | `/maintenance-plans/:id`                        | Si   | ADMIN | Actualizar plan         |
| POST   | `/maintenance-plans/:id/tasks`                  | Si   | ADMIN | Crear tarea             |
| GET    | `/maintenance-plans/:id/tasks/:taskId`          | Si   | Ambos | Detalle de tarea        |
| PATCH  | `/maintenance-plans/:id/tasks/:taskId`          | Si   | ADMIN | Actualizar tarea        |
| DELETE | `/maintenance-plans/:id/tasks/:taskId`          | Si   | ADMIN | Eliminar tarea          |
| POST   | `/maintenance-plans/:id/tasks/:taskId/complete` | Si   | Ambos | Completar tarea         |
| GET    | `/maintenance-plans/:id/tasks/:taskId/logs`     | Si   | Ambos | Historial de tarea      |
| GET    | `/maintenance-plans/:id/tasks/:taskId/notes`    | Si   | Ambos | Notas de tarea          |
| POST   | `/maintenance-plans/:id/tasks/:taskId/notes`    | Si   | Ambos | Agregar nota            |
| PATCH  | `/maintenance-plans/:id/tasks/reorder`          | Si   | ADMIN | Reordenar tareas        |

**Nota:** Los planes se crean automaticamente al crear una propiedad (no hay endpoint `POST /maintenance-plans` independiente).

**GET /maintenance-plans/tasks** — Query params:

- `status` (PENDING | UPCOMING | OVERDUE | COMPLETED | all) — default: all
- `propertyId` (uuid) — filtra tareas por propiedad
- `take` (1-500, default: 200)
- CLIENT solo ve tareas de sus propiedades (filtro automatico)

**POST /maintenance-plans/:id/tasks**

```json
{
  "categoryId": "uuid",
  "name": "Verificar termicas y disyuntores",
  "description": "Opcional",
  "priority": "HIGH",
  "recurrenceType": "BIANNUAL",
  "recurrenceMonths": 6,
  "nextDueDate": "2026-06-01",
  "taskType": "INSPECTION",
  "professionalRequirement": "OWNER_CAN_DO",
  "technicalDescription": "Revisar que todas las termicas operen correctamente",
  "estimatedDurationMinutes": 15
}
```

**Nota:** En el frontend, al seleccionar una categoria vinculada a un CategoryTemplate (via FK `categoryTemplateId`), se muestra un selector de TaskTemplate que auto-completa todos los campos. El admin puede sobreescribir cualquier valor.

---

### Plantillas de Categorias (ADMIN only)

| Metodo | Ruta                                | Auth | Rol   | Descripcion          |
| ------ | ----------------------------------- | ---- | ----- | -------------------- |
| GET    | `/category-templates`               | Si   | ADMIN | Listar plantillas    |
| GET    | `/category-templates/:id`           | Si   | ADMIN | Detalle de plantilla |
| POST   | `/category-templates`               | Si   | ADMIN | Crear plantilla      |
| PATCH  | `/category-templates/:id`           | Si   | ADMIN | Actualizar plantilla |
| DELETE | `/category-templates/:id`           | Si   | ADMIN | Eliminar plantilla   |
| PATCH  | `/category-templates/reorder/batch` | Si   | ADMIN | Reordenar categorias |

**GET /category-templates** — Query params:

- `search` (string) — Busca por nombre
- `cursor`, `take`

**POST /category-templates**

```json
{
  "name": "Electricidad",
  "icon": "⚡",
  "description": "Instalaciones electricas",
  "displayOrder": 0
}
```

---

### Plantillas de Tareas (ADMIN only)

| Metodo | Ruta                                            | Auth | Rol   | Descripcion          |
| ------ | ----------------------------------------------- | ---- | ----- | -------------------- |
| POST   | `/category-templates/:categoryId/tasks`         | Si   | ADMIN | Crear tarea template |
| PATCH  | `/task-templates/:id`                           | Si   | ADMIN | Actualizar template  |
| DELETE | `/task-templates/:id`                           | Si   | ADMIN | Eliminar template    |
| PATCH  | `/category-templates/:categoryId/tasks/reorder` | Si   | ADMIN | Reordenar tareas     |

**POST /category-templates/:categoryId/tasks**

```json
{
  "name": "Verificar termicas y disyuntores",
  "taskType": "INSPECTION",
  "professionalRequirement": "OWNER_CAN_DO",
  "technicalDescription": "Revisar que todas las termicas operen correctamente",
  "priority": "HIGH",
  "recurrenceType": "BIANNUAL",
  "recurrenceMonths": 6,
  "estimatedDurationMinutes": 15,
  "displayOrder": 0
}
```

---

### Presupuestos

| Metodo | Ruta                   | Auth | Rol    | Descripcion                         |
| ------ | ---------------------- | ---- | ------ | ----------------------------------- |
| GET    | `/budgets`             | Si   | Ambos  | Listar presupuestos                 |
| GET    | `/budgets/:id`         | Si   | Ambos  | Detalle                             |
| POST   | `/budgets`             | Si   | CLIENT | Solicitar presupuesto               |
| POST   | `/budgets/:id/respond` | Si   | ADMIN  | Cotizar (agregar items + respuesta) |
| PATCH  | `/budgets/:id/status`  | Si   | Ambos  | Cambiar estado                      |

**GET /budgets** — Query params:

- `status` (PENDING | QUOTED | APPROVED | REJECTED | IN_PROGRESS | COMPLETED)
- `propertyId`, `cursor`, `take`
- CLIENT solo ve presupuestos de sus propiedades

**POST /budgets** (CLIENT)

```json
{
  "propertyId": "uuid",
  "title": "Reparacion de canerias",
  "description": "Descripcion opcional"
}
```

**POST /budgets/:id/respond** (ADMIN)

```json
{
  "lineItems": [
    { "description": "Mano de obra", "quantity": 1, "unitPrice": 50000 },
    { "description": "Materiales", "quantity": 3, "unitPrice": 15000 }
  ],
  "estimatedDays": 5,
  "notes": "Incluye garantia",
  "validUntil": "2026-03-15"
}
```

**Nota:** Los campos `quantity`, `unitPrice`, `subtotal` y `totalAmount` usan tipo `Decimal` (serializados como strings en JSON) para precision monetaria.

```json
// Ejemplo de respuesta con Decimal
{
  "quantity": "3",
  "unitPrice": "15000.00",
  "subtotal": "45000.00"
}
```

**PATCH /budgets/:id/status**

```json
{ "status": "APPROVED" }
```

---

### Solicitudes de Servicio

| Metodo | Ruta                                | Auth | Rol    | Descripcion             |
| ------ | ----------------------------------- | ---- | ------ | ----------------------- |
| GET    | `/service-requests`                 | Si   | Ambos  | Listar solicitudes      |
| GET    | `/service-requests/:id`             | Si   | Ambos  | Detalle                 |
| POST   | `/service-requests`                 | Si   | CLIENT | Crear solicitud         |
| PATCH  | `/service-requests/:id`             | Si   | CLIENT | Editar solicitud (OPEN) |
| PATCH  | `/service-requests/:id/status`      | Si   | ADMIN  | Cambiar estado          |
| GET    | `/service-requests/:id/audit-log`   | Si   | Ambos  | Historial de cambios    |
| GET    | `/service-requests/:id/comments`    | Si   | Ambos  | Listar comentarios      |
| POST   | `/service-requests/:id/comments`    | Si   | Ambos  | Agregar comentario      |
| POST   | `/service-requests/:id/attachments` | Si   | Ambos  | Agregar adjuntos        |

**GET /service-requests** — Query params:

- `status` (OPEN | IN_REVIEW | IN_PROGRESS | RESOLVED | CLOSED)
- `urgency` (LOW | MEDIUM | HIGH | URGENT)
- `propertyId`, `cursor`, `take`

**POST /service-requests** (CLIENT)

```json
{
  "propertyId": "uuid",
  "title": "Filtración en el techo",
  "description": "Se filtra agua cuando llueve en la esquina noroeste",
  "urgency": "HIGH",
  "taskId": "uuid-opcional-de-tarea-vinculada",
  "photoUrls": ["https://r2-url/foto1.jpg"]
}
```

**Nota:** `taskId` es opcional. Si se provee, se valida que la tarea pertenezca a la propiedad seleccionada (`propertyId`). Si la tarea se elimina posteriormente, el vínculo se pierde (SetNull).

**PATCH /service-requests/:id** (CLIENT — solo en estado OPEN)

```json
{ "title": "Título corregido", "description": "Descripción actualizada" }
```

**PATCH /service-requests/:id/status** (ADMIN)

```json
{ "status": "IN_REVIEW", "note": "Nota opcional del admin" }
```

**POST /service-requests/:id/comments**

```json
{ "content": "Texto del comentario (max 2000 chars)" }
```

**POST /service-requests/:id/attachments**

```json
{
  "attachments": [{ "url": "https://r2-url/presupuesto.pdf", "fileName": "presupuesto.pdf" }]
}
```

---

### Notificaciones

| Metodo | Ruta                          | Auth | Rol   | Descripcion                       |
| ------ | ----------------------------- | ---- | ----- | --------------------------------- |
| GET    | `/notifications`              | Si   | Ambos | Listar notificaciones del usuario |
| GET    | `/notifications/unread-count` | Si   | Ambos | Cantidad de no leidas             |
| PATCH  | `/notifications/:id/read`     | Si   | Ambos | Marcar como leida                 |
| PATCH  | `/notifications/read-all`     | Si   | Ambos | Marcar todas como leidas          |

---

### Upload

| Metodo | Ruta      | Auth | Rol   | Descripcion                           |
| ------ | --------- | ---- | ----- | ------------------------------------- |
| POST   | `/upload` | Si   | ADMIN | Subir archivo via multipart/form-data |

**POST /upload**

- Content-Type: `multipart/form-data`
- Campos:
  - `file` (binary) — archivo a subir
  - `folder` (string, enum: `uploads` | `properties` | `tasks` | `service-requests` | `budgets`) — carpeta destino en R2

**Validacion:**

- `folder` validado via Zod schema (`uploadBodySchema`) con `ZodValidationPipe`
- MIME whitelist + verificacion de magic bytes (`file-type`)
- Tamanio maximo: 10 MB

**Respuesta:**

```json
{ "data": { "url": "https://r2-public-url/folder/uuid-filename.jpg" } }
```

---

### Dashboard

| Metodo | Ruta                          | Auth | Rol    | Descripcion                 |
| ------ | ----------------------------- | ---- | ------ | --------------------------- |
| GET    | `/dashboard/stats`            | Si   | ADMIN  | Estadisticas admin          |
| GET    | `/dashboard/activity`         | Si   | ADMIN  | Actividad reciente          |
| GET    | `/dashboard/analytics`        | Si   | ADMIN  | Analytics admin (charts)    |
| GET    | `/dashboard/client-stats`     | Si   | CLIENT | Estadisticas del cliente    |
| GET    | `/dashboard/client-upcoming`  | Si   | CLIENT | Tareas proximas del cliente |
| GET    | `/dashboard/client-analytics` | Si   | CLIENT | Analytics cliente (charts)  |

**Respuesta stats (ADMIN):**

```json
{
  "totalClients": 15,
  "totalProperties": 23,
  "overdueTasks": 4,
  "pendingBudgets": 3,
  "pendingServices": 2
}
```

**Respuesta stats (CLIENT):**

```json
{
  "totalProperties": 2,
  "pendingTasks": 5,
  "overdueTasks": 1,
  "upcomingTasks": 3,
  "completedThisMonth": 2,
  "pendingBudgets": 1,
  "openServices": 0
}
```

**Respuesta analytics (ADMIN):**

```json
{
  "completionTrend": [{ "month": "2026-01", "label": "Ene", "value": 5 }],
  "conditionDistribution": [{ "condition": "GOOD", "count": 3, "label": "Bueno" }],
  "problematicCategories": [
    { "categoryName": "Electricidad", "issueCount": 2, "totalInspections": 10 }
  ],
  "budgetPipeline": [
    { "status": "PENDING", "count": 4, "label": "Pendiente", "totalAmount": 1000 }
  ],
  "categoryCosts": [{ "month": "2026-01", "label": "Ene", "categories": { "Electricidad": 500 } }],
  "avgBudgetResponseDays": 3.5,
  "totalMaintenanceCost": 15000,
  "completionRate": 72
}
```

**Respuesta analytics (CLIENT):**

```json
{
  "conditionTrend": [{ "month": "2026-01", "label": "Ene", "categories": { "Electricidad": 4.2 } }],
  "costHistory": [{ "month": "2026-01", "label": "Ene", "value": 300 }],
  "healthScore": 75,
  "healthLabel": "Bueno",
  "conditionDistribution": [{ "condition": "EXCELLENT", "count": 5, "label": "Excelente" }],
  "categoryBreakdown": [
    {
      "categoryName": "Plomeria",
      "totalTasks": 4,
      "completedTasks": 3,
      "overdueTasks": 0,
      "avgCondition": 4.5
    }
  ]
}
```

---

### Request Tracing

Todas las respuestas incluyen el header `x-request-id` para trazabilidad.

- Si el cliente envia `x-request-id` en el request, se propaga al response
- Si no se envia, el API genera un UUID automaticamente

---

## Codigos de Error

| Codigo | Significado           | Ejemplo                                                    |
| ------ | --------------------- | ---------------------------------------------------------- |
| 400    | Bad Request           | Validacion fallida                                         |
| 401    | Unauthorized          | Token invalido o expirado                                  |
| 403    | Forbidden             | Sin permiso (rol o propiedad ajena)                        |
| 404    | Not Found             | Recurso no encontrado                                      |
| 409    | Conflict              | Email ya registrado, version conflict (optimistic locking) |
| 429    | Too Many Requests     | Rate limit excedido                                        |
| 500    | Internal Server Error | Error no manejado (reportado a Sentry)                     |
