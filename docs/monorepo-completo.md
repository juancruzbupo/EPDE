# Arquitectura Completa del Monorepo

Resumen de alto nivel de la estructura, tecnologias y patrones del proyecto EPDE. Para detalles especificos, consultar la seccion **Fuentes autoritativas** al final.

---

## 1. Vision General

**EPDE** (Estudio Profesional de Diagnostico Edilicio) — plataforma de mantenimiento preventivo para viviendas residenciales. Monorepo con Turborepo + pnpm.

### Aplicaciones

| App    | Workspace      | Tecnologia              | Puerto | Descripcion                       |
| ------ | -------------- | ----------------------- | ------ | --------------------------------- |
| API    | `@epde/api`    | NestJS 11               | 3001   | REST API con auth, RBAC, cron     |
| Web    | `@epde/web`    | Next.js 15 (App Router) | 3000   | Panel admin + portal cliente      |
| Mobile | `@epde/mobile` | Expo 54 + React Native  | 8081   | App nativa (clientes + admin MVP) |
| Shared | `@epde/shared` | TypeScript + Zod + tsup | —      | Tipos, schemas, constantes, utils |

### Roles

| Rol      | Web | Mobile | Descripcion                                                       |
| -------- | --- | ------ | ----------------------------------------------------------------- |
| `ADMIN`  | Si  | Si     | Gestion completa, cotizaciones, transiciones de estado            |
| `CLIENT` | Si  | Si     | Consulta, completa tareas, aprueba presupuestos, crea solicitudes |

---

## 2. Stack Tecnologico

### Backend

NestJS 11, Prisma 6, PostgreSQL 16, Redis 7 (ioredis), Passport (JWT + Local), @nestjs/throttler, @nestjs/swagger, @nestjs/schedule, Helmet, Resend (emails), AWS S3 SDK (Cloudflare R2), Sentry, bcrypt, Jest 29.

### Frontend Web

Next.js 15, React 19, Tailwind CSS 4, shadcn/ui (new-york), TanStack React Query 5, TanStack React Table 8, Zustand 5, React Hook Form 7, Axios, Vitest 4, Framer Motion, Lucide React, date-fns 4.

### Mobile

Expo 54, React Native 0.81, Expo Router 6, NativeWind 5, TanStack React Query 5, Zustand 5, React Hook Form 7, Axios, expo-secure-store, react-native-reanimated 4.1, jest-expo.

### Shared

Zod 3.24, tsup (dual ESM + CJS), date-fns 4, Vitest 4.

### Build & Tooling

Turborepo 2, pnpm 10.6.1, TypeScript 5.9 (strict), ESLint 9 (flat config), Prettier, Husky + lint-staged + commitlint.

---

## 3. Arbol de Modulos

### API (`apps/api/src/`)

```
app.module.ts          # CoreModule + feature modules
core/                  # @Global: Sentry, Config, Throttler, Logger, BullMQ, Prisma, Redis, Health, Metrics
auth/                  # JWT + Local strategy + Token Rotation (Redis)
users/                 # User CRUD base (sin controller — expuesto via clients/)
clients/               # Gestion de clientes (ADMIN)
properties/            # CRUD propiedades + health-index + expenses + photos + certificate
professionals/         # Directorio matriculados (ADR-018). Admin-only. CRUD + assignments + payments + smart-match
maintenance-plans/     # Planes + tareas + logs + notas + reorder
tasks/                 # TaskLifecycleService + TaskNotesService (extraido de maintenance-plans)
categories/            # Categorias de mantenimiento
budgets/               # Presupuestos + respond + status changes
service-requests/      # Solicitudes + status changes (linear state machine)
notifications/         # In-app + email + push (BullMQ queues).
                       #   - notifications-handler.service.ts (facade, ~244 LOC) delega a
                       #   - handlers/{budget,service-request,task,referral,subscription,account,property-health}-handlers.ts
                       #   - handler-context.service.ts (DLQ + retry AsyncLocalStorage + sendPush, deps compartidas)
                       #   Agregar un side-effect = editar el handler del bounded context que corresponde, no el facade. Ver ADR-012
dashboard/             # Estadisticas agregadas multi-modelo + ISVSnapshot
inspections/           # Inspecciones de propiedades (CRUD + soft-delete)
upload/                # Multipart a Cloudflare R2
email/                 # Servicio Resend (invocado por notifications/)
scheduler/             # Cron jobs (distributed lock via Redis SETNX)
task-templates/        # Templates de tareas por categoria
category-templates/    # Templates de categorias
quote-templates/       # Templates de cotizacion reutilizables
landing-settings/      # Contenido dinamico de landing (GET publico + PATCH admin)
common/                # Decorators, Guards, Pipes, Filters, BaseRepository, RequestCache
config/                # Env validation (Zod)
```

