# API Reference

Base URL: `http://localhost:3001/api/v1`
Swagger UI: `http://localhost:3001/api/docs`

## Autenticacion

Todas las rutas requieren autenticacion JWT excepto las marcadas con `@Public()`.

### Tokens

- **Access token**: cookie HttpOnly `access_token`, expira en 15 minutos
- **Refresh token**: cookie HttpOnly `refresh_token`, expira en 7 dias
- Ambos se envian automaticamente con `withCredentials: true`
- El frontend intercepta 401 y refresca automaticamente

### Flow

1. `POST /auth/login` → setea cookies
2. Requests posteriores envian cookies automaticamente
3. Al expirar access token → `POST /auth/refresh` con refresh cookie
4. `POST /auth/logout` → limpia cookies

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

| Metodo | Ruta | Auth | Descripcion  |
| ------ | ---- | ---- | ------------ |
| GET    | `/`  | No   | Health check |

---

### Auth

| Metodo | Ruta                 | Auth | Rol | Descripcion                      |
| ------ | -------------------- | ---- | --- | -------------------------------- |
| POST   | `/auth/login`        | No   | —   | Login con email y password       |
| POST   | `/auth/refresh`      | No   | —   | Refrescar access token           |
| POST   | `/auth/logout`       | Si   | —   | Cerrar sesion                    |
| GET    | `/auth/me`           | Si   | —   | Obtener usuario actual           |
| POST   | `/auth/set-password` | No   | —   | Configurar password (invitacion) |

**POST /auth/login**

```json
{ "email": "admin@epde.com", "password": "Admin123!" }
```

**POST /auth/set-password**

```json
{ "token": "jwt-token-from-email", "newPassword": "MyPassword1" }
```

Rate limit: 5 requests/minuto en login y set-password.

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

| Metodo | Ruta              | Auth | Rol   | Descripcion        |
| ------ | ----------------- | ---- | ----- | ------------------ |
| GET    | `/properties`     | Si   | Ambos | Listar propiedades |
| GET    | `/properties/:id` | Si   | Ambos | Detalle            |
| POST   | `/properties`     | Si   | ADMIN | Crear propiedad    |
| PATCH  | `/properties/:id` | Si   | ADMIN | Actualizar         |
| DELETE | `/properties/:id` | Si   | ADMIN | Eliminar (soft)    |

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

---

### Categorias

| Metodo | Ruta              | Auth | Rol   | Descripcion       |
| ------ | ----------------- | ---- | ----- | ----------------- |
| GET    | `/categories`     | Si   | Ambos | Listar categorias |
| POST   | `/categories`     | Si   | ADMIN | Crear categoria   |
| PATCH  | `/categories/:id` | Si   | ADMIN | Actualizar        |
| DELETE | `/categories/:id` | Si   | ADMIN | Eliminar          |

---

### Planes de Mantenimiento

| Metodo | Ruta                                                | Auth | Rol   | Descripcion               |
| ------ | --------------------------------------------------- | ---- | ----- | ------------------------- |
| GET    | `/maintenance-plans/:propertyId`                    | Si   | Ambos | Obtener plan de propiedad |
| POST   | `/maintenance-plans`                                | Si   | ADMIN | Crear plan                |
| PATCH  | `/maintenance-plans/:id`                            | Si   | ADMIN | Actualizar plan           |
| POST   | `/maintenance-plans/:id/tasks`                      | Si   | ADMIN | Crear tarea               |
| PATCH  | `/maintenance-plans/:planId/tasks/:taskId`          | Si   | ADMIN | Actualizar tarea          |
| DELETE | `/maintenance-plans/:planId/tasks/:taskId`          | Si   | ADMIN | Eliminar tarea            |
| POST   | `/maintenance-plans/:planId/tasks/:taskId/complete` | Si   | Ambos | Completar tarea           |
| POST   | `/maintenance-plans/:planId/tasks/:taskId/notes`    | Si   | Ambos | Agregar nota              |
| PATCH  | `/maintenance-plans/:planId/tasks/reorder`          | Si   | ADMIN | Reordenar tareas          |

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

**PATCH /budgets/:id/status**

```json
{ "status": "APPROVED" }
```

---

### Solicitudes de Servicio

| Metodo | Ruta                           | Auth | Rol    | Descripcion        |
| ------ | ------------------------------ | ---- | ------ | ------------------ |
| GET    | `/service-requests`            | Si   | Ambos  | Listar solicitudes |
| GET    | `/service-requests/:id`        | Si   | Ambos  | Detalle            |
| POST   | `/service-requests`            | Si   | CLIENT | Crear solicitud    |
| PATCH  | `/service-requests/:id/status` | Si   | ADMIN  | Cambiar estado     |

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
  "photoUrls": ["https://r2-url/foto1.jpg"]
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

| Metodo | Ruta                    | Auth | Rol   | Descripcion                            |
| ------ | ----------------------- | ---- | ----- | -------------------------------------- |
| POST   | `/upload/presigned-url` | Si   | Ambos | Obtener URL presignada para subir a R2 |

**POST /upload/presigned-url**

```json
{ "filename": "foto.jpg", "contentType": "image/jpeg" }
```

**Respuesta:**

```json
{ "url": "https://r2-presigned-url...", "key": "uploads/uuid-foto.jpg" }
```

Flujo: obtener URL → PUT al presigned URL desde el browser → usar la key/URL en el recurso.

---

### Dashboard

| Metodo | Ruta                         | Auth | Rol   | Descripcion            |
| ------ | ---------------------------- | ---- | ----- | ---------------------- |
| GET    | `/dashboard/stats`           | Si   | Ambos | Estadisticas segun rol |
| GET    | `/dashboard/upcoming-tasks`  | Si   | Ambos | Tareas proximas        |
| GET    | `/dashboard/recent-activity` | Si   | ADMIN | Actividad reciente     |

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

---

## Codigos de Error

| Codigo | Significado           | Ejemplo                                |
| ------ | --------------------- | -------------------------------------- |
| 400    | Bad Request           | Validacion fallida                     |
| 401    | Unauthorized          | Token invalido o expirado              |
| 403    | Forbidden             | Sin permiso (rol o propiedad ajena)    |
| 404    | Not Found             | Recurso no encontrado                  |
| 409    | Conflict              | Email ya registrado                    |
| 429    | Too Many Requests     | Rate limit excedido                    |
| 500    | Internal Server Error | Error no manejado (reportado a Sentry) |
