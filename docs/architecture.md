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
          __tests__/    # Tests (vitest + jsdom + @testing-library/react)
        hooks/          # React Query hooks por entidad
          __tests__/    # Tests de hooks
        lib/
          api/          # Axios client + funciones API por entidad
        providers/      # QueryProvider, AuthProvider
        stores/         # Zustand stores
      vitest.config.ts  # Vitest + jsdom config
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
          __tests__/    # Tests (jest-expo + @testing-library/react-native)
        hooks/          # React Query hooks (infinite scroll)
        lib/
          api/          # Funciones API por entidad
          api-client.ts # Axios con token refresh
          token-service.ts # Expo SecureStore
        stores/         # Zustand auth store
      jest.config.js    # Jest + jest-expo config
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
  async findById(id: string, include?): Promise<T | null>; // usa findUnique (PK index)
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

**Limites:** `take` se clampea entre 1 y `MAX_PAGE_SIZE` (100) para prevenir queries sin limite.

### 2. Soft Delete (Prisma Extension)

Configurado en `PrismaService` via extension:

- `findMany`, `findFirst`, `findUnique`, `count`, `aggregate`, `groupBy` agregan automaticamente `where: { deletedAt: null }`
- `delete` se convierte en `update({ deletedAt: new Date() })`
- La condicion usa `hasDeletedAtKey(where)` que inspecciona recursivamente el nivel raiz y operadores logicos (`AND`, `OR`, `NOT`) para detectar si `deletedAt` ya esta presente
- `updateMany` no esta cubierto por la extension — requiere `deletedAt: null` explicito
- Dentro de `$transaction` callbacks, la extension no aplica — usar filtro manual
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
- Refresh: override a 30 requests/minuto via `@Throttle()`

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

**Error Boundaries:** Cada handler en `NotificationsListener` esta envuelto en `try-catch` para evitar que errores de DB/email propaguen y crash-een el event loop. Los errores se loguean con stack trace completo.

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
- La rotacion tiene **try-catch** alrededor del `eval()` de Redis — si Redis falla, retorna `InternalServerErrorException` en vez de crash sin contexto
- Logout: blacklist access token JTI (TTL = tiempo restante) + revocar family + `queryClient.clear()` en frontend
- `JwtStrategy.validate()` verifica que el JTI no este en blacklist antes de autenticar
- Implementado en `auth/token.service.ts` (genera pares, rota, revoca, blacklist)
- Cookies: `SameSite=strict`, `HttpOnly`, `Secure` (en produccion) — elimina necesidad de tokens CSRF

**Auth Audit Logging:**

- `AuthAuditService` registra eventos de auth en formato JSON estructurado (pino)
- Eventos: `login` (userId, email, clientType, ip), `logout` (userId, jti), `login_failed` (email, reason, ip), `password_set` (userId), `token_reuse_attack` (family, userId)
- Inyectado en `AuthService` y `TokenService`

**Otros:**

- Passwords hasheados con bcrypt (12 rounds)
- Nuevos clientes reciben link `/set-password?token=<jwt>` por email
- `set-password` valida token JWT y setea password

### 10. File Upload Pattern

```
Frontend → POST /upload (multipart/form-data)
         ← { url }  (URL publica del archivo en R2)
         → Usar URL en el form data del recurso
```

**Seguridad del upload:**

- **MIME type whitelist:** Solo `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`
- **Magic bytes validation:** `file-type` verifica contenido real del archivo (no solo header Content-Type)
- **Content-Disposition:** `attachment` en R2 para forzar descarga en vez de render inline
- **Tamano maximo:** 10 MB
- **Folders permitidos:** `uploads`, `properties`, `tasks`, `service-requests`, `budgets` (whitelist, no input directo del cliente)

### 11. Cron Jobs (Scheduler + Distributed Lock)

`SchedulerModule` con `@Cron()` — tres jobs diarios a las 09:00-09:10 UTC:

1. **task-status-recalculation** (09:00 UTC): PENDING → UPCOMING (30 dias) → OVERDUE (pasada fecha), y reset UPCOMING → PENDING si se alejo
2. **task-upcoming-reminders** (09:05 UTC): Notificaciones in-app + email para tareas en 7 dias y vencidas. Deduplicacion por dia. Overdue tambien notifica admins
3. **task-safety-sweep** (09:10 UTC): Fix para tareas COMPLETED con nextDueDate vencida que no se avanzaron (edge case crash)

**Distributed Lock:** Cada cron job esta envuelto en `DistributedLockService.withLock()` (Redis SETNX, TTL 5min) para prevenir ejecucion concurrente en deployments multi-instancia. Key pattern: `lock:cron:<job-name>`.

