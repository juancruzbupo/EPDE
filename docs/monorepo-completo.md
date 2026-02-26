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
│       └── cd.yml                    # Deploy template (API + Web)
├── .husky/
│   ├── pre-commit                    # lint-staged
│   └── commit-msg                    # commitlint
├── apps/
│   ├── api/                          # ── @epde/api ──────────────────────
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 14 modelos, 11 enums
│   │   │   ├── seed.ts               # Admin + 10 categorias default
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── main.ts               # Bootstrap (Helmet, CORS, Swagger, Cookies)
│   │   │   ├── instrument.ts         # Sentry instrumentation
│   │   │   ├── app.module.ts         # Root module (imports todos los features + logging pino)
│   │   │   ├── auth/                 # JWT + Local strategy + Token Rotation (Redis)
│   │   │   │   ├── token.service.ts # Token pairs, rotation, blacklist, reuse detection
│   │   │   │   └── strategies/
│   │   │   ├── users/                # User CRUD base
│   │   │   ├── clients/              # Gestion de clientes (ADMIN)
│   │   │   ├── properties/           # CRUD propiedades
│   │   │   ├── maintenance-plans/    # Planes + tareas + logs + notas
│   │   │   ├── categories/           # Categorias de mantenimiento
│   │   │   ├── budgets/              # Presupuestos (ciclo completo)
│   │   │   ├── service-requests/     # Solicitudes + fotos
│   │   │   ├── tasks/                # Gestion de tareas
│   │   │   ├── notifications/        # Sistema de notificaciones
│   │   │   ├── dashboard/            # Estadisticas agregadas
│   │   │   ├── email/                # Servicio de emails (Resend)
│   │   │   ├── upload/               # Upload a Cloudflare R2
│   │   │   ├── scheduler/            # Cron jobs (3 diarios, distributed lock)
│   │   │   ├── redis/                # RedisModule (global) + DistributedLockService
│   │   │   ├── health/              # HealthModule (@nestjs/terminus, DB + Redis)
│   │   │   ├── metrics/             # MetricsModule (OpenTelemetry, Prometheus :9464)
│   │   │   ├── prisma/               # PrismaService + soft-delete extension
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
│   │   │   │       ├── budgets/      # Presupuestos
│   │   │   │       ├── service-requests/  # Solicitudes
│   │   │   │       └── notifications/     # Notificaciones
│   │   │   ├── components/
│   │   │   │   ├── ui/               # 18 componentes shadcn/ui
│   │   │   │   ├── data-table/       # DataTable wrapper (TanStack Table)
│   │   │   │   ├── layout/           # Header, Sidebar
│   │   │   │   └── landing/          # Secciones de la landing
│   │   │   ├── hooks/                # React Query hooks por entidad
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts     # Axios + 401 refresh interceptor
│   │   │   │   ├── style-maps.ts     # Mapas de variantes (Badge colors)
│   │   │   │   └── api/              # Funciones API por entidad
│   │   │   ├── providers/            # QueryProvider, AuthProvider
│   │   │   └── stores/               # Zustand auth store
│   │   ├── middleware.ts             # Proteccion de rutas (cookie check)
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
│       │   │   ├── (tabs)/           # 5 tabs (dashboard, properties, budgets, notifs, profile)
│       │   │   ├── property/[id].tsx # Detalle propiedad + tareas
│       │   │   ├── budget/[id].tsx   # Detalle presupuesto + items
│       │   │   ├── service-requests/ # Lista y detalle
│       │   │   └── task/[planId]/[taskId].tsx  # Tarea + logs + notas
│       │   ├── components/           # StatusBadge, EmptyState, StatCard, ErrorBoundary
│       │   ├── hooks/                # React Query hooks (infinite scroll)
│       │   ├── lib/
│       │   │   ├── api-client.ts     # Axios + token refresh + auto-detect URL
│       │   │   ├── token-service.ts  # Expo SecureStore abstraction
│       │   │   ├── query-persister.ts # AsyncStorage persister (offline cache)
│       │   │   ├── auth.ts           # Auth API functions
│       │   │   └── api/              # Endpoints por entidad
│       │   ├── stores/               # Zustand auth store
│       │   └── global.css            # Tokens NativeWind
│       ├── assets/                   # Iconos, splash
│       ├── app.json                  # Expo config (com.epde.mobile)
│       ├── metro.config.js           # Metro + NativeWind
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
│       │   │   ├── task.ts           # Task schemas
│       │   │   ├── budget.ts         # Budget request/response schemas
│       │   │   └── service-request.ts
│       │   ├── constants/
│       │   │   └── index.ts          # Labels en espanol, defaults, mappings
│       │   └── utils/                # Date/string helpers
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