### Web (`apps/web/src/`)

```
app/
  (auth)/              # Login, set-password, forgot-password, reset-password
  (dashboard)/         # Layout autenticado con sidebar
    dashboard/         # Dashboard admin/client (inverted pyramid)
    clients/           # CRUD clientes (ADMIN)
    properties/        # CRUD propiedades
    categories/        # CRUD categorias (ADMIN)
    maintenance-plans/ # Planes de mantenimiento
    tasks/             # Tareas globales
    budgets/           # Presupuestos
    service-requests/  # Solicitudes
    notifications/     # Notificaciones
    templates/         # Templates categorias + tareas (ADMIN)
    landing-settings/  # Editor contenido landing (ADMIN)
    profile/           # Perfil + cambio de contrasena
components/
  ui/                  # shadcn/ui components
  data-table/          # DataTable wrapper (TanStack Table)
  layout/              # Header, Sidebar
  landing/             # Landing page (composicion + 11 secciones)
hooks/                 # React Query hooks por entidad. use-X.ts combinado o use-X-queries.ts + use-X-mutations.ts + use-X.ts (barrel) cuando > 150 LOC — enforzado por ESLint max-lines
lib/api/               # Funciones API por entidad (wrappers del factory compartido)
lib/routes.ts          # ROUTES central — SSoT de paths web. Dynamic routes son factories tipadas (ROUTES.budget(id), ROUTES.property(id, { tab }))
stores/                # Zustand auth store
```

### Mobile (`apps/mobile/src/`)

```
app/
  (auth)/              # Login, set-password, forgot-password, reset-password
  (tabs)/              # 5 tabs: dashboard, properties, tasks, notifications, profile
  property/[id]        # Detalle propiedad + sub-components
  budget/[id]          # Detalle presupuesto + sub-components
  service-requests/[id]# Detalle solicitud + sub-components
  task/[planId]/[taskId] # Detalle tarea + logs + notas
components/            # StatusBadge, EmptyState, StatCard, HomeStatusCard, ActionList, ToastHost, etc.
hooks/                 # React Query hooks (infinite scroll) + query-stale-times.ts (STALE_TIME tiers)
lib/api/               # Endpoints por entidad
lib/toast.ts           # Non-blocking toast emitter (success/error/info)
stores/                # auth-store, theme-store (Zustand)
```

### Shared (`packages/shared/src/`)

```
types/                 # Enums, entity interfaces, API types, dashboard types, auth types
schemas/               # Zod schemas por dominio (SSoT validacion)
constants/             # Labels espanol, badge variants, design tokens, QUERY_KEYS
api/                   # API query/mutation factories: createXxxQueries(apiClient)
                       #   incluye createTaskQueries (tasks, task detail, logs, notes, mutations)
                       #   y createMaintenancePlanQueries (solo plan-level)
testing/               # Entity factories para specs (makeUser, makeTask, makePlan, etc.)
                       #   export vía @epde/shared/testing (tree-shaken en prod)
utils/                 # Date/string helpers, getErrorMessage, validateUpload
```

---

## 4. Patrones Clave

### Repository Pattern

Cada modulo tiene un repositorio que extiende `BaseRepository<T, M>` con `model` (soft-delete filter) y `writeModel` (acceso completo). Paginacion cursor-based. Servicios nunca inyectan `PrismaService` directamente (excepcion: `AuthAuditService`).