**Watchdog + lockLost signal:** El lock se extiende automaticamente cada mitad del TTL mientras la operacion siga en curso. El callback recibe un objeto `signal: { lockLost: boolean }`. Si el lock se pierde (extension falla o error de Redis), `signal.lockLost` se setea a `true` y el lock no se libera en el `finally`. Los cron jobs verifican `signal.lockLost` antes de operaciones costosas y abortan si el lock se perdio.

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
- Invalidacion especifica en `onSuccess` de mutations (sub-keys de dashboard: `['dashboard', 'stats']`, `['dashboard', 'activity']`, etc. en vez de invalidar todo `['dashboard']`)
- `queryClient` singleton exportable (`lib/query-client.ts`) — usado tanto por el QueryProvider como por el auth store (para `queryClient.clear()` en logout)
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
- **DistributedLockService**: Distributed lock via Redis SETNX con TTL. Metodo `withLock<T>(key, ttlSeconds, fn)` que adquiere lock, ejecuta fn, y libera lock. Usa ownership pattern (genera UUID owner, Lua script para release solo si es owned). Incluye **watchdog** que extiende TTL automaticamente y metodo `extendLock()` con Lua script atomico

**Casos de uso:**

- Token rotation: almacena familias de refresh tokens (`rt:{family}`) con TTL 7d
- Token blacklist: almacena JTIs de access tokens revocados (`bl:{jti}`) con TTL restante
- Distributed lock: previene ejecucion concurrente de cron jobs (`lock:cron:{name}`)

**Configuracion:** `REDIS_URL` en `.env` (default: `redis://localhost:6379`). Redis 7 Alpine en Docker Compose con `volatile-lru` eviction policy (solo evicta keys con TTL — protege keys de auth sin TTL explícito).

### 16. Observabilidad (OpenTelemetry + Pino)

**Metricas (Prometheus):**

- `MetricsModule` (global) con `MetricsService` + `MetricsInterceptor`
- Exporta metricas en formato Prometheus en puerto 9464
- Metricas: `http_requests_total`, `http_request_duration_seconds`, `token_rotation_total`, `cron_execution_duration_seconds`

**Tracing (OpenTelemetry):**

- `@opentelemetry/sdk-node` con auto-instrumentations (HTTP, NestJS)
- Exporta traces via OTLP HTTP a endpoint configurable (`OTEL_EXPORTER_OTLP_ENDPOINT`)
- Solo se activa si la env var esta seteada — en desarrollo no corre
- Configurado en `instrument.ts` (carga antes de Sentry)

**Logging (Pino):**

- `nestjs-pino` con `pino-http` para logging estructurado JSON
- Request ID propagado: middleware inyecta/propaga `x-request-id` en request y response headers
- `pino-pretty` en desarrollo
- Endpoint `/api/v1/health` excluido del auto-logging
- Auth audit logging via `AuthAuditService` (eventos de login, logout, failed login, token reuse)

**Security Headers (Helmet):**

- Content Security Policy explicito: `defaultSrc: 'self'`, `imgSrc: 'self' + R2`, `frameSrc: 'none'`, `objectSrc: 'none'`
- `crossOriginResourcePolicy: 'cross-origin'` para permitir carga de archivos R2

### 17. Health Check

- `GET /api/v1/health` con `@Public()` (no requiere auth)
- Usa `@nestjs/terminus` con indicadores de DB (Prisma) y Redis (custom)
- Respuesta: `{ status: "ok", info: { database: { status: "up" }, redis: { status: "up" } } }`

### 18. Decision Record: EventEmitter2 vs BullMQ

**Estado actual:** EventEmitter2 in-memory para eventos asincrónicos (notificaciones, emails).

**Por qué se usa EventEmitter2:**

- Simplicidad operacional: no requiere infraestructura adicional ni workers separados
- Volumen actual bajo: < 100 eventos/día (notificaciones + emails)
- Handlers con try-catch: errores no propagan al event loop
- Latencia mínima: procesamiento in-memory sin overhead de serialización/deserialización

**Riesgos aceptados:**

- Si el proceso crashea, eventos in-flight se pierden. Los eventos actuales son notificaciones y emails — no transacciones financieras. La pérdida es tolerable (el usuario puede ver el estado actual en la UI)
- Sin retry automático: si un email falla, no se reintenta. Los cron jobs diarios de recordatorio actúan como mecanismo de compensación

**Cuándo migrar a BullMQ:**

- > 5K usuarios concurrentes o > 1K eventos/hora
- Eventos que requieren garantía de entrega (ej: facturación, pagos)
- Necesidad de dead-letter queues para auditoría
- Procesamiento que exceda 30s (ej: generación de reportes PDF)

**Patrón de migración sugerido:**

1. Agregar BullMQ como dependencia, configurar conexión Redis (puede reusar la instancia existente)
2. Crear processors (workers) por tipo de evento
3. Reemplazar `eventEmitter.emit()` → `queue.add()` en los servicios emisores
4. Mantener `NotificationsListener` como consumer de la queue en vez de `@OnEvent()`
5. Configurar retry policy (3 intentos, backoff exponencial) y dead-letter queue
