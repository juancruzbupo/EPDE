# Arquitectura Completa del Monorepo

Documento exhaustivo que describe la estructura, tecnologias, patrones de diseno y design system de todo el proyecto EPDE.

---

## 1. Vision General

**EPDE** (Estudio Profesional de Diagnostico Edilicio) es una plataforma de mantenimiento preventivo para viviendas unifamiliares. Consta de tres aplicaciones y una libreria compartida organizadas en un monorepo.

### Aplicaciones

| App    | Workspace      | Tecnologia              | Puerto | Descripcion                        |
| ------ | -------------- | ----------------------- | ------ | ---------------------------------- |
| API    | `@epde/api`    | NestJS 11               | 3001   | REST API con auth, RBAC, eventos   |
| Web    | `@epde/web`    | Next.js 15.5            | 3000   | Panel admin + portal cliente (SPA) |
| Mobile | `@epde/mobile` | Expo 54 + React Native  | 8081   | App nativa para clientes           |
| Shared | `@epde/shared` | TypeScript + Zod + tsup | —      | Tipos, schemas, constantes, utils  |

### Roles

| Rol      | Web | Mobile | Descripcion                                   |
| -------- | --- | ------ | --------------------------------------------- |
| `ADMIN`  | Si  | No     | Gestion completa: clientes, propiedades, etc. |
| `CLIENT` | Si  | Si     | Consulta propiedades, tareas, presupuestos    |

---

## 2. Estructura del Monorepo