### Soft Delete (Prisma Extension)

Extension global en `PrismaService` que auto-agrega `deletedAt: null` en queries de lectura y convierte `delete` en `update({ deletedAt })`. Modelos (8): User, Property, Task, Category, BudgetRequest, ServiceRequest, InspectionChecklist, InspectionItem. `MaintenancePlan` NO es soft-deletable — usa `PlanStatus`. Dentro de `$transaction` la extensión NO aplica — enforzado por la ESLint rule `local/no-tx-without-soft-delete-filter` (ver `eslint-rules/`). El sync entre la lista del service y la del rule está validado por `packages/shared/src/__tests__/soft-deletable-models-sync.test.ts`. Para nested includes usar `ACTIVE_FILTER` de `soft-delete-include.ts`.

### Guard Composition (APP_GUARD)

4 guards en orden: ThrottlerGuard (rate limiting) -> JwtAuthGuard (valida JWT, salta `@Public()`) -> RolesGuard (deny-by-default: sin `@Roles()` ni `@Public()` = 403) -> SubscriptionGuard (verifica suscripcion activa, HTTP 402 si expirada).

### Zod Validation (SSoT)

Schemas en `@epde/shared/schemas`. Backend: `ZodValidationPipe`. Frontend: `zodResolver` con React Hook Form. No se usa class-validator.

### Notification Flow

Servicios de dominio inyectan `NotificationsHandlerService` directamente (fire-and-forget). BullMQ queues: `notification` (in-app + push) y `emails`. Sin EventEmitter.

### Auth (JWT + Token Rotation)

Login crea family UUID. Refresh tokens llevan family + generation. Reuse detection revoca toda la family. Redis almacena estado de tokens. Web: cookies HttpOnly (SameSite=strict). Mobile: Bearer + SecureStore. `rotateRefreshToken` y `revokeFamily` con 3 reintentos exponenciales (100/200/400ms) — fail-closed con HTTP 503 si Redis no responde. Fail-mode policy completa en ADR-017.

### ESLint rules custom (9)

`local/no-prisma-in-service` (services no inyectan PrismaService directo) · `local/no-tx-without-soft-delete-filter` (transacciones sobre soft-deletable models filtran `deletedAt: null`) · `local/no-soft-deletable-include-without-filter` (nested includes filtran — upgraded a error, singular relations excluidas) · `local/mobile-query-requires-stale-time` (mobile useQuery requiere staleTime explícito) · `local/no-inline-risk-threshold` (comparaciones de risk score van por `getRiskLevel()`) · `local/repository-override-must-be-documented` (overrides de BaseRepository requieren JSDoc) · `local/api-factory-must-exist` (`apps/*/src/lib/api/*.ts` consume `createXxxQueries(apiClient)` o está en exception list) · `local/no-repository-without-justification` (repos que no extienden BaseRepository requieren JSDoc con categoría ADR-011) · `local/no-hardcoded-routes` (detecta rutas hardcodeadas — usar `ROUTES.*` de `lib/routes.ts`). Más `max-lines: 150` para hooks. Tabla completa en ADR-012.

### Error Handling

`GlobalExceptionFilter`: HttpException -> status + mensaje (500+ reporta a Sentry). Excepciones de dominio tipadas (ej: `BudgetAccessDeniedError`, `TaskNotCompletableError`) con mapping a HTTP en servicios.

### State Management

**Zustand** para estado de sesion (auth-store). **TanStack React Query** para server state: hooks por entidad, `QUERY_KEYS` centralizados en `@epde/shared`, invalidacion automatica en `onSuccess`.

### API Client (Axios)

Web: proxy via Next.js rewrites (same-origin, cookies). Mobile: Bearer token directo. Ambos usan `attachRefreshInterceptor()` de `@epde/shared`.

### Cron Jobs

Jobs envueltos en `DistributedLockService.withLock()` (Redis SETNX con watchdog). Batch processing (50 items). Jobs incluyen: task status recalculation, reminders, budget expiration, ISV monthly snapshot, data cleanup, weekly summary.

