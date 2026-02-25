# Arquitectura del Proyecto

## Estructura del Monorepo

```
epde/
  apps/
    api/              # NestJS REST API
      src/
        auth/         # Autenticacion (JWT + Local strategy)
        budgets/      # Presupuestos (CRUD + ciclo de vida)
        categories/   # Categorias de mantenimiento
        clients/      # Gestion de clientes (ADMIN only)
        common/       # Guards, decorators, filters, repositories
        config/       # Validacion de env con Zod
        cron/         # Scheduler (task status cron)
        dashboard/    # Estadisticas agregadas
        email/        # Servicio de emails (Resend)
        maintenance-plans/  # Planes de mantenimiento
        notifications/      # Notificaciones in-app
        prisma/       # PrismaService con soft-delete extension
        properties/   # Propiedades
        service-requests/   # Solicitudes de servicio
        upload/       # Upload a Cloudflare R2
        users/        # Usuarios base
      prisma/
        schema.prisma
        seed.ts
    web/              # Next.js App Router
      src/
        app/
          (dashboard)/  # Layout autenticado con sidebar
          login/        # Login page
          set-password/ # Set password page
        components/
          data-table/   # DataTable reutilizable (TanStack Table)
          landing/      # Landing page publica
          layout/       # Header + Sidebar
          ui/           # shadcn/ui components
        hooks/          # React Query hooks por entidad
        lib/
          api/          # Axios client + funciones API por entidad
        providers/      # QueryProvider, AuthProvider
        stores/         # Zustand stores
  packages/
    shared/           # Tipos, schemas Zod, constantes, utilidades
      src/
        constants/    # Labels en espanol, defaults
        schemas/      # Zod schemas (validacion compartida)
        types/        # Interfaces TypeScript, enums
        utils/        # Helpers de fechas, UUID
```

## Patrones de Diseno

### 1. Repository Pattern (API)

Cada modulo tiene un repositorio que extiende `BaseRepository<T>`:

```typescript
// base.repository.ts
export class BaseRepository<T> {
  protected model; // Prisma model CON soft-delete filter (deletedAt: null)
  protected writeModel; // Prisma model SIN filtro (acceso completo)

  constructor(prisma: PrismaService, modelName: string, softDelete: boolean) {
    this.writeModel = prisma[modelName];
    this.model = softDelete ? prisma[modelName] : prisma[modelName]; // extension filtra
  }

  async findMany(params: FindManyParams): Promise<PaginatedResult<T>>;
  async findById(id: string, include?): Promise<T | null>;
  async create(data, include?): Promise<T>;
  async update(id: string, data, include?): Promise<T>;
  async delete(id: string): Promise<T>; // soft delete si habilitado
}
```

**Importante:**

- `this.model` filtra automaticamente `deletedAt: null` via Prisma extension
- `this.writeModel` accede a TODOS los registros (incluidos soft-deleted)
- Usar `writeModel` cuando se necesita buscar por email (ej: restaurar usuario eliminado)
- El flag `softDelete` en el constructor controla si el modelo usa la extension

**Paginacion cursor-based:**

```typescript
interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}
```

### 2. Soft Delete (Prisma Extension)

Configurado en `PrismaService` via extension:

- `findMany`, `findFirst`, `findUnique` agregan automaticamente `where: { deletedAt: null }`
- `delete` se convierte en `update({ deletedAt: new Date() })`
- Modelos con soft delete: `User`, `Property`, `Task`
- Para acceder a registros eliminados, usar `writeModel`

### 3. Module Pattern (NestJS)

Cada feature sigue la estructura:

```
feature/
  feature.module.ts       # Imports, providers, exports
  feature.controller.ts   # Endpoints REST
  feature.service.ts      # Logica de negocio
  feature.repository.ts   # Acceso a datos
  dto/                    # DTOs con class-validator
```

### 4. Guard Composition

Tres guards globales aplicados en orden via `APP_GUARD`:

1. **JwtAuthGuard** — Valida JWT en header `Authorization: Bearer <token>`. Salta endpoints marcados con `@Public()`
2. **RolesGuard** — Verifica que `user.role` este en los roles permitidos via `@Roles('ADMIN')`. Si no hay `@Roles()`, permite todo
3. **ThrottlerGuard** — Rate limiting global. Salta endpoints marcados con `@SkipThrottle()`

