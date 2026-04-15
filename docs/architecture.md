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
        category-templates/   # Plantillas de categorias (CRUD)
        clients/      # Gestion de clientes (ADMIN only)
        common/       # Guards, decorators, filters, repositories
        config/       # Validacion de env con Zod
        core/         # CoreModule (@Global) — agrupa infra: Sentry, Config, Throttler, Logger, BullMQ, Prisma, Redis, Health, Metrics
        scheduler/    # Scheduler (task status cron + distributed lock)
        dashboard/    # Estadisticas agregadas
        email/        # Servicio de emails (Resend)
        maintenance-plans/  # Planes de mantenimiento
        notifications/      # Notificaciones in-app
        prisma/       # PrismaService con soft-delete extension
        redis/        # RedisModule (global) + DistributedLockService
        properties/   # Propiedades
        service-requests/   # Solicitudes de servicio
        task-templates/     # Plantillas de tareas (CRUD)
        upload/       # Upload a Cloudflare R2
        users/        # Usuarios base
        health/       # Health check (Terminus)
        inspections/  # InspectionChecklistRepository + InspectionItemRepository (ambos extienden BaseRepository)
        metrics/      # MetricsModule + MetricsInterceptor + PrometheusExporter
      prisma/
        schema.prisma
        seed.ts
        seed-demo.ts  # Datos demo (3 usuarios con propiedades, tareas, historial)
    web/              # Next.js App Router
      src/
        app/
          (dashboard)/  # Layout autenticado con sidebar
            templates/  # Pagina admin de plantillas (CategoryTemplate + TaskTemplate)
          (auth)/         # Route group con layout compartido
            login/        # Login page
            set-password/ # Set password page
        components/
          data-table/   # DataTable reutilizable (TanStack Table)
          landing/      # Landing page publica
          layout/       # Header + Sidebar
          ui/           # shadcn/ui components + AnimatedNumber
          health-card.tsx # Salud del mantenimiento (Framer Motion)
          __tests__/    # Tests (vitest + jsdom + @testing-library/react)
        hooks/          # React Query hooks por entidad
          __tests__/    # Tests de hooks
        lib/
          api/          # Axios client + funciones API por entidad
          motion.ts     # Sistema de animacion Framer Motion (duraciones, hooks)
        providers/      # QueryProvider, AuthProvider
        stores/         # Zustand stores
      vitest.config.ts  # Vitest + jsdom config
    mobile/           # Expo React Native (CLIENT + ADMIN MVP)
      src/
        app/
          (auth)/       # Login, set-password
          (tabs)/       # Tab navigation (5 visible: Inicio, Propiedades, Tareas, Notificaciones, Perfil; Servicios/Presupuestos via dashboard cards)
          property/     # Detalle de propiedad [id]
          budget/       # Detalle de presupuesto [id]
          service-requests/ # Lista y detalle
          task/         # Detalle de tarea [planId]/[taskId]
        components/     # StatusBadge, EmptyState, StatCard, HealthCard, Modals
          __tests__/    # Tests (jest-expo + @testing-library/react-native)
          animated-list-item.tsx  # Item con animacion fade+slide + haptics
          animated-number.tsx     # Numero animado (conteo)
          collapsible-section.tsx # Seccion expandible con chevron
          health-card.tsx         # Salud del mantenimiento (barra + %)
          swipeable-row.tsx       # Fila deslizable con acciones (gestos)
          error-state.tsx         # Estado de error con retry
        hooks/          # React Query hooks (infinite scroll)
        lib/
          api/          # Funciones API por entidad
          api-client.ts # Axios con token refresh
          token-service.ts # Expo SecureStore
          fonts.ts      # TYPE scale tipografica
          haptics.ts    # Wrapper expo-haptics
          animations.ts # Presets reanimated (TIMING, SPRING, hooks)
          colors.ts     # Design tokens JS (para APIs no-NativeWind)
          screen-options.ts # Navigation header/tab defaults
        stores/         # Zustand auth store
      jest.config.js    # Jest + jest-expo config
  packages/
    shared/           # Tipos, schemas Zod, constantes, utilidades
      src/
        api/          # Tipos de API (respuestas paginadas, etc.)
        constants/    # Modularizado: enum-labels, app-config, query-keys, design-tokens, badge-variants, engagement, etc.
        schemas/      # Zod schemas (validacion compartida)
        seed/         # Template seed data (nomenclador de tareas)
        types/        # Interfaces TypeScript + enums (types/enums.ts)
        utils/        # Helpers de fechas, UUID, getErrorMessage