### Dashboard (Inverted Pyramid)

L1: HomeStatusCard (score ISV). L2: ActionList (tareas vencidas/proximas) + AttentionNeeded (admin). L3: AnalyticsTabs/AnalyticsSection (charts).

---

## 5. Design System

### Identidad

- Fonts: DM Sans (body) + DM Serif Display (headings)
- Idioma UI: Espanol (Argentina)
- Iconos: Lucide React (web) / Emojis (mobile tabs)

### Paleta

SSoT en `@epde/shared/constants/design-tokens.ts` (`DESIGN_TOKENS_LIGHT`/`DARK`). Propagacion: `design-tokens.ts` -> `globals.css` (web) + `global.css` (mobile). Tests de drift verifican sincronizacion.

Color primario: `#C4704B` (terracotta). Tokens semanticos: `success`, `warning`, `destructive` — nunca hex directos en componentes.

### Componentes

- **Web**: shadcn/ui (estilo new-york) + componentes custom de dashboard
- **Mobile**: componentes custom (StatusBadge, EmptyState, StatCard, modales)
- **Badge variants**: compartidas web/mobile via `@epde/shared/constants/badge-variants.ts`
- **Typography (mobile)**: escala `TYPE.*` en `fonts.ts` — nunca `fonts.*` ni fontFamily inline

### Dark Mode

Web: `.dark` class + CSS variables + localStorage. Mobile: NativeWind + Zustand theme-store + AsyncStorage.

---

## 6. Base de Datos

### Motor

PostgreSQL 16, ORM Prisma 6, Docker Compose para desarrollo.

### Modelo de Datos (resumen relacional)

```
User -1:N- Property -1:1- MaintenancePlan -1:N- Task -1:N- TaskAuditLog
  |                |                                |
  |                |- BudgetRequest - BudgetLineItem / BudgetResponse
  |                |- ServiceRequest - ServiceRequestPhoto
  |                '- ISVSnapshot (monthly health snapshots)
  |
  |- TaskLog, TaskNote, Notification, PushToken

Category -1:N- Task
CategoryTemplate -1:N- TaskTemplate
QuoteTemplate -1:N- QuoteTemplateItem
CertificateCounter (singleton — numeración CERT-NNNN)

Professional -1:N- ProfessionalSpecialtyAssignment
             -1:N- ProfessionalAttachment (matrícula, seguro RC, certs)
             -1:N- ProfessionalRating
             -1:N- ProfessionalTimelineNote
             -1:N- ProfessionalTag
             -1:N- ServiceRequestAssignment -- 1:1 -- ServiceRequest
             -1:N- ProfessionalPayment
```

Detalle completo de campos, enums, indices y constraints: ver `prisma/schema.prisma` y `docs/data-model.md`.

### Soft Delete

Modelos con `deletedAt`: User, Property, Task, Category, BudgetRequest, ServiceRequest, InspectionChecklist, InspectionItem, Professional. Demas modelos usan cascade delete o son inmutables (audit trail).

### Campos monetarios

Tipo `Decimal` (no Float): BudgetLineItem y BudgetResponse.

---

## 7. API REST

| Atributo   | Valor                                                |
| ---------- | ---------------------------------------------------- |
| Base URL   | `/api/v1`                                            |
| Swagger    | `/api/docs`                                          |
| Auth       | JWT cookies (web) / Bearer (mobile)                  |
| Rate limit | Configurable por grupo (login, upload, set-password) |

### Formato de Respuesta

- **Paginada**: `{ data: T[], nextCursor, hasMore, total }`
- **Singular**: `{ data: T }`
- **Mutacion**: `{ data: T | null, message }`
- **Error**: `{ statusCode, message, error }`

Listado completo de endpoints: ver `docs/api-reference.md`.

---

## 8. Infraestructura & DevOps

### Docker Compose (desarrollo)

PostgreSQL 16 (:5433), Redis 7 Alpine (:6379, volatile-lru), pgAdmin 4 (:5050).