```
epde/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # GitHub Actions (lint, typecheck, build, e2e)
│       ├── cd.yml                    # Deploy produccion (Railway + Vercel)
│       └── cd-staging.yml           # Deploy staging
├── .husky/
│   ├── pre-commit                    # lint-staged
│   └── commit-msg                    # commitlint
├── apps/
│   ├── api/                          # ── @epde/api ──────────────────────
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 15 modelos, 17 enums
│   │   │   ├── seed.ts               # Admin + 10 categorias default
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── main.ts               # Bootstrap (Helmet, CORS, Swagger, Cookies)
│   │   │   ├── instrument.ts         # OpenTelemetry + Sentry instrumentation
│   │   │   ├── app.module.ts         # Root module (imports todos los features + logging pino)
│   │   │   ├── auth/                 # JWT + Local strategy + Token Rotation (Redis)
│   │   │   │   ├── token.service.ts # Token pairs, rotation, blacklist, reuse detection
│   │   │   │   ├── auth-audit.service.ts # Structured auth event logging
│   │   │   │   └── strategies/
│   │   │   ├── users/                # User CRUD base
│   │   │   ├── clients/              # Gestion de clientes (ADMIN)
│   │   │   ├── properties/           # CRUD propiedades
│   │   │   ├── maintenance-plans/    # Planes + tareas + logs + notas
│   │   │   ├── categories/           # Categorias de mantenimiento
│   │   │   ├── budgets/              # Presupuestos (ciclo completo)
│   │   │   ├── service-requests/     # Solicitudes + fotos
│   │   │   ├── task-templates/        # Templates de tareas por categoria
│   │   │   ├── category-templates/   # Templates de categorias
│   │   │   ├── notifications/        # Sistema de notificaciones (NotificationsHandlerService + BullMQ queues)
│   │   │   ├── dashboard/            # Estadisticas agregadas (DashboardRepository standalone — queries multi-modelo)
│   │   │   ├── email/                # Servicio de emails (Resend)
│   │   │   ├── upload/               # Upload a Cloudflare R2
│   │   │   ├── scheduler/            # Cron jobs (3 diarios, distributed lock)
│   │   │   ├── redis/                # RedisModule (global) + DistributedLockService
│   │   │   ├── health/              # HealthModule (@nestjs/terminus, DB + Redis)
│   │   │   ├── metrics/             # MetricsModule (OpenTelemetry, Prometheus :9464)
│   │   │   ├── prisma/               # PrismaModule (@Global) + PrismaService + soft-delete extension
│   │   │   ├── common/
│   │   │   │   ├── decorators/       # @Public, @Roles, @CurrentUser
│   │   │   │   ├── guards/           # JwtAuth, Roles, Throttler
│   │   │   │   ├── pipes/            # ZodValidationPipe
│   │   │   │   ├── filters/          # GlobalExceptionFilter
│   │   │   │   └── repositories/     # BaseRepository<T>
│   │   │   └── config/               # Env validation (Zod)
│   │   ├── test/                     # E2E tests (*.e2e-spec.ts)
│   │   ├── nest-cli.json
│   │   ├── jest.config.js
│   │   ├── jest-e2e.config.ts        # Config E2E tests
│   │   ├── Dockerfile                # Multi-stage build (Railway deploy)
│   │   ├── tsconfig.json             # module: CommonJS, moduleResolution: node
│   │   └── package.json
│   │
│   ├── web/                          # ── @epde/web ──────────────────────
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── globals.css       # Design tokens (Tailwind v4 + CSS vars)
│   │   │   │   ├── layout.tsx        # Root layout (fonts, providers)
│   │   │   │   ├── page.tsx          # Landing page publica
│   │   │   │   ├── error.tsx        # Root error boundary
│   │   │   │   ├── (auth)/           # Login, set-password
│   │   │   │   └── (dashboard)/      # Layout autenticado con sidebar
│   │   │   │       ├── layout.tsx    # Sidebar + Header + Content
│   │   │   │       ├── error.tsx    # Dashboard error boundary
│   │   │   │       ├── dashboard/    # Dashboard admin/client
│   │   │   │       ├── clients/      # CRUD clientes (ADMIN)
│   │   │   │       ├── properties/   # CRUD propiedades
│   │   │   │       ├── categories/   # CRUD categorias (ADMIN)
│   │   │   │       ├── maintenance-plans/ # Planes de mantenimiento
│   │   │   │       ├── tasks/        # Tareas globales
│   │   │   │       ├── budgets/      # Presupuestos
│   │   │   │       ├── service-requests/  # Solicitudes
│   │   │   │       └── notifications/     # Notificaciones
│   │   │   ├── components/
│   │   │   │   ├── ui/               # 18 componentes shadcn/ui
│   │   │   │   ├── data-table/       # DataTable wrapper (TanStack Table)
│   │   │   │   ├── layout/           # Header, Sidebar
│   │   │   │   └── landing/          # landing-page.tsx (12 secciones, screenshots, costos, pricing)
│   │   │   ├── hooks/                # React Query hooks por entidad
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts     # Axios + 401 refresh interceptor
│   │   │   │   ├── query-client.ts   # QueryClient singleton (shared by provider + auth store)
│   │   │   │   ├── style-maps.ts     # Mapas de variantes (Badge colors)
│   │   │   │   └── api/              # Funciones API por entidad
│   │   │   ├── providers/            # QueryProvider, AuthProvider
│   │   │   └── stores/               # Zustand auth store
│   │   ├── middleware.ts             # Proteccion de rutas (cookie check)
│   │   ├── vitest.config.ts         # Vitest + jsdom + @testing-library/react
│   │   ├── components.json          # shadcn config (new-york style)
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json            # moduleResolution: bundler
│   │   └── package.json
│   │
│   └── mobile/                       # ── @epde/mobile ───────────────────
│       ├── src/
│       │   ├── app/
│       │   │   ├── _layout.tsx       # Root layout + ErrorBoundary + PersistQueryClient + AuthGate
│       │   │   ├── index.tsx         # Redirect segun auth state
│       │   │   ├── (auth)/           # Login, set-password
│       │   │   ├── (tabs)/           # 7 tabs (dashboard, properties, planes, tareas, budgets, notifs, profile)
│       │   │   ├── property/[id].tsx # Detalle propiedad + tareas
│       │   │   ├── budget/[id].tsx   # Detalle presupuesto + items
│       │   │   ├── service-requests/ # Lista y detalle
│       │   │   └── task/[planId]/[taskId].tsx  # Tarea + logs + notas
│       │   ├── components/           # StatusBadge, EmptyState, StatCard, ErrorBoundary
│       │   ├── hooks/                # React Query hooks (infinite scroll)
│       │   ├── lib/
│       │   │   ├── api-client.ts     # Axios + token refresh + auto-detect URL
│       │   │   ├── token-service.ts  # SecureStore (nativo) + sessionStorage (web)
│       │   │   ├── query-persister.ts # AsyncStorage persister (offline cache)
│       │   │   ├── auth.ts           # Auth API functions
│       │   │   ├── colors.ts         # Re-exports DESIGN_TOKENS_LIGHT de @epde/shared
│       │   │   ├── screen-options.ts # Navigation header/tab defaults
│       │   │   └── api/              # Endpoints por entidad
│       │   ├── stores/               # Zustand auth store
│       │   └── global.css            # Tokens NativeWind
│       ├── assets/                   # Iconos, splash
│       ├── app.json                  # Expo config (com.epde.mobile)
│       ├── metro.config.js           # Metro + NativeWind
│       ├── jest.config.js            # Jest + jest-expo config
│       ├── postcss.config.mjs
│       ├── tsconfig.json             # Extiende expo/tsconfig.base
│       └── package.json
│
├── packages/
│   └── shared/                       # ── @epde/shared ───────────────────
│       ├── src/
│       │   ├── index.ts              # Re-exports
│       │   ├── types/
│       │   │   ├── entities/         # Interfaces por dominio (user, property, task, etc.)
│       │   │   │   └── index.ts      # Re-exports (backwards compatible)
│       │   │   ├── enums.ts          # Enums como const + type unions
│       │   │   ├── auth.ts           # Auth response types
│       │   │   ├── api.ts            # PaginatedResponse<T>, ApiError
│       │   │   └── dashboard.ts      # Dashboard metrics types
│       │   ├── schemas/
│       │   │   ├── auth.ts           # Login, register, refresh
│       │   │   ├── user.ts           # User CRUD schemas
│       │   │   ├── property.ts       # Property schemas
│       │   │   ├── task.ts           # Task schemas + recurrence validation
│       │   │   ├── budget.ts         # Budget request/response schemas
│       │   │   ├── category.ts       # Category filters schema
│       │   │   └── service-request.ts
│       │   ├── constants/
│       │   │   ├── index.ts          # Labels en espanol, defaults, mappings
│       │   │   │                      # (QUERY_KEYS centralizado aquí — SSoT para web y mobile)
│       │   │   ├── badge-variants.ts # Variantes de Badge compartidas web/mobile
│       │   │   └── design-tokens.ts  # DESIGN_TOKENS_LIGHT + DESIGN_TOKENS_DARK (SSoT paleta)
│       │   └── utils/                # Date/string helpers, getErrorMessage, validateUpload
│       ├── tsup.config.ts            # Dual ESM(.js) + CJS(.cjs) build
│       ├── vitest.config.ts          # Unit tests
│       ├── tsconfig.json
│       └── package.json              # type: "module", exports map
│
├── docs/                             # Documentacion del proyecto
├── docker-compose.yml                # PostgreSQL 16 + Redis 7 + pgAdmin
├── turbo.json                        # Pipeline de tareas Turborepo
├── package.json                      # Root: scripts, devDeps, pnpm config
├── pnpm-workspace.yaml               # apps/*, packages/*
├── pnpm-lock.yaml
├── tsconfig.json                     # Base: ESNext, strict
├── eslint.config.mjs                 # ESLint 9 flat config
├── railway.json                      # Railway deploy config (API healthcheck)
├── .dockerignore                     # Docker build exclusions
├── .prettierrc                       # Prettier config
├── commitlint.config.js              # Conventional commits
└── .lintstagedrc.json                # Pre-commit: lint + typecheck
```

---

## 3. Stack Tecnologico Detallado

### Build & Tooling

| Herramienta    | Version | Uso                                     |
| -------------- | ------- | --------------------------------------- |
| Turborepo      | 2.x     | Orquestador de tareas del monorepo      |
| pnpm           | 10.6.1  | Package manager con workspaces          |
| TypeScript     | 5.9     | Lenguaje base (strict mode)             |
| ESLint         | 9.x     | Linting (flat config + TypeScript)      |
| Prettier       | 3.5     | Formateo (singleQuote, tailwind plugin) |
| Husky          | -       | Git hooks (pre-commit, commit-msg)      |
| Commitlint     | -       | Conventional commits enforcement        |
| lint-staged    | -       | Lint solo archivos staged               |
| GitHub Actions | -       | CI pipeline (lint, typecheck, build)    |