```

## Patrones de Diseno

### 1. Repository Pattern (API)

Cada modulo tiene un repositorio que extiende `BaseRepository<T, M>`:

```typescript
// base.repository.ts
type PrismaModelName = /* union de nombres de modelo validos extraidos de PrismaClient */;

export class BaseRepository<T, M extends PrismaModelName = PrismaModelName> {
  protected model; // Prisma model CON soft-delete filter (deletedAt: null)
  protected writeModel; // Prisma model SIN filtro (acceso completo)

  constructor(prisma: PrismaService, modelName: M, hasSoftDelete: boolean) {
    this.writeModel = prisma[modelName];
    this.model = hasSoftDelete ? prisma[modelName] : prisma[modelName]; // extension filtra
  }

  async findMany(params: FindManyParams): Promise<PaginatedResult<T>>;
  async findById(id: string, include?): Promise<T | null>; // usa findUnique (PK index)
  async findByIdSelect<TResult>(id: string, select: Record<string, boolean>): Promise<TResult | null>; // para ownership checks tipados
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
- `findByIdSelect<TResult>(id, select)`: alternativa tipada a `findById` cuando solo se necesitan campos especificos (ownership checks, proyecciones). Evita el cast `as any`. Ejemplo: `await repo.findByIdSelect<{ userId: string }>(id, { userId: true })`

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
- Dentro de `$transaction` callbacks, la extension no aplica — usar filtro manual (enforzado por la ESLint rule `local/no-tx-without-soft-delete-filter`, ver SIEMPRE #96)
- Modelos con soft delete (8): `User`, `Property`, `Task`, `Category`, `BudgetRequest`, `ServiceRequest`, `InspectionChecklist`, `InspectionItem`. `MaintenancePlan` NO tiene `deletedAt` — su lifecycle es `PlanStatus` (`DRAFT | ACTIVE | ARCHIVED`)
- Para nested includes de modelos soft-deletables, usar `ACTIVE_FILTER` de `apps/api/src/prisma/soft-delete-include.ts` con spread (ver SIEMPRE #93)
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

#### Excepciones al Module Pattern

| Modulo      | Excepcion                    | Justificacion                                                                                                                                                                                                                                    |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`     | Sin controller               | Modulo internal-only. Consumido por `auth` y `clients`. No expone endpoints REST propios.                                                                                                                                                        |
| `upload`    | Sin repository               | Infraestructura (S3/R2), no domain entity. Service accede directamente a S3Client.                                                                                                                                                               |
| `scheduler` | Sin controller ni repository | Cron jobs puros. Consume services de otros modulos via DI.                                                                                                                                                                                       |
| `dashboard` | 4 repos especializados       | Agregacion cross-entity. Split en `DashboardStatsRepository` (admin/client stats), `HealthIndexRepository` (ISV, streak), `AnalyticsRepository` (trends, costs, SLA). `DashboardRepository` es facade. `ISVSnapshotRepository` maneja snapshots. |
| `email`     | Sin controller ni repository | Servicio transversal. Envia emails via Resend SDK. Consumido por queues.                                                                                                                                                                         |
| `redis`     | Sin controller               | Infraestructura global. Provee RedisService y DistributedLockService.                                                                                                                                                                            |
| `health`    | Sin service ni repository    | Infraestructura. Controller directo con @nestjs/terminus checks.                                                                                                                                                                                 |
| `metrics`   | Sin controller ni repository | Infraestructura. Interceptor + service para OpenTelemetry.                                                                                                                                                                                       |

### 4. Guard Composition

Cuatro guards globales aplicados en orden via `APP_GUARD`:

1. **ThrottlerGuard** — Rate limiting global. Salta endpoints marcados con `@SkipThrottle()`
2. **JwtAuthGuard** — Valida JWT en cookie `access_token`. Salta endpoints marcados con `@Public()`
3. **RolesGuard** — Primero verifica `@Public()` (permite sin auth). Luego verifica que `user.role` este en los roles permitidos via `@Roles(UserRole.ADMIN)`. **Deny by default:** si no hay `@Roles()` ni `@Public()`, retorna `false` (403). Todo endpoint autenticado DEBE tener `@Roles()` explicito
4. **SubscriptionGuard** — Verifica que el cliente tenga suscripcion activa (`subscriptionExpiresAt > now`). Salta `@Public()`, endpoints de auth, y usuarios ADMIN. Retorna HTTP 402 (Payment Required) si la suscripcion expiro. El frontend intercepta 402 y redirige a pagina de suscripcion expirada

```typescript
// app.module.ts providers
{ provide: APP_GUARD, useClass: ThrottlerGuard },
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
{ provide: APP_GUARD, useClass: SubscriptionGuard },
```

**Rate limiting:**

- `short`: 5 requests/segundo
- `medium`: 30 requests/10 segundos
- Login: override a 5 requests/minuto via `@Throttle()`
- Set-password: override a 3 requests/hora + burst protection 1 request/5 segundos via `@Throttle()`
- Refresh: override a 15 requests/minuto via `@Throttle()`

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

### 7. Notification Flow (Direct Service Injection)

Las notificaciones y emails se disparan con **inyeccion directa** desde los servicios de dominio — sin capa de eventos (`EventEmitter2` fue eliminado en Fase 15):

| Accion de dominio            | Emisor                 | Handler                     | Accion                                                    |
| ---------------------------- | ---------------------- | --------------------------- | --------------------------------------------------------- |
| Solicitud de servicio creada | ServiceRequestsService | NotificationsHandlerService | Notificacion in-app (BullMQ queue) + email (BullMQ queue) |
| Estado de servicio cambiado  | ServiceRequestsService | NotificationsHandlerService | Notificacion in-app al cliente (BullMQ queue)             |
| Presupuesto creado           | BudgetsService         | NotificationsHandlerService | Notificacion in-app (BullMQ queue) + email (BullMQ queue) |
| Presupuesto cotizado         | BudgetsService         | NotificationsHandlerService | Notificacion in-app + email al cliente (BullMQ queues)    |
| Estado de presupuesto cambia | BudgetsService         | NotificationsHandlerService | Notificacion in-app + email al cliente (BullMQ queues)    |
| Comentario en presupuesto    | BudgetsService         | NotificationsHandlerService | Notificacion in-app + push a la otra parte                |
| Comentario en solicitud      | ServiceRequestsService | NotificationsHandlerService | Notificacion in-app + push a la otra parte                |
| Cliente invitado             | ClientsService         | EmailQueueService (directo) | Email de invitacion via BullMQ queue                      |
| ISV bajó >15 puntos          | ISVSnapshotService     | NotificationsHandlerService | Notificacion in-app (BullMQ queue) + push notification    |

**Pattern:** Los servicios de dominio inyectan `NotificationsHandlerService` y llaman sus metodos con `void` (fire-and-forget):

```typescript
// BudgetsService llama directamente — sin EventEmitter2
void this.notificationsHandler.handleBudgetCreated({ budgetId, title, requesterId });
```

**Error Boundaries + Dead-Letter Queue:** Cada método handler está envuelto con `withDLQ(handler, payload, fn)`. Si el handler falla, el error se loguea Y se persiste en la tabla `FailedNotification` (handler name + payload JSON + error message). `NotificationRetryService` (cron `0 * * * *`) reintenta hasta 3 veces con backoff exponencial (1h → 2h → 4h). Un `AsyncLocalStorage` flag previene que los reintentos creen nuevas entradas DLQ en caso de fallo (evita cadenas infinitas). Ver ADR-008 y `scheduler-registry.md` sección DLQ para detalles.

**Notification Queue (BullMQ):** Las notificaciones in-app se encolan via `NotificationQueueService` (`enqueue` / `enqueueBatch`) y se procesan por `NotificationQueueProcessor`. Configuracion: 3 reintentos con backoff exponencial (base 3s). Queue name: `notification`.

**Email Queue (BullMQ):** Los emails se encolan via `EmailQueueService` y se procesan por `EmailQueueProcessor`. Configuracion: 5 reintentos con backoff exponencial (base 5s). Tipos de jobs: `invite`, `taskReminder`, `budgetQuoted`, `budgetStatus`. Queue name: `emails`.

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
- La rotacion tiene **try-catch** alrededor del `eval()` de Redis — si Redis falla, lanza `ServiceUnavailableException` (HTTP 503) con mensaje `'Auth service temporarily unavailable'`
- `generateTokenPair` tiene **try-catch** alrededor del `setex` de Redis — si Redis no esta disponible al hacer login, se emiten los tokens igualmente (los logs indican que el refresh rotation no funcionara hasta que Redis se recupere)
- Logout: blacklist access token JTI (TTL = tiempo restante) + revocar family + `queryClient.clear()` en frontend
- `JwtStrategy.validate()` verifica que el JTI no este en blacklist y que el campo `purpose` (si presente) sea `'access'` antes de autenticar. Esto previene uso de tokens de invitacion como access tokens
- Implementado en `auth/token.service.ts` (genera pares, rota, revoca, blacklist)
- Cookies: `SameSite` configurable via `COOKIE_SAME_SITE` env var (`strict` por default), `HttpOnly`, `Secure` (en produccion o cuando `SameSite=none`). Con el proxy de Next.js (`rewrites`), todo es same-origin desde el browser → `strict` funciona correctamente en produccion. Elimina necesidad de tokens CSRF

**Auth Audit Logging:**

- `AuthAuditService` registra eventos en formato JSON estructurado (pino) **y los persiste de forma fire-and-forget en la tabla `AuthAuditLog` (PostgreSQL)**. La persistencia usa `void promise.catch(log)` — un fallo de DB nunca bloquea el flujo de auth
- Eventos: `login` (userId, email, clientType, ip), `logout` (userId, jti), `login_failed` (email, reason, ip), `password_set` (userId), `token_reuse_attack` (family, userId)
- Modelo `AuthAuditLog`: `userId` nullable (logins fallidos no tienen userId), `metadata Json` para datos específicos del evento. Índices en `(userId, createdAt)` y `(event, createdAt)`
- Inyectado en `AuthService` y `TokenService`

**Otros:**

- Passwords hasheados con bcrypt (12 rounds)
- Nuevos clientes reciben link `/set-password?token=<jwt>` por email
- `set-password` valida token JWT (verifica claim `purpose === 'invite'`) y setea password

### 10. File Upload Pattern

```
Frontend (ADMIN) → POST /upload (multipart/form-data)
                 ← { url }  (URL publica del archivo en R2)
                 → Usar URL en el form data del recurso
```

**Seguridad del upload:**

- **Acceso:** Restringido a `ADMIN` via `@Roles(UserRole.ADMIN)` a nivel de controller
- **MIME type whitelist:** Solo `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`
- **Magic bytes validation:** `file-type` verifica contenido real del archivo (no solo header Content-Type)
- **Content-Disposition:** `attachment` en R2 para forzar descarga en vez de render inline
- **Tamano maximo:** 10 MB
- **Folders permitidos:** `uploads`, `properties`, `tasks`, `service-requests`, `budgets` — validacion via Zod schema (`uploadBodySchema`) con `ZodValidationPipe` en el `@Body()`. Reemplaza la validacion manual anterior

### 11. Cron Jobs (Scheduler + Distributed Lock)

`SchedulerModule` con `@Cron()` — seis jobs diarios + uno mensual:

1. **task-status-recalculation** (09:00 UTC diario): PENDING → UPCOMING (30 dias) → OVERDUE (pasada fecha), y reset UPCOMING → PENDING si se alejo
2. **task-upcoming-reminders** (09:05 UTC diario): Notificaciones in-app + email para tareas en 7 dias y vencidas. Deduplicacion por dia. Overdue tambien notifica admins
3. **task-safety-sweep** (09:10 UTC diario): Fix para tareas COMPLETED con nextDueDate vencida que no se avanzaron (edge case crash)
4. **budget-expiration** (09:30 UTC diario): Expira presupuestos QUOTED con `validUntil` vencida
5. **service-request-auto-close** (10:00 UTC diario): Cierra solicitudes RESOLVED con >30 días sin actividad
6. **subscription-reminder** (09:15 UTC / 06:15 AR diario): Envía recordatorios de vencimiento de suscripción a clientes con 7, 3 y 1 días restantes. Notificación in-app + email. Deduplicación por día. Escalonado 15min después de task-status-recalculation para evitar pico de DB simultáneo
7. **isv-snapshot** (02:00 UTC, 1ro de cada mes): Captura ISV (Índice de Salud de la Vivienda) para todas las propiedades con plan ACTIVE. Compara con snapshot anterior — si bajó >15 puntos → dispara alerta via `NotificationsHandlerService.handleISVAlert()` (notificación in-app + push)

**Batch Processing:** Las tareas se procesan en lotes de `BATCH_SIZE=50`, verificando `signal.lockLost` entre cada batch para abortar si el lock se perdio.

**Distributed Lock:** Cada cron job esta envuelto en `DistributedLockService.withLock()` (Redis SETNX, TTL 5min) para prevenir ejecucion concurrente en deployments multi-instancia. Key pattern: `lock:cron:<job-name>`.

**Watchdog + lockLost signal:** El lock se extiende automaticamente cada mitad del TTL mientras la operacion siga en curso. El callback recibe un objeto `signal: { lockLost: boolean }`. Si el lock se pierde (extension falla o error de Redis), `signal.lockLost` se setea a `true` y el lock no se libera en el `finally`. Los cron jobs verifican `signal.lockLost` antes de operaciones costosas y abortan si el lock se perdio.

Dependencias: `TasksRepository`, `NotificationsRepository`, `UsersRepository`, `DistributedLockService`

### 12. Module Boundary Rules (ESLint)

El `eslint.config.mjs` aplica reglas `no-restricted-imports` que refuerzan la jerarquía de capas:

- **core/prisma/redis/metrics** → no pueden importar de módulos de dominio (auth, budgets, tasks, etc.)
- **Módulos de dominio** → no pueden importar de `scheduler/` (solo `app.module.ts` puede)
- **health/** está exento de la regla core→domain porque necesita importar queue names para health checks

Jerarquía: `core → infrastructure (email, upload) → domain → scheduler (orquestación)`

### 13. Frontend State Management

**Zustand (auth-store):**

- `BaseAuthState` (interfaz compartida en `@epde/shared/types/auth.ts`) define los campos y métodos comunes: `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `checkAuth()`
- Web: `type AuthState = BaseAuthState` (sin campos extra, cookies HttpOnly)
- Mobile: `interface AuthState extends BaseAuthState { subscriptionExpired: boolean }` (SecureStore + push tokens)

**TanStack React Query (server state):**

- Cada entidad tiene hooks en `/hooks/use-<entity>.ts`
- Pattern: `useQuery` para lectura, `useMutation` para escritura
- `queryKey` convention: `QUERY_KEYS` centralizado en `@epde/shared`, importado en web y mobile (ej: `[QUERY_KEYS.budgets, filters]`)
- Invalidacion especifica en `onSuccess` de mutations (sub-keys de dashboard: `['dashboard', 'stats']`, `['dashboard', 'activity']`, etc. en vez de invalidar todo `['dashboard']`)
- `queryClient` singleton exportable (`lib/query-client.ts`) — usado tanto por el QueryProvider como por el auth store (para `queryClient.clear()` en logout)
- Paginacion cursor-based con `hasMore` + "Cargar mas"
- Hooks de detalle aceptan `options?: { initialData }` para hydration desde Server Components

**Detail pages (Client Components con skeleton loading):**

- Las 4 detail pages (`budgets/[id]`, `service-requests/[id]`, `clients/[id]`, `properties/[id]`) son **Client Components** (`'use client'`)
- Pattern: `page.tsx` usa `use(params)` para obtener `id`, `useAuthStore` para rol → pasa `id` + `isAdmin` al Client Component hijo
- Los Client Components cargan datos via React Query con skeleton loading inmediato (sin blocking de navegacion)
- Property detail usa **lazy tab loading** con 4 tabs ordenados por prioridad: Salud (default) → Plan → Gastos → Fotos. Expenses/photos solo se fetchean cuando el tab esta activo
- Properties list page tiene **prefetch on hover**: al pasar el mouse sobre una fila, se pre-carga data del detalle

**UI/UX Patterns (Web):**

- **Detail pages:** Info card con `bg-muted/40 rounded-lg p-4`, iconos Lucide en labels, structured loading skeletons
- **Not-found states:** Icon centrado + texto + boton "Volver" al listado
- **Empty states:** Icon `text-muted-foreground/50` + texto descriptivo centrado
- **DataTable:** Row click para navegacion, titulo como `<Link>`, menu 3-dot solo para acciones destructivas
- **Dashboard:** Activity list con icon circles en bordered cards, stat cards con styling condicional para overdue (`border-destructive/30 bg-destructive/10`)

### 13. API Client (Axios + Next.js Proxy + `attachRefreshInterceptor`)

```typescript
// lib/api-client.ts (web)
import { attachRefreshInterceptor } from '@epde/shared';

// Browser requests go through Next.js proxy (same origin → cookies work)
const apiClient = axios.create({
  baseURL: '/api/v1', // proxy rewrites to API_PROXY_TARGET
  withCredentials: true, // cookies (same-origin via proxy)
});

attachRefreshInterceptor({
  client: apiClient,
  doRefresh: async () => {
    await apiClient.post('/auth/refresh');
    return true;
  },
  onRefreshFail: () => {
    window.location.href = '/login';
  },
});
```

**Proxy pattern (Next.js rewrites):**

```
Browser → epde-web.vercel.app/api/v1/* → (Next.js proxy) → epde.onrender.com/api/v1/*
                                       ← Set-Cookie en dominio de Vercel ←
```

- `next.config.ts` define `rewrites` que mapean `/api/v1/:path*` a `API_PROXY_TARGET/api/v1/:path*`
- `API_PROXY_TARGET` es server-side only (no `NEXT_PUBLIC_`), default `http://localhost:3001`
- Server Components usan `API_PROXY_TARGET` directamente (server-to-server, sin proxy) via `serverFetch()` en `lib/server-api.ts`
- Las cookies se setean en el dominio de Vercel → `COOKIE_SAME_SITE=strict` funciona correctamente

**Paridad web / mobile (singleton refresh via `attachRefreshInterceptor` de `@epde/shared`):**

| Plataforma | Mecanismo de auth                                        | Almacenamiento                | Interceptor                                                       |
| ---------- | -------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Web        | Cookie HttpOnly `access_token` + `withCredentials: true` | Cookie segura (sin acceso JS) | `attachRefreshInterceptor({ doRefresh, onRefreshFail })`          |
| Mobile     | Bearer token en header `Authorization`                   | Expo SecureStore              | `attachRefreshInterceptor({ doRefresh, onRefreshFail, onRetry })` |

Ambas plataformas evitan **concurrent 401 storms**: si multiples requests fallan con 401 al mismo tiempo, solo se lanza un unico refresh; las demas peticiones esperan la misma promesa (via `let refreshPromise: Promise | null = null`).

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

- **RedisService**: Wrapper sobre `ioredis` con metodos `get`, `set`, `del`, `setnx`, `expire`, `eval(script, keys, args)` (ejecuta Lua scripts atomicos), `isHealthy()` (PING/PONG check), `safeExists(key)` (retorna `boolean | null` — `null` si Redis no responde, para graceful degradation). Tracking de conexion via eventos `connect`/`ready`/`error`/`close` con getter `isConnected`
- **DistributedLockService**: Distributed lock via Redis SETNX con TTL. Metodo `withLock<T>(key, ttlSeconds, fn)` que adquiere lock, ejecuta fn, y libera lock. Usa ownership pattern (genera UUID owner, Lua script para release solo si es owned). Incluye **watchdog** que extiende TTL automaticamente y metodo `extendLock()` con Lua script atomico

**Casos de uso:**

- Token rotation: almacena familias de refresh tokens (`rt:{family}`) con TTL 7d
- Token blacklist: almacena JTIs de access tokens revocados (`bl:{jti}`) con TTL restante. **Circuit breaker:** si Redis no responde, `isBlacklisted()` retorna `false` (permite request) con warning en logs — disponibilidad sobre seguridad perfecta durante downtime
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
- Respuesta OK: `{ status: "ok", info: { database: { status: "up" }, redis: { status: "up" } } }`
- **Degraded (Redis caido):** retorna HTTP **200** con `redis.status: "down"` — no 503. La app sigue disponible para load balancers mientras Redis se recupera. El status global sigue siendo `"ok"` porque solo la DB es critica para funcionar

### 18. Decision Record: Notification Architecture (Direct Injection + BullMQ)

**Estado actual (Fase 15):** Los servicios de dominio inyectan `NotificationsHandlerService` directamente y llaman sus metodos con `void`. BullMQ procesa notificaciones in-app y emails con retry automatico y persistencia en Redis. `@nestjs/event-emitter` fue eliminado.

**Por qué se eliminó EventEmitter2:**

- Acopla el dispatch al runtime del proceso (si el proceso muere, el evento se pierde)
- El acoplamiento indirecto ocultaba el flujo de efectos secundarios, dificultando el debugging y los tests
- BullMQ ya proveia durabilidad y retry — EventEmitter2 era una capa redundante
- La inyeccion directa de `NotificationsHandlerService` es mas explicita, testeable (mock simple) y mantenible

**Por qué BullMQ para todo:**

- **Durabilidad:** Jobs persistidos en Redis — si el proceso se reinicia, los jobs pendientes se re-procesan
- **Retry automatico:** Notificaciones (3 intentos, backoff 3s) y emails (5 intentos, backoff 5s) con backoff exponencial
- **Observabilidad:** Jobs fallidos se retienen (`removeOnFail: { count: 500 }`) para diagnostico
- Ambas queues comparten la misma instancia de Redis (`REDIS_URL`)

**Componentes de notification queue:**

- `NotificationsHandlerService`: facade (~244 LOC) inyectado por los domain services. Decide qué notificar y quiénes son los destinatarios; delega a una clase por bounded context en `notifications/handlers/{budget, service-request, task, referral, subscription, account, property-health}-handlers.ts`. La infra compartida (`withDLQ`, AsyncLocalStorage retry context, `sendPush`) vive en `notifications/handler-context.service.ts`. Agregar un nuevo side-effect es un edit al handler del contexto correcto + un delegator en el facade — ver ADR-012.
- `NotificationQueueService`: encola notificaciones in-app (`enqueue` para una, `enqueueBatch` para varias)
- `NotificationQueueProcessor` (`@Processor`): worker que consume y persiste via `NotificationsService.createNotification()`
- Configuracion en `NotificationsModule`: `BullModule.registerQueue('notification')` con retry policy

**Componentes de email queue:**

- `EmailQueueService`: encola jobs de email (`enqueueInvite`, `enqueueTaskReminder`, `enqueueBudgetQuoted`, `enqueueBudgetStatus`)
- `EmailQueueProcessor` (`@Processor`): worker que consume y procesa los jobs via `EmailService` (Resend)
- Configuracion en `EmailModule`: `BullModule.registerQueue('emails')` con retry policy

**Cuando escalar:**

- Si el volumen excede la capacidad de un solo worker → agregar workers adicionales
- Para procesamiento pesado (reportes PDF, facturacion) → crear queues separadas con prioridades
- Para dead-letter queues → configurar `removeOnFail: false` y monitorear jobs fallidos

### Repository Placement

Repositories live in the folder of the **domain owner** that controls the entity's lifecycle:

- `users/users.repository.ts` — Users own their own lifecycle
- `properties/properties.repository.ts` — Properties are standalone features
- `tasks/tasks.repository.ts` — Tasks were extracted to their own module (`TasksModule`) but remain domain children of MaintenancePlans
- `tasks/task-audit-log.repository.ts` — TaskAuditLogs are always in context of a task
- `inspections/inspection-checklist.repository.ts` + `inspections/inspection-item.repository.ts` — Split repos, each extending `BaseRepository`. `InspectionChecklistRepository` owns the checklist lifecycle (create-with-items, soft-delete cascade that nulls `MaintenancePlan.sourceInspectionId`); `InspectionItemRepository` owns per-item mutations (evaluations, add custom)
- `maintenance-plans/maintenance-plans.repository.ts` — Plans own the plan lifecycle; `TasksModule` imports `MaintenancePlansRepository` directly (dual-provider to avoid circular dep)

**Note on dual-provider:** Both `TasksModule` and `MaintenancePlansModule` register `MaintenancePlansRepository` as a provider. This avoids `forwardRef()` with the circular import chain. Both instances are stateless (pure BaseRepository subclass).

**Rule**: If entity X is always created/deleted in the context of entity Y, X's repository lives in Y's module folder.