| Tecnologia            | Version | Uso                                  |
| --------------------- | ------- | ------------------------------------ |
| NestJS                | 11      | Framework REST API                   |
| Prisma                | 6       | ORM + migraciones                    |
| PostgreSQL            | 16      | Base de datos                        |
| Redis                 | 7       | Cache, token state, distributed lock |
| ioredis               | 5.9     | Redis client para Node.js            |
| Passport              | -       | Autenticacion (JWT + Local strategy) |
| @nestjs/jwt           | -       | JWT tokens (access 15m, refresh 7d)  |
| CASL                  | 6.8     | Autorizacion role-based              |
| @nestjs/throttler     | 6.5     | Rate limiting                        |
| @nestjs/swagger       | 11.2    | Documentacion OpenAPI                |
| @nestjs/schedule      | 6.1     | Cron jobs                            |
| @nestjs/event-emitter | 3.0     | Comunicacion event-driven            |
| Helmet                | 8.1     | Headers de seguridad                 |
| Resend                | 6.9     | Envio de emails transaccionales      |
| AWS S3 SDK            | -       | Upload a Cloudflare R2               |
| Sentry                | 10.40   | Monitoreo de errores                 |
| bcrypt                | 6.0     | Hash de passwords (12 rounds)        |
| Jest                  | 29      | Testing unitario                     |

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

Cada modulo tiene un repositorio que extiende `BaseRepository<T>`:

```typescript
export class BaseRepository<T> {
  protected model; // Con filtro soft-delete (deletedAt: null)
  protected writeModel; // Sin filtro (acceso completo)

  async findMany(params): Promise<PaginatedResult<T>>;
  async findById(id, include?): Promise<T | null>;
  async create(data, include?): Promise<T>;
  async update(id, data, include?): Promise<T>;
  async delete(id): Promise<T>;
}
```

- **Servicios NO inyectan PrismaService** — solo los repositorios acceden a datos
- Paginacion cursor-based: `{ data, nextCursor, hasMore, total }`

### P2: Soft Delete (Prisma Extension)

Extension global en `PrismaService`:

- `findMany/findFirst/findUnique/count` → auto-agregan `where: { deletedAt: null }`
- Condicion: `!('deletedAt' in (args.where || {}))` — chequea **presencia de clave**, no valor
- `delete` → se convierte en `update({ deletedAt: new Date() })`
- Modelos afectados: `User`, `Property`, `Task`
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

### P4: Guard Composition

Tres guards globales en orden via `APP_GUARD`:

1. **JwtAuthGuard** — Valida JWT. Salta `@Public()` endpoints
2. **RolesGuard** — Verifica `user.role` contra `@Roles()`. Sin decorator = permite todo
3. **ThrottlerGuard** — Rate limiting (10/s corto, 60/10s medio, 5/min login)

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

### P7: Event-Driven Communication

`EventEmitter2` para operaciones asincronas entre modulos:

| Evento                  | Emisor                 | Accion                        |
| ----------------------- | ---------------------- | ----------------------------- |
| `service.created`       | ServiceRequestsService | Notificacion + email al admin |
| `service.statusChanged` | ServiceRequestsService | Notificacion al cliente       |
| `budget.created`        | BudgetsService         | Notificacion + email al admin |
| `budget.statusChanged`  | BudgetsService         | Notificacion al cliente       |
| `client.invited`        | ClientsService         | Email de invitacion           |

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
- Redis almacena `rt:{family}` con generation actual (TTL 7d) y `bl:{jti}` para blacklist. La rotacion usa Lua script atomico
- Implementado en `auth/token.service.ts`
- Web: cookies HttpOnly (el browser las envia automaticamente)
- Mobile: Bearer token en header (SecureStore para persistencia)
- Passwords: bcrypt 12 rounds
- Invitacion: JWT temporal + link `/set-password`

### P10: File Upload (Presigned URL)

```
Cliente → POST /upload/presigned-url → { url, key }
       → PUT presigned-url (upload directo a R2)
       → Usar key/URL en el form del recurso
```

Mobile usa un flujo alternativo con `POST /upload` (multipart/form-data).

### P11: Cron Jobs (Distributed Lock)

Tres jobs diarios (09:00-09:10 UTC), cada uno envuelto en `DistributedLockService.withLock()` (Redis SETNX, TTL 5min):

1. **task-status-recalculation**: PENDING → UPCOMING (30 dias) → OVERDUE
2. **task-upcoming-reminders**: Notificaciones + email para tareas proximas/vencidas
3. **task-safety-sweep**: Correccion de edge cases en tareas completadas

Lock key pattern: `lock:cron:<job-name>`. Previene ejecucion concurrente en deployments multi-instancia.

### P12: State Management (Web + Mobile)

**Zustand** (client state):

- `auth-store`: user, isAuthenticated, isLoading, login(), logout()
- Minimo — solo para estado de sesion

**TanStack React Query** (server state):

- Hooks por entidad: `use-properties`, `use-budgets`, `use-notifications`, etc.
- `useQuery` para lectura, `useMutation` para escritura
- Query keys: `['entity', ...params]`
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

Casos de uso: token rotation (families), token blacklist (JTIs), distributed lock (cron jobs).

---

## 5. Design System

### Identidad de Marca