```typescript
// app.module.ts providers
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
{ provide: APP_GUARD, useClass: ThrottlerGuard },
```

**Rate limiting:**

- `short`: 10 requests/segundo
- `medium`: 60 requests/10 segundos
- Login y set-password: override a 5 requests/minuto via `@Throttle()`

### 5. Decorators Personalizados

| Decorator         | Ubicacion                                     | Descripcion             |
| ----------------- | --------------------------------------------- | ----------------------- |
| `@Public()`       | `common/decorators/public.decorator.ts`       | Salta JwtAuthGuard      |
| `@Roles('ADMIN')` | `common/decorators/roles.decorator.ts`        | Restringe por rol       |
| `@CurrentUser()`  | `common/decorators/current-user.decorator.ts` | Extrae user del request |

### 6. DTO Validation

- DTOs en API usan `class-validator` + `class-transformer`
- Schemas compartidos en `@epde/shared` usan Zod
- `ValidationPipe` global con `whitelist: true` y `transform: true`
- El frontend usa los Zod schemas directamente con `@hookform/resolvers/zod`

### 7. Event-Driven Communication

`EventEmitter2` para operaciones asincronas:

| Evento                  | Emisor                 | Listener              | Accion                        |
| ----------------------- | ---------------------- | --------------------- | ----------------------------- |
| `service.created`       | ServiceRequestsService | NotificationsListener | Notificacion + email al admin |
| `service.statusChanged` | ServiceRequestsService | NotificationsListener | Notificacion al cliente       |
| `budget.created`        | BudgetsService         | NotificationsListener | Notificacion + email al admin |
| `budget.statusChanged`  | BudgetsService         | NotificationsListener | Notificacion al cliente       |
| `client.invited`        | ClientsService         | (email directo)       | Email de invitacion           |

### 8. Error Handling

`GlobalExceptionFilter` centralizado:

- `HttpException` → responde con status y mensaje del error
- Otros errores → `500 Internal Server Error` + `Sentry.captureException()`
- Formato de respuesta de error:

```json
{
  "statusCode": 400,
  "message": "Mensaje descriptivo",
  "error": "Bad Request"
}
```

### 9. Auth Flow

```
Login → LocalStrategy (email+password) → JWT access + refresh tokens
                                        ↓
                              access: cookie HttpOnly (15m)
                              refresh: cookie HttpOnly (7d)
                                        ↓
                              Request → JwtStrategy (cookie) → user en request
                                        ↓
                              Token expirado → /auth/refresh → nuevo access token
```

- Passwords hasheados con bcrypt (12 rounds)
- Nuevos clientes reciben link `/set-password?token=<jwt>` por email
- `set-password` valida token JWT y setea password

### 10. File Upload Pattern

```
Frontend → POST /upload/presigned-url { filename, contentType }
         ← { url, key }  (presigned URL de Cloudflare R2)
         → PUT url (upload directo a R2 desde browser)
         → Usar key/URL en el form data del recurso
```

### 11. Cron Jobs (Scheduler)

`SchedulerModule` con `@Cron()`:

- Actualiza `status` de tasks: `PENDING` → `UPCOMING` (30 dias antes) → `OVERDUE` (pasada fecha)
- Ejecuta diariamente

### 12. Frontend State Management

**Zustand (auth-store):**

- `user`, `isAuthenticated`, `isLoading`
- `login()`, `logout()`, `refreshToken()`, `fetchUser()`
- Persistencia via cookies HttpOnly (no localStorage)

**TanStack React Query (server state):**

- Cada entidad tiene hooks en `/hooks/use-<entity>.ts`
- Pattern: `useQuery` para lectura, `useMutation` para escritura
- `queryKey` convention: `['entity', ...params]`
- Invalidacion automatica en `onSuccess` de mutations
- Paginacion cursor-based con `hasMore` + "Cargar mas"

### 13. API Client (Axios)

```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // cookies
});

// Interceptor de refresh
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      await refreshToken();
      return apiClient(originalRequest);
    }
  },
);
```

### 14. Middleware (Next.js)

```typescript
// middleware.ts
const publicPaths = ['/login', '/set-password', '/'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  if (!token && !isPublicPath) redirect('/login');
  if (token && isAuthPage) redirect('/dashboard');
}
```