### Backend (NestJS)

| Tecnologia                | Version | Uso                                                                                           |
| ------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| NestJS                    | 11      | Framework REST API                                                                            |
| Prisma                    | 6       | ORM + migraciones                                                                             |
| PostgreSQL                | 16      | Base de datos                                                                                 |
| Redis                     | 7       | Cache, token state, distributed lock                                                          |
| ioredis                   | 5.9     | Redis client para Node.js                                                                     |
| Passport                  | -       | Autenticacion (JWT + Local strategy)                                                          |
| @nestjs/jwt               | -       | JWT tokens (access 15m, refresh 7d)                                                           |
| @nestjs/throttler         | 6.5     | Rate limiting                                                                                 |
| @nestjs/swagger           | 11.2    | Documentacion OpenAPI                                                                         |
| @nestjs/schedule          | 6.1     | Cron jobs                                                                                     |
| ~~@nestjs/event-emitter~~ | —       | ~~Eliminado en Fase 15~~ — reemplazado por inyeccion directa de `NotificationsHandlerService` |
| Helmet                    | 8.1     | Headers de seguridad                                                                          |
| Resend                    | 6.9     | Envio de emails transaccionales                                                               |
| AWS S3 SDK                | -       | Upload a Cloudflare R2                                                                        |
| Sentry                    | 10.40   | Monitoreo de errores                                                                          |
| bcrypt                    | 6.0     | Hash de passwords (12 rounds)                                                                 |
| Jest                      | 29      | Testing unitario + E2E                                                                        |

### Frontend Web (Next.js)

| Tecnologia           | Version | Uso                              |
| -------------------- | ------- | -------------------------------- |
| Next.js              | 15.5    | Framework React (App Router)     |
| React                | 19      | UI runtime                       |
| Tailwind CSS         | 4       | Utility-first CSS                |
| shadcn/ui            | -       | Componentes UI (estilo new-york) |
| TanStack React Query | 5.90    | Server state management          |
| TanStack React Table | 8.21    | Tablas de datos                  |
| Zustand              | 5.0     | Client state (auth store)        |
| React Hook Form      | 7.71    | Formularios                      |
| Axios                | -       | HTTP client                      |
| Vitest               | 4.0     | Testing unitario (jsdom)         |
| @testing-library     | 16      | Testing de componentes           |
| Framer Motion        | 12.34   | Animaciones                      |
| Lucide React         | 0.470   | Iconos                           |
| date-fns             | 4.1     | Utilidades de fecha              |
| cmdk                 | -       | Command palette (combobox)       |

### Mobile (Expo)

| Tecnologia              | Version | Uso                                    |
| ----------------------- | ------- | -------------------------------------- |
| Expo                    | 54      | Framework React Native                 |
| React Native            | 0.81    | Runtime nativo                         |
| Expo Router             | 6       | File-based routing                     |
| NativeWind              | 5       | Tailwind CSS para React Native         |
| TanStack React Query    | 5       | Server state + infinite scroll         |
| Zustand                 | 5       | Auth state                             |
| React Hook Form         | 7.71    | Formularios + Zod resolver             |
| Axios                   | 1.13    | HTTP client + token refresh            |
| expo-secure-store       | 15      | Almacenamiento seguro de tokens        |
| expo-image-picker       | 17      | Seleccion de imagenes (camara/galeria) |
| expo-font               | 14      | Carga de fuentes custom                |
| react-native-reanimated | 4.1     | Animaciones nativas                    |
| jest-expo               | 55      | Testing preset para Expo               |
| @testing-library/RN     | 13      | Testing de componentes nativos         |

### Shared Package

| Tecnologia | Version | Uso                          |
| ---------- | ------- | ---------------------------- |
| Zod        | 3.24    | Schemas de validacion (SSoT) |
| tsup       | 8.x     | Build dual ESM + CJS         |
| date-fns   | 4.1     | Utilidades de fecha          |
| Vitest     | 4.0     | Testing unitario             |

---

## 4. Patrones de Diseno

### P1: Repository Pattern (Backend)

Cada modulo tiene un repositorio que extiende `BaseRepository<T, M>`:

```typescript
type PrismaModelName = /* union de nombres de modelo validos extraidos de PrismaClient */;

export class BaseRepository<T, M extends PrismaModelName = PrismaModelName> {
  protected model; // Con filtro soft-delete (deletedAt: null)
  protected writeModel; // Sin filtro (acceso completo)

  constructor(prisma: PrismaService, modelName: M, hasSoftDelete: boolean);

  async findMany(params): Promise<PaginatedResult<T>>;
  async findById(id, include?): Promise<T | null>;
  async create(data, include?): Promise<T>;
  async update(id, data, include?): Promise<T>;
  async delete(id): Promise<T>;
}
```

- **Servicios NO inyectan PrismaService** — solo los repositorios acceden a datos (excepcion: `AuthAuditService` — fire-and-forget logger)
- `PrismaModule` es `@Global()` — se importa una sola vez en `AppModule` y queda disponible para todos los modulos sin necesidad de registrar `PrismaService` en cada `providers[]`
- Paginacion cursor-based: `{ data, nextCursor, hasMore, total }`
- `take` clampeado entre 1 y `MAX_PAGE_SIZE` (100) para prevenir queries sin limite

### P2: Soft Delete (Prisma Extension)

Extension global en `PrismaService`:

- `findMany/findFirst/findUnique/count/aggregate/groupBy` → auto-agregan `where: { deletedAt: null }`
- Condicion: `hasDeletedAtKey(where)` inspecciona recursivamente nivel raiz + operadores logicos (`AND`, `OR`, `NOT`)
- `delete` → se convierte en `update({ deletedAt: new Date() })`
- Modelos afectados: `User`, `Property`, `Task`, `Category`, `BudgetRequest`, `ServiceRequest`
- Acceso a eliminados: via `writeModel` (sin filtro)

### P3: Module Pattern (NestJS)

Cada feature sigue una estructura consistente:

```
feature/
  feature.module.ts         # Imports, providers, exports
  feature.controller.ts     # Endpoints REST
  feature.service.ts        # Logica de negocio
  feature.repository.ts     # Acceso a datos (unico con PrismaService)
  feature.service.spec.ts   # Unit tests
```