### CI/CD (GitHub Actions)

- `ci-reusable.yml`: build -> schema-drift -> lint -> typecheck -> test -> test:e2e -> coverage
- `ci.yml`: push/PR a main/develop (coverage + spec enforcement + Playwright)
- `cd.yml`: deploy produccion (Render API + Vercel web) + health check
- `cd-staging.yml`: deploy staging desde develop

### Branch Strategy

`develop` (trabajo diario, CD staging) -> `main` (produccion, CD prod).

### Servicios Externos

| Servicio      | Uso                                      |
| ------------- | ---------------------------------------- |
| Redis 7       | Token state, blacklist, distributed lock |
| Cloudflare R2 | Almacenamiento de archivos               |
| Resend        | Emails transaccionales                   |
| Sentry        | Monitoreo de errores                     |
| OpenTelemetry | Distributed tracing (opcional)           |
| Prometheus    | Metricas custom (via OpenTelemetry)      |

---

## 9. Convenciones

| Tipo              | Convencion        | Ejemplo                          |
| ----------------- | ----------------- | -------------------------------- |
| Componentes React | kebab-case        | `invite-client-dialog.tsx`       |
| Hooks             | `use-` prefix     | `use-clients.ts`                 |
| NestJS files      | kebab-case.suffix | `service-requests.controller.ts` |
| Constantes        | SCREAMING_SNAKE   | `BUDGET_STATUS_LABELS`           |
| Enums             | PascalCase        | `BudgetStatus`                   |

**Imports**: 1) librerias externas, 2) `@epde/shared` (barrel, nunca sub-paths), 3) internos con `@/`.

**Git**: Conventional Commits, branch `main`/`feat/<nombre>`/`fix/<nombre>`, pre-commit lint-staged, commitlint.

---

## 10. Comandos de Desarrollo

```bash
pnpm install                                    # Instalar dependencias
docker compose up -d                            # Levantar infra
pnpm --filter @epde/api exec prisma migrate dev # Migraciones
pnpm --filter @epde/api exec prisma db seed     # Seed
pnpm dev                                        # Web + API + Shared (watch)
pnpm dev:mobile                                 # Expo dev server
pnpm build                                      # Build completo
pnpm lint                                       # ESLint
pnpm typecheck                                  # TypeScript check
pnpm test                                       # Todos los tests
pnpm --filter @epde/api test:e2e                # E2E (requiere DB + Redis)
```

| Servicio | URL                            |
| -------- | ------------------------------ |
| Web      | http://localhost:3000          |
| API      | http://localhost:3001/api/v1   |
| Swagger  | http://localhost:3001/api/docs |
| pgAdmin  | http://localhost:5050          |

---

## 11. Fuentes Autoritativas

Estos archivos son la fuente de verdad para cada dominio. Consultar en lugar de confiar en valores hardcoded en este documento:

| Fuente                                            | Contenido                                                                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                   | Modelo de datos completo (modelos, enums, relaciones, indices, constraints)                                                             |
| `docs/ai-development-guide.md`                    | Patrones de desarrollo, reglas SIEMPRE/NUNCA, guia para IA                                                                              |
| `docs/api-reference.md`                           | Endpoints API completos con parametros y respuestas                                                                                     |
| `docs/data-model.md`                              | Documentacion detallada de entidades y campos                                                                                           |
| `docs/architecture.md`                            | Arquitectura de modulos y decisiones de diseno                                                                                          |
| `packages/shared/src/`                            | Tipos, schemas Zod, constantes, API factories — SSoT compartido                                                                         |
| `packages/shared/src/constants/design-tokens.ts`  | Paleta de colores y tokens de diseno (SSoT)                                                                                             |
| `packages/shared/src/constants/badge-variants.ts` | Variantes de Badge compartidas web/mobile                                                                                               |
| `packages/shared/src/constants/`                  | Modularizado: `enum-labels.ts`, `app-config.ts`, `query-keys.ts`, `engagement.ts`, `category-defaults.ts`. `index.ts` es puro re-export |
