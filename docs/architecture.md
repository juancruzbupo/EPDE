# Arquitectura del Proyecto

## Estructura del Monorepo

```
epde/
  apps/
    api/              # NestJS REST API
      src/
        auth/         # Autenticacion (JWT + Local strategy + Token Rotation)
        budgets/      # Presupuestos (CRUD + ciclo de vida, Decimal)
        categories/   # Categorias de mantenimiento
        clients/      # Gestion de clientes (ADMIN only)
        common/       # Guards, decorators, filters, repositories
        config/       # Validacion de env con Zod
        cron/         # Scheduler (task status cron + distributed lock)
        dashboard/    # Estadisticas agregadas
        email/        # Servicio de emails (Resend)
        maintenance-plans/  # Planes de mantenimiento
        notifications/      # Notificaciones in-app
        prisma/       # PrismaService con soft-delete extension
        redis/        # RedisModule (global) + DistributedLockService
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
    mobile/           # Expo React Native (rol CLIENT)
      src/
        app/
          (auth)/       # Login, set-password
          (tabs)/       # Tab navigation (5 tabs)
          property/     # Detalle de propiedad [id]
          budget/       # Detalle de presupuesto [id]
          service-requests/ # Lista y detalle
          task/         # Detalle de tarea [planId]/[taskId]
        components/     # StatusBadge, EmptyState, StatCard, Modals
        hooks/          # React Query hooks (infinite scroll)
        lib/
          api/          # Funciones API por entidad
          api-client.ts # Axios con token refresh
          token-service.ts # Expo SecureStore
        stores/         # Zustand auth store
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

- `findMany`, `findFirst`, `findUnique`, `count` agregan automaticamente `where: { deletedAt: null }`
- `delete` se convierte en `update({ deletedAt: new Date() })`
- La condicion usa `!('deletedAt' in (args.where || {}))` para chequear **presencia de clave**, no valor
- Modelos con soft delete: `User`, `Property`, `Task`
- Para acceder a registros eliminados, usar `writeModel`

### 3. Module Pattern (NestJS)

Cada feature sigue la estructura:

```
feature/
  feature.module.ts       # Imports, providers, exports
  feature.controller.ts   # Endpoints REST
  feature.service.ts      # Logica de negocio (NO inyecta PrismaService)
  feature.repository.ts   # Acceso a datos (unico que inyecta PrismaService)
  feature.service.spec.ts # Unit tests con mocks de repositorios
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

### 6. Zod Validation (Single Source of Truth)

- Schemas Zod definidos en `@epde/shared/schemas` — unico SSoT para frontend y backend
- El backend valida via `ZodValidationPipe` en `common/pipes/zod-validation.pipe.ts`
- Controllers aplican `@UsePipes(new ZodValidationPipe(schema))` por endpoint
- El frontend usa los mismos schemas con `@hookform/resolvers/zod`
- **No se usa class-validator ni class-transformer** — eliminados en la remediacion

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
- `HttpException` con status >= 500 → tambien se reporta a Sentry
- Formato de respuesta de error:

```json
{
  "statusCode": 400,
  "message": "Mensaje descriptivo",
  "error": "Bad Request"
}
```

### 9. Auth Flow (Token Rotation)

```
Login → LocalStrategy (email+password) → JWT access + refresh tokens
                                        ↓
                              access: cookie HttpOnly (15m) — contiene jti
                              refresh: cookie HttpOnly (7d) — contiene family + generation
                                        ↓
                              Request → JwtStrategy (cookie) → verifica blacklist → user en request
                                        ↓
                              Token expirado → /auth/refresh → rota refresh token (nueva generation)
                                        ↓
                              Logout → blacklist access jti + revocar family en Redis
```

**Token Rotation (Redis-backed):**

- Cada login crea una "family" UUID. Refresh tokens llevan `{ sub, email, role, family, generation, jti }`
- Redis almacena `rt:{family}` con generation actual (TTL 7d)
- Al hacer refresh: si generation no coincide → **token reuse attack** → revocar toda la family
- La rotacion usa un **Lua script atomico** en Redis para prevenir race conditions (GET + compare + SET en una sola operacion)
- Logout: blacklist access token JTI (TTL = tiempo restante) + revocar family
- `JwtStrategy.validate()` verifica que el JTI no este en blacklist antes de autenticar
- Implementado en `auth/token.service.ts` (genera pares, rota, revoca, blacklist)