**Excepciones documentadas:**

| Modulo      | Excepcion                                                                      | Razon                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`     | Sin controller                                                                 | CRUD de usuarios expuesto via `clients/` — no tiene endpoints directos                                                                                       |
| `upload`    | Sin repository                                                                 | Solo interactua con Cloudflare R2, no persiste en DB                                                                                                         |
| `scheduler` | Sin controller ni repository                                                   | Solo cron jobs — sin endpoints REST ni acceso a datos propios                                                                                                |
| `email`     | Sin controller ni repository                                                   | Servicio auxiliar de envio — invocado por `notifications/`                                                                                                   |
| `dashboard` | Repository standalone (no extiende BaseRepository)                             | Queries de agregacion multi-modelo (JOINs entre User, Task, Budget, ServiceRequest) que no encajan en el patron CRUD de un solo modelo                       |
| `tasks`     | Modulo separado importa `PlanDataModule` (provee `MaintenancePlansRepository`) | Extraccion de `TaskLifecycleService` + `TaskNotesService` del modulo `maintenance-plans/`. `PlanDataModule` rompe la dependencia circular sin `forwardRef()` |

### P4: Guard Composition

Tres guards globales en orden via `APP_GUARD`:

1. **ThrottlerGuard** — Rate limiting (5/s corto, 30/10s medio, 5/min login/refresh, 3/s + 20/min upload, 3/hora + 1/5s burst set-password)
2. **JwtAuthGuard** — Valida JWT. Salta `@Public()` endpoints
3. **RolesGuard** — Primero verifica `@Public()` (permite sin auth). Luego verifica `user.role` contra `@Roles()`. **Sin `@Roles()` ni `@Public()` = deniega (403)** — deny-by-default para prevenir escalation of privilege. Todo endpoint autenticado requiere `@Roles()` explicito

### P5: Decorators Personalizados

| Decorator         | Funcion                    |
| ----------------- | -------------------------- |
| `@Public()`       | Endpoint sin autenticacion |
| `@Roles('ADMIN')` | Restringe por rol          |
| `@CurrentUser()`  | Extrae usuario del request |

### P6: Zod Validation (Single Source of Truth)

- Schemas definidos en `@epde/shared/schemas` — unico SSoT
- Backend: `ZodValidationPipe` en cada endpoint
- Frontend web: `zodResolver` con React Hook Form
- Frontend mobile: `zodResolver` con React Hook Form
- **No se usa class-validator/class-transformer**

### P7: Notification Flow (Direct Service Injection + BullMQ)

Los servicios de dominio inyectan `NotificationsHandlerService` directamente. No hay capa de eventos — `EventEmitter2` fue eliminado en Fase 15:

| Accion de dominio            | Emisor                 | Accion en BullMQ                                     |
| ---------------------------- | ---------------------- | ---------------------------------------------------- |
| Solicitud de servicio creada | ServiceRequestsService | Notificacion in-app (queue) + email (queue) al admin |
| Estado de servicio cambiado  | ServiceRequestsService | Notificacion in-app al cliente (queue)               |
| Presupuesto creado           | BudgetsService         | Notificacion in-app (queue) + email (queue) al admin |
| Presupuesto cotizado         | BudgetsService         | Notificacion in-app + email al cliente (queues)      |
| Estado de presupuesto cambia | BudgetsService         | Notificacion in-app + email al cliente (queues)      |
| Cliente invitado             | ClientsService         | Email de invitacion (queue)                          |

**Pattern:** `void this.notificationsHandler.handleBudgetCreated({...})` — fire-and-forget tipado.

**Queues:** `notification` (3 reintentos, backoff 3s) para in-app, `emails` (5 reintentos, backoff 5s) para emails. `NotificationsHandlerService` envuelve cada llamada en `try-catch`. Errores de BullMQ se reintentan automaticamente.

### P8: Error Handling Centralizado

`GlobalExceptionFilter`:

- `HttpException` → responde con status y mensaje. Si `status >= 500`, tambien reporta a Sentry
- Otros errores → `500` + `Sentry.captureException()`
- Formato: `{ statusCode, message, error }`

### P9: Auth Flow (JWT + Token Rotation)

```
Login → LocalStrategy (email+password) → JWT access + refresh (family + generation)
                                        ↓
                              Web: cookies HttpOnly (access 15m, refresh 7d)
                              Mobile: SecureStore (access + refresh tokens)
                                        ↓
                              Request → JwtStrategy → verifica blacklist (Redis) → user en request
                                        ↓
                              Token expirado → refresh → rota token (nueva generation en Redis)
                                        ↓
                              Logout → blacklist access JTI + revocar family en Redis
```

- **Token Rotation**: cada login crea una "family" UUID. Refresh tokens llevan `family` + `generation`
- **Reuse Detection**: si generation no coincide al hacer refresh → revoca toda la family
- Redis almacena `rt:{family}` con generation actual (TTL 7d) y `bl:{jti}` para blacklist. La rotacion usa Lua script atomico con try-catch (retorna `InternalServerErrorException` si Redis falla)
- `JwtStrategy.validate()` verifica que `purpose` (si presente) sea `'access'` — previene uso de tokens de invitacion como access tokens
- Cookies: `SameSite=strict`, `HttpOnly`, `Secure` (prod) — elimina necesidad de CSRF tokens
- `AuthAuditService`: logging estructurado de eventos de auth (login, logout, failed, reuse attack)
- Implementado en `auth/token.service.ts`
- Web: cookies HttpOnly (el browser las envia automaticamente)
- Mobile: Bearer token en header (SecureStore para persistencia)
- Passwords: bcrypt 12 rounds
- Invitacion: JWT temporal + link `/set-password`

### P10: File Upload

```
Cliente → POST /upload (multipart/form-data) → { url }
       → Usar URL en el form del recurso