| Atributo     | Valor                                              |
| ------------ | -------------------------------------------------- |
| Nombre       | EPDE — Estudio Profesional de Diagnostico Edilicio |
| Body font    | DM Sans (Google Fonts)                             |
| Heading font | Playfair Display (Google Fonts, serif)             |
| Idioma UI    | Espanol (Argentina)                                |
| Iconos       | Lucide React (web) / Emojis (mobile tabs)          |

### Paleta de Colores

#### Light Mode (default)

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

#### Dark Mode (web only)

| Token        | Hex       |
| ------------ | --------- |
| `primary`    | `#D4956F` |
| `secondary`  | `#3D3835` |
| `background` | `#1A1715` |
| `foreground` | `#F5F0EB` |

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
  --font-heading: 'Playfair Display', serif;
  --radius-sm: calc(var(--radius) - 4px);
}

:root {
  --radius: 0.625rem;
  --primary: #c4704b;
  /* ... */
}
```

**Mobile** (`global.css`): Usa `@theme inline` directamente con NativeWind:

```css
@theme inline {
  --color-primary: #c4704b;
  --color-background: #fafaf8;
  --radius: 0.625rem;
}
```

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

### Style Maps (Variantes de Badge)

Centralizados en `lib/style-maps.ts` (web) y `components/status-badge.tsx` (mobile):

| Map                   | Entidad      | Valores                                                       |
| --------------------- | ------------ | ------------------------------------------------------------- |
| `taskStatusVariant`   | Tareas       | PENDING, UPCOMING, OVERDUE, COMPLETED                         |
| `priorityColors`      | Tareas       | LOW (verde), MEDIUM (amarillo), HIGH (naranja), URGENT (rojo) |
| `budgetStatusVariant` | Presupuestos | 6 estados con colores                                         |
| `urgencyVariant`      | Solicitudes  | LOW, MEDIUM, HIGH, URGENT                                     |
| `clientStatusVariant` | Clientes     | INVITED, ACTIVE, INACTIVE                                     |

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

### Modelo de Datos (14 entidades)

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
  └─1:N─ Notification

Category ─1:N─ Task
```

### Enums (11)

`UserRole`, `UserStatus`, `PropertyType`, `PlanStatus`, `TaskPriority`, `RecurrenceType`, `TaskStatus`, `BudgetStatus`, `ServiceUrgency`, `ServiceStatus`, `NotificationType`

### Soft Delete

Modelos con `deletedAt: DateTime?`: User, Property, Task. Condicion: `!('deletedAt' in ...)` para chequear presencia de clave.

### Tipos Decimal

Campos monetarios usan `Decimal` (no Float): `BudgetLineItem.quantity` (12,4), `.unitPrice` (12,2), `.subtotal` (14,2), `BudgetResponse.totalAmount` (14,2).

### Campos de Auditoria

`BudgetRequest.updatedBy` y `ServiceRequest.updatedBy`: ID del usuario que realizo el ultimo cambio de estado.

### Cascade Deletes

- `BudgetLineItem` → on delete `BudgetRequest`
- `BudgetResponse` → on delete `BudgetRequest`
- `ServiceRequestPhoto` → on delete `ServiceRequest`

---

## 7. API REST

### Configuracion

| Atributo   | Valor                               |
| ---------- | ----------------------------------- |
| Base URL   | `http://localhost:3001/api/v1`      |
| Swagger    | `http://localhost:3001/api/docs`    |
| Auth       | JWT cookies (web) / Bearer (mobile) |
| Rate limit | 10/s, 60/10s, 5/min (login)         |

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
10. **Upload** — presigned URLs para R2
11. **Dashboard** — stats, upcoming-tasks, recent-activity

### Formato de Respuesta

**Paginada**: `{ data: T[], nextCursor: string|null, hasMore: boolean, total: number }`
**Singular**: Objeto directo (sin wrapper)
**Error**: `{ statusCode: number, message: string|string[], error: string }`

---

## 8. Infraestructura & DevOps

### Docker Compose (desarrollo)

- **PostgreSQL 16**: puerto 5433, user `epde`, db `epde_dev`
- **Redis 7 Alpine**: puerto 6379, maxmemory 256mb, LRU eviction
- **pgAdmin 4**: puerto 5050, admin@epde.local

### GitHub Actions CI

```yaml
Jobs: lint → typecheck → build → test → test:e2e
Services: PostgreSQL 16 Alpine, Redis 7 Alpine
Triggers: push a main, PRs
```

### GitHub Actions CD

Template de deploy (`cd.yml`):

- Trigger: push a `main`
- Jobs: `deploy-api` (build + prisma migrate deploy), `deploy-web` (build)
- Usa `environment: production` con secrets

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
pnpm test             # Jest (API --runInBand) + Vitest (shared)

# Tests E2E (requiere DB + Redis)
pnpm --filter @epde/api test:e2e

# Prisma
pnpm --filter @epde/api exec prisma studio    # UI de BD
pnpm --filter @epde/api exec prisma db push   # Push schema sin migracion

# Shared package
pnpm --filter @epde/shared build              # Rebuild manual
```

### Credenciales de Desarrollo

| Rol   | Email          | Password  |
| ----- | -------------- | --------- |
| Admin | admin@epde.com | Admin123! |

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