**Otros:**

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

### 11. Cron Jobs (Scheduler + Distributed Lock)

`SchedulerModule` con `@Cron()` — tres jobs diarios a las 09:00-09:10 UTC:

1. **task-status-recalculation** (09:00 UTC): PENDING → UPCOMING (30 dias) → OVERDUE (pasada fecha), y reset UPCOMING → PENDING si se alejo
2. **task-upcoming-reminders** (09:05 UTC): Notificaciones in-app + email para tareas en 7 dias y vencidas. Deduplicacion por dia. Overdue tambien notifica admins
3. **task-safety-sweep** (09:10 UTC): Fix para tareas COMPLETED con nextDueDate vencida que no se avanzaron (edge case crash)

**Distributed Lock:** Cada cron job esta envuelto en `DistributedLockService.withLock()` (Redis SETNX, TTL 5min) para prevenir ejecucion concurrente en deployments multi-instancia. Key pattern: `lock:cron:<job-name>`.

Dependencias: `TasksRepository`, `NotificationsRepository`, `UsersRepository`, `DistributedLockService`

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

**Web (singleton refresh):** El interceptor usa un patron singleton para deduplicar refreshes concurrentes (mismo patron que mobile).

### 14. Middleware (Next.js)

```typescript
// middleware.ts
const publicPaths = ['/login', '/set-password', '/'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  // Si no hay token y no es ruta publica → redirect login
  if (!token && !isPublicPath) redirect('/login');
  // Si hay token, decodifica JWT y verifica exp (con 30s buffer)
  // Si JWT esta expirado (exp - 30s < now) → redirect login
  if (token && isExpired(token, 30)) redirect('/login');
  if (token && isAuthPage) redirect('/dashboard');
}
```

### 15. Redis Infrastructure

Modulo global `RedisModule` (`redis/redis.module.ts`) con dos servicios:

- **RedisService**: Wrapper sobre `ioredis` con metodos `get`, `set`, `del`, `setnx`, `expire`, `eval(script, keys, args)` (ejecuta Lua scripts atomicos), `isHealthy()` (PING/PONG check)
- **DistributedLockService**: Distributed lock via Redis SETNX con TTL. Metodo `withLock<T>(key, ttlSeconds, fn)` que adquiere lock, ejecuta fn, y libera lock. Usa ownership pattern (genera UUID owner, Lua script para release solo si es owned)

**Casos de uso:**

- Token rotation: almacena familias de refresh tokens (`rt:{family}`) con TTL 7d
- Token blacklist: almacena JTIs de access tokens revocados (`bl:{jti}`) con TTL restante
- Distributed lock: previene ejecucion concurrente de cron jobs (`lock:cron:{name}`)

**Configuracion:** `REDIS_URL` en `.env` (default: `redis://localhost:6379`). Redis 7 Alpine en Docker Compose.

### 16. Observabilidad (OpenTelemetry + Pino)

**Metricas (Prometheus):**

- `MetricsModule` (global) con `MetricsService` + `MetricsInterceptor`
- Exporta metricas en formato Prometheus en puerto 9464
- Metricas: `http_requests_total`, `http_request_duration_seconds`, `token_rotation_total`, `cron_execution_duration_seconds`

**Logging (Pino):**

- `nestjs-pino` con `pino-http` para logging estructurado JSON
- Request ID automatico (header `x-request-id` o `randomUUID()`)
- `pino-pretty` en desarrollo
- Endpoint `/api/v1/health` excluido del auto-logging

### 17. Health Check

- `GET /api/v1/health` con `@Public()` (no requiere auth)
- Usa `@nestjs/terminus` con indicadores de DB (Prisma) y Redis (custom)
- Respuesta: `{ status: "ok", info: { database: { status: "up" }, redis: { status: "up" } } }`