```

**Acceso:** Restringido a `ADMIN` via `@Roles(UserRole.ADMIN)`.
**Validacion server-side:** MIME whitelist (jpeg, png, webp, gif, pdf), magic bytes verification (`file-type`), `Content-Disposition: attachment`, max 10 MB, folder validado via Zod schema (`uploadBodySchema`) con `ZodValidationPipe`.
**Validacion client-side:** `validateUpload()` de `@epde/shared` valida MIME type y tamano antes del upload (web y mobile web). Mobile nativo no puede obtener el tamano del archivo antes de subir — se valida solo server-side.

### P11: Cron Jobs (Distributed Lock)

Tres jobs diarios (09:00-09:10 UTC), cada uno envuelto en `DistributedLockService.withLock()` (Redis SETNX, TTL 5min):

1. **task-status-recalculation**: PENDING → UPCOMING (30 dias) → OVERDUE
2. **task-upcoming-reminders**: Notificaciones + email para tareas proximas/vencidas
3. **task-safety-sweep**: Correccion de edge cases en tareas completadas

Lock key pattern: `lock:cron:<job-name>`. Previene ejecucion concurrente en deployments multi-instancia. Incluye **watchdog** que extiende TTL automaticamente cada mitad del periodo. El callback recibe `signal: { lockLost: boolean }` — los jobs verifican el flag antes de operaciones costosas y abortan si el lock se perdio. **Batch processing**: tareas procesadas en lotes de `BATCH_SIZE=50` para evitar timeouts en datasets grandes.

### P12: State Management (Web + Mobile)

**Zustand** (client state):

- `auth-store`: user, isAuthenticated, isLoading, login(), logout()
- Minimo — solo para estado de sesion

**TanStack React Query** (server state):

- Hooks por entidad: `use-properties`, `use-budgets`, `use-notifications`, etc.
- `useQuery` para lectura, `useMutation` para escritura
- Query keys centralizados: `QUERY_KEYS` importados desde `@epde/shared`. Ej: `[QUERY_KEYS.budgets, filters]`
- Invalidacion automatica en `onSuccess`
- Web: paginacion cursor-based con "Cargar mas"
- Mobile: `useInfiniteQuery` con scroll infinito

### P13: API Client (Axios)

Patron compartido entre web y mobile:

```typescript
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Web: cookies | Mobile: Bearer token
});

// Interceptor de refresh en 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (401 && !_retry) {
      await refreshToken();
      return apiClient(originalRequest);
    }
  },
);
```

Mobile agrega:

- Header `X-Client-Type: mobile`
- Singleton pattern para evitar refresh concurrentes
- Auto-deteccion de IP para desarrollo nativo

Web agrega:

- Singleton pattern para deduplicar refreshes concurrentes (como mobile)

### P14: Route Protection

**Web (Next.js middleware)**:

```typescript
// Verifica cookie access_token + decodifica JWT exp (buffer 30s)
// No auth o token expirado + ruta privada → redirect /login
// Auth + ruta de auth → redirect /dashboard
```

**Mobile (AuthGate component)**:

```typescript
// Verifica tokens en SecureStore
// isLoading → splash screen
// No auth → /(auth)/login
// Auth → /(tabs)
```

### P15: Redis Infrastructure

Modulo global `RedisModule` (`redis/redis.module.ts`) con dos servicios:

- **RedisService**: Wrapper sobre `ioredis` con metodos `get`, `set`, `del`, `setnx`, `expire`, `eval()` (Lua scripts), `isHealthy()`, `getClient()`
- **DistributedLockService**: Redis SETNX con ownership (UUID). Metodo `withLock<T>(key, ttlSeconds, fn)`. Usa Lua script para release seguro (verifica owner)

Casos de uso: token rotation (families), token blacklist (JTIs), distributed lock (cron jobs). Eviction policy: `volatile-lru` (solo evicta keys con TTL).

---

## 5. Design System

### Identidad de Marca

| Atributo     | Valor                                              |
| ------------ | -------------------------------------------------- |
| Nombre       | EPDE — Estudio Profesional de Diagnostico Edilicio |
| Body font    | DM Sans (Google Fonts)                             |
| Heading font | DM Serif Display (Google Fonts, serif)             |
| Idioma UI    | Espanol (Argentina)                                |
| Iconos       | Lucide React (web) / Emojis (mobile tabs)          |

### Paleta de Colores

#### Paleta

| Token                  | Hex       | Uso                          |
| ---------------------- | --------- | ---------------------------- |
| `primary`              | `#C4704B` | Botones, links, acentos      |
| `primary-foreground`   | `#FAFAF8` | Texto sobre primary          |
| `secondary`            | `#E8DDD3` | Backgrounds suaves, hovers   |
| `secondary-foreground` | `#2E2A27` | Texto sobre secondary        |
| `background`           | `#FAFAF8` | Fondo principal              |
| `foreground`           | `#2E2A27` | Texto principal              |
| `muted`                | `#F5F0EB` | Fondos secundarios           |
| `muted-foreground`     | `#4A4542` | Texto secundario             |
| `destructive`          | `#C45B4B` | Errores, acciones peligrosas |
| `border`               | `#E8DDD3` | Bordes                       |
| `ring`                 | `#C4704B` | Focus ring                   |
| `success`              | `#6B9B7A` | Exito, completado            |

#### Chart Colors (web)

| Token   | Hex       | Color      |
| ------- | --------- | ---------- |
| chart-1 | `#C4704B` | Terracotta |
| chart-2 | `#6B9B7A` | Verde      |
| chart-3 | `#5B8EC4` | Azul       |
| chart-4 | `#D4A843` | Dorado     |
| chart-5 | `#D4956F` | Oxido      |

### Tokens CSS (Tailwind v4)

**Web** (`globals.css`): Usa `@theme inline` + `:root` CSS variables:

```css
@theme inline {
  --color-primary: var(--primary);
  --font-heading: var(--font-dm-serif), serif;
  --radius-sm: calc(var(--radius) - 4px);
}

:root {
  --radius: 0.625rem;
  --primary: #c4704b;
  /* ... */
}
```

**Mobile** (`global.css`): Usa `@theme inline` directamente con NativeWind (NativeWind usa prefijo `--color-*`, a diferencia de web que usa `var(--primary)` via CSS custom properties):

```css
@theme inline {
  --color-primary: #c4704b; /* fuente: DESIGN_TOKENS_LIGHT.primary */
  --color-background: #fafaf8; /* fuente: DESIGN_TOKENS_LIGHT.background */
  --radius: 0.625rem;
}
```

> **SSoT:** Los valores de color deben coincidir con `DESIGN_TOKENS_LIGHT` en `@epde/shared/constants/design-tokens.ts`.
> Al cambiar un color: actualizar primero `design-tokens.ts`, luego propagar a `globals.css` (web) y `global.css` (mobile).
> Un test en `apps/mobile` verifica la sincronizacion de los valores clave.

**Consumidores de `DESIGN_TOKENS_LIGHT` en JS** (no pueden usar CSS custom properties):

| Consumidor                    | Archivo                                   | Uso                                                                                       |
| ----------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| HealthCard progress bar       | `apps/web/src/components/health-card.tsx` | Framer Motion `backgroundColor` (mutedForeground, success, primary, warning, destructive) |
| Email templates (HTML inline) | `apps/api/src/email/email.service.ts`     | Colores en template strings HTML (primary, border, destructive)                           |

NUNCA usar hex literals en estos archivos — importar siempre desde `DESIGN_TOKENS_LIGHT`.

### Spacing & Radius

| Token       | Valor                |
| ----------- | -------------------- |
| `radius`    | `0.625rem` (10px)    |
| `radius-sm` | `calc(radius - 4px)` |
| `radius-md` | `calc(radius - 2px)` |
| `radius-lg` | `radius`             |
| `radius-xl` | `calc(radius + 4px)` |

### Componentes UI (Web — shadcn/ui)

18 componentes instalados, estilo **new-york**:

| Componente | Uso principal                                              |
| ---------- | ---------------------------------------------------------- |
| Alert      | Mensajes de error/info/warning                             |
| Badge      | Estados, etiquetas, prioridades                            |
| Button     | Acciones (default, secondary, outline, ghost, destructive) |
| Card       | Contenedores de contenido                                  |
| Command    | Combobox/typeahead (cmdk)                                  |
| Dialog     | Modales                                                    |
| Input      | Inputs de formulario                                       |
| Label      | Labels de formulario                                       |
| Popover    | Tooltips interactivos                                      |
| Select     | Select mejorado                                            |
| Separator  | Linea divisoria                                            |
| Sheet      | Panel lateral (mobile sidebar)                             |
| Skeleton   | Loading placeholders                                       |
| Table      | Tablas estilizadas                                         |
| Textarea   | Areas de texto                                             |

### Componentes UI (Mobile — custom)

| Componente                | Uso                                      |
| ------------------------- | ---------------------------------------- |
| StatusBadge               | Badge con variantes por estado/prioridad |
| EmptyState                | Placeholder para listas vacias           |
| StatCard                  | Tarjeta de estadistica del dashboard     |
| CreateBudgetModal         | Formulario de creacion de presupuesto    |
| CreateServiceRequestModal | Formulario con upload de fotos           |
| CompleteTaskModal         | Completar tarea con nota y foto          |

### UI/UX Patterns (Web)

#### Detail Page Info Card

Todas las detail pages muestran informacion en un card con fondo sutil e iconos:

```tsx
<div className="bg-muted/40 rounded-lg p-4">
  <dl className="grid gap-4 text-sm sm:grid-cols-2">
    <div className="space-y-1">
      <dt className="text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" /> Label
      </dt>
      <dd className="font-medium">{value}</dd>
    </div>
  </dl>
</div>
```

#### Loading Skeletons

Skeletons estructurados que reflejan el layout real: PageHeader (titulo + descripcion + boton), Card (header con titulo + badge, body con grid de campos `space-y-1.5`).

#### Not-Found / Empty States

- **Not-found:** Icon `h-10 w-10 text-muted-foreground/50` + texto + `<Button variant="outline">Volver</Button>`
- **Empty state:** Icon `h-8 w-8 text-muted-foreground/50` + texto descriptivo centrado (`py-8`)

#### DataTable Row Interaction

- Row click navega a detail page via `onRowClick`
- Titulo de la columna principal como `<Link>` clickeable
- Menu 3-dot solo para acciones destructivas (eliminar, cambiar estado)

#### Dashboard

- Stat cards con styling condicional para overdue: `border-destructive/30 bg-destructive/10`
- Activity list con icon circles (`bg-muted rounded-full p-2`) en bordered card items

### Style Maps (Variantes de Badge)

Centralizados en `lib/style-maps.ts` (web) y `components/status-badge.tsx` (mobile):

| Map                    | Entidad      | Valores                                                       |
| ---------------------- | ------------ | ------------------------------------------------------------- |
| `taskStatusVariant`    | Tareas       | PENDING, UPCOMING, OVERDUE, COMPLETED                         |
| `priorityColors`       | Tareas       | LOW (verde), MEDIUM (amarillo), HIGH (naranja), URGENT (rojo) |
| `budgetStatusVariant`  | Presupuestos | 6 estados con colores                                         |
| `urgencyVariant`       | Solicitudes  | LOW, MEDIUM, HIGH, URGENT                                     |
| `serviceStatusVariant` | Solicitudes  | OPEN, IN_REVIEW, IN_PROGRESS, RESOLVED, CLOSED                |
| `clientStatusVariant`  | Clientes     | INVITED, ACTIVE, INACTIVE                                     |

Los mapas de variantes para Badge (`taskStatusVariant`, `budgetStatusVariant`, `serviceStatusVariant`, etc.) se importan desde `@epde/shared/constants/badge-variants` como SSoT compartido entre web y mobile. El Badge web incluye variante `success` para estados terminales positivos (COMPLETED, APPROVED, RESOLVED).

**Tokens semanticos en badges:** La variante `success` usa `bg-success/15 text-success border-success/20` (web) y `bg-success/15 text-success` (mobile). NUNCA usar `bg-green-*` / `text-green-*` directamente — siempre tokens semanticos (`success`, `warning`, `destructive`).

### Accesibilidad (Web)

El frontend web sigue patrones de accesibilidad WCAG 2.1:

| Patron                | Implementacion                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Botones icon-only     | `aria-label` descriptivo en todos los botones sin texto                                              |
| Focus ring            | `focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none` en elementos custom |
| Keyboard navigation   | `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) en divs clickeables                     |
| Labels de formulario  | `htmlFor`/`id` vinculados en todos los pares Label/Input y Label/SelectTrigger                       |
| Navegacion semantica  | `<nav aria-label>`, `aria-current="page"` en link activo                                             |
| Listas semanticas     | `<ul>/<li>` para actividad, notificaciones, tareas                                                   |
| Loading states        | `role="status"` en indicadores de carga                                                              |
| Secciones colapsables | `aria-expanded` en botones toggle                                                                    |
| Modales accesibles    | `<Dialog>` de shadcn con focus trap, Escape, aria-modal                                              |
| Tokens semanticos     | `text-destructive` (no `text-red-600`), `bg-background` (no `bg-white`)                              |

### DataTable (Web)

Componente wrapper de TanStack Table:

```tsx
<DataTable
  columns={columns} // ColumnDef[]
  data={data} // TData[]
  isLoading={isLoading} // Muestra skeletons
  hasMore={hasMore} // Boton "Cargar mas"
  onLoadMore={loadMore}
  total={total} // "X de Y resultados"
  onRowClick={onClick} // Navegacion por fila
/>
```

### Formularios

Patron compartido web + mobile:

```tsx
const form = useForm<MyInput>({
  resolver: zodResolver(mySchema), // @epde/shared
  defaultValues: { ... },
});
```

---

## 6. Base de Datos

### Motor

PostgreSQL 16, ORM Prisma 6, Docker Compose para desarrollo.

### Modelo de Datos (15 modelos)

```
User ─1:N─ Property ─1:1─ MaintenancePlan ─1:N─ Task ─1:N─ TaskAuditLog
  │                │                                │
  │                ├─1:N─ BudgetRequest ─1:N─ BudgetLineItem
  │                │         └─1:1─ BudgetResponse
  │                │
  │                └─1:N─ ServiceRequest ─1:N─ ServiceRequestPhoto
  │
  ├─1:N─ TaskLog
  ├─1:N─ TaskNote
  └─1:N─ Notification

Category ─1:N─ Task
CategoryTemplate ─1:N─ TaskTemplate
```

**Nota:** `TaskAuditLog` registra el historial de cambios de cada tarea (before/after snapshot).
`CategoryTemplate`/`TaskTemplate` son plantillas de configuracion inicial — no estan en el diagrama principal.

### Enums (11)

`UserRole`, `UserStatus`, `PropertyType`, `PlanStatus`, `TaskPriority`, `RecurrenceType`, `TaskStatus`, `BudgetStatus`, `ServiceUrgency`, `ServiceStatus`, `NotificationType`

### Soft Delete

Modelos con `deletedAt: DateTime?`: User, Property, Task, Category, BudgetRequest, ServiceRequest.
La extension Prisma en `PrismaService` aplica `deletedAt: null` automaticamente via `hasDeletedAtKey()` (inspecciona nivel raiz + `AND/OR/NOT` recursivamente).

**Scope de soft delete — por que los demas modelos NO lo tienen:**

| Modelo sin soft delete | Razon                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `MaintenancePlan`      | Ciclo de vida ligado a Property — si la property se elimina, el plan no tiene sentido independiente |
| `Notification`         | Efimeras por naturaleza — marcar leida/no-leida es suficiente; borrado fisico no tiene impacto      |
| `TaskLog`              | Audit trail inmutable — nunca debe eliminarse; restrict delete del User que lo creo                 |
| `TaskNote`             | Notas de historial — restrict delete; perder notas seria un bug de UX                               |
| `TaskAuditLog`         | Audit trail de cambios de campo — inmutable por diseno                                              |
| `BudgetLineItem`       | Cascade delete con BudgetRequest — si el presupuesto se elimina, los items tambien                  |
| `BudgetResponse`       | Cascade delete con BudgetRequest                                                                    |
| `ServiceRequestPhoto`  | Cascade delete con ServiceRequest                                                                   |
| `CategoryTemplate`     | Templates de configuracion — sin soft delete, administradas por ADMIN                               |
| `TaskTemplate`         | Templates de configuracion — sin soft delete                                                        |

### Tipos Decimal

Campos monetarios usan `Decimal` (no Float): `BudgetLineItem.quantity` (12,4), `.unitPrice` (12,2), `.subtotal` (14,2), `BudgetResponse.totalAmount` (14,2).

### Campos de Auditoria

- `createdBy String?` en: `Property`, `MaintenancePlan`, `Task`, `BudgetRequest`, `ServiceRequest` — ID del usuario que creo el registro
- `updatedBy String?` en: `BudgetRequest`, `ServiceRequest` — ID del usuario que realizo el ultimo cambio de estado

### Check Constraints (DB-level)

- `BudgetLineItem.subtotal`: `>= 0 AND <= 999999999999.99`
- `BudgetResponse.totalAmount`: `>= 0 AND <= 999999999999.99`

### Cascade Deletes

- `BudgetLineItem` → on delete `BudgetRequest`
- `BudgetResponse` → on delete `BudgetRequest`
- `BudgetRequest` → on delete `Property`
- `ServiceRequest` → on delete `Property`
- `ServiceRequestPhoto` → on delete `ServiceRequest`

### Restrict Deletes

- `Task` → restrict on delete `Category` (previene eliminar categorias con tareas)
- `TaskLog` → restrict on delete `User` (previene eliminar usuarios con logs)
- `TaskNote` → restrict on delete `User` (previene eliminar usuarios con notas)

---

## 7. API REST

### Configuracion

| Atributo   | Valor                                                                           |
| ---------- | ------------------------------------------------------------------------------- |
| Base URL   | `http://localhost:3001/api/v1`                                                  |
| Swagger    | `http://localhost:3001/api/docs`                                                |
| Auth       | JWT cookies (web) / Bearer (mobile)                                             |
| Rate limit | 5/s, 30/10s, 5/min (login, refresh), 3/s+20/min (upload), 3/hora (set-password) |

### Endpoints (17 grupos)

1. **Health** — `GET /health` (DB + Redis via @nestjs/terminus)
2. **Auth** — login, refresh, logout, me, set-password
3. **Clients** — CRUD (ADMIN only)
4. **Properties** — CRUD + filtro por rol
5. **Categories** — CRUD
6. **Maintenance Plans** — CRUD + tareas + complete + notes + reorder
7. **Budgets** — CRUD + respond + status changes
8. **Service Requests** — CRUD + status changes
9. **Notifications** — list, unread-count, mark-read, mark-all-read
10. **Upload** — multipart/form-data a R2
11. **Dashboard** — stats, upcoming-tasks, recent-activity

### Formato de Respuesta

**Paginada**: `{ data: T[], nextCursor: string|null, hasMore: boolean, total: number }`
**Singular**: Objeto directo (sin wrapper)
**Error**: `{ statusCode: number, message: string|string[], error: string }`

---

## 8. Infraestructura & DevOps

### Docker Compose (desarrollo)

- **PostgreSQL 16**: puerto 5433, credenciales parametrizadas via `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` (defaults: `epde`/`epde_dev_password`/`epde`)
- **Redis 7 Alpine**: puerto 6379, maxmemory 256mb, `volatile-lru` eviction (solo evicta keys con TTL)
- **pgAdmin 4**: puerto 5050, credenciales parametrizadas via `PGADMIN_EMAIL`/`PGADMIN_PASSWORD` (defaults: `admin@epde.local`/`admin`)

### GitHub Actions CI

```yaml
Jobs: lint → typecheck → build → test → test:e2e → coverage (web + API + Shared)
Enforcement (PRs): service modificado sin spec → fail
Services: PostgreSQL 16 Alpine, Redis 7 Alpine
Triggers: push a main/develop, PRs a main/develop
```

**Coverage thresholds:**

| Package | Statements | Branches | Functions | Lines |
| ------- | ---------- | -------- | --------- | ----- |
| API     | 75         | 60       | 65        | 75    |
| Shared  | 80         | 65       | 75        | 80    |
| Web     | 50         | 35       | 50        | 50    |
| Mobile  | 35         | 20       | 35        | 35    |

### GitHub Actions CD

Pipeline de deploy real:

- **Produccion** (`cd.yml`): trigger en push a `main`
  - `deploy-api`: Railway CLI → `prisma migrate deploy` → `railway up --service epde-api --detach`
  - `deploy-web`: Vercel CLI → `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`
- **Staging** (`cd-staging.yml`): trigger en push a `develop`
  - Misma pipeline con secrets de staging (`RAILWAY_TOKEN_STAGING`, `VERCEL_PROJECT_ID_STAGING`)
- Usa `environment: production/staging` con secrets
- Archivos de deploy: `apps/api/Dockerfile` (multi-stage), `railway.json` (healthcheck), `.dockerignore`

### Turborepo Pipeline

```json
{
  "build": { "outputs": [".next/**", "dist/**"] },
  "lint": { "dependsOn": ["^build"] },
  "typecheck": { "dependsOn": ["^build"] },
  "dev": { "persistent": true, "cache": false },
  "test": { "dependsOn": ["^build"] }
}
```

### Servicios Externos

| Servicio      | Uso                                         |
| ------------- | ------------------------------------------- |
| Redis 7       | Token state, blacklist, distributed locking |
| Cloudflare R2 | Almacenamiento de archivos                  |
| Resend        | Emails transaccionales                      |
| Sentry        | Monitoreo de errores (backend)              |
| OpenTelemetry | Distributed tracing (OTLP HTTP, opcional)   |
| Prometheus    | Metricas (via OpenTelemetry, puerto 9464)   |

---

## 9. Convenciones

### Archivos

| Tipo              | Convencion        | Ejemplo                          |
| ----------------- | ----------------- | -------------------------------- |
| Componentes React | kebab-case        | `invite-client-dialog.tsx`       |
| Hooks             | `use-` prefix     | `use-clients.ts`                 |
| API functions     | kebab-case        | `service-requests.ts`            |
| NestJS modules    | kebab-case dir    | `service-requests/`              |
| NestJS files      | kebab-case.suffix | `service-requests.controller.ts` |
| Zod schemas       | kebab-case        | `service-request.ts`             |
| Constantes        | SCREAMING_SNAKE   | `BUDGET_STATUS_LABELS`           |
| Enums             | PascalCase        | `BudgetStatus`                   |
| Interfaces        | PascalCase        | `CreateBudgetRequestInput`       |

### Imports

```typescript
// 1. Librerias externas
import { Injectable } from '@nestjs/common';
// 2. Shared package
import { createBudgetRequestSchema } from '@epde/shared';
// 3. Internos con alias @/
import { Button } from '@/components/ui/button';
```

### Git

- Conventional Commits: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `ci`
- Subject en minuscula, sin punto final
- Branch: `main`, `feat/<nombre>`, `fix/<nombre>`
- Pre-commit: lint-staged (ESLint + typecheck)
- Commit-msg: commitlint

---

## 10. Comandos de Desarrollo

```bash
# Instalar dependencias
pnpm install

# Levantar infraestructura
docker compose up -d

# Migraciones y seed
pnpm --filter @epde/api exec prisma migrate dev
pnpm --filter @epde/api exec prisma db seed

# Desarrollo
pnpm dev              # Web + API + Shared (watch)
pnpm dev:mobile       # Expo dev server

# Verificaciones
pnpm build            # Build completo
pnpm lint             # ESLint
pnpm typecheck        # TypeScript check
pnpm test             # API (jest) + Shared (vitest) + Web (vitest) + Mobile (jest-expo) — ~588 tests total

# Tests E2E (requiere DB + Redis)
pnpm --filter @epde/api test:e2e

# Prisma
pnpm --filter @epde/api exec prisma studio    # UI de BD
pnpm --filter @epde/api exec prisma db push   # Push schema sin migracion

# Shared package
pnpm --filter @epde/shared build              # Rebuild manual
```

### Credenciales de Desarrollo

| Rol   | Email          | Password                                                      |
| ----- | -------------- | ------------------------------------------------------------- |
| Admin | admin@epde.com | Configurable via `SEED_ADMIN_PASSWORD` (default: `Admin123!`) |

### URLs

| Servicio   | URL                                 |
| ---------- | ----------------------------------- |
| Web        | http://localhost:3000               |
| Mobile     | Expo Dev Server (puerto 8081)       |
| API        | http://localhost:3001/api/v1        |
| Swagger    | http://localhost:3001/api/docs      |
| pgAdmin    | http://localhost:5050               |
| Health     | http://localhost:3001/api/v1/health |
| Metrics    | http://localhost:9464/metrics       |
| PostgreSQL | localhost:5433                      |
