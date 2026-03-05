# Guia de Desarrollo para AI — EPDE

> **Este documento es la referencia autoritativa para cualquier AI que trabaje en el proyecto.**
> Seguir estos patrones al pie de la letra garantiza consistencia y calidad.
> Ultima actualizacion: Marzo 2026.

---

## 1. Reglas Absolutas

### SIEMPRE

1. **Usar `@epde/shared` como unico SSoT** — Schemas Zod, tipos, enums, constantes y utils se definen SOLO en el shared package
2. **Validar con Zod** — Backend usa `ZodValidationPipe`, frontend usa `zodResolver`. No usar class-validator
3. **Usar enums del shared** — `UserRole.ADMIN` en vez de `'ADMIN'`, `BudgetStatus.PENDING` en vez de `'PENDING'`
4. **Repository pattern** — Solo los repositorios inyectan `PrismaService`. Los services inyectan repositorios
5. **Soft-delete** — Los modelos User, Property, Task, Category, BudgetRequest y ServiceRequest usan soft-delete via Prisma extension. Verificar el flag `softDeletable` en el constructor del repo
6. **Error handling con try-catch** — Event handlers, cron jobs, y operaciones Redis SIEMPRE envueltos en try-catch
7. **Toast en mutations** — Toda `useMutation` en web DEBE tener `onError` con `toast.error()` usando `getErrorMessage()`
8. **Cursor-based pagination** — Todas las listas usan `{ data, nextCursor, hasMore, total }`. NUNCA offset-based
9. **Idioma: Espanol (Argentina)** — Toda la UI, mensajes de error Zod, labels y toasts en espanol
10. **Tests para cada service** — Todo `*.service.ts` nuevo DEBE tener un `*.service.spec.ts` con mocks de repositorios
11. **Invalidar queries especificamente** — En `onSuccess` de mutations, invalidar solo las query keys afectadas. Dashboard: sub-keys especificas (`['dashboard', 'stats']`), no todo `['dashboard']`
12. **Commit style** — Conventional commits en minuscula: `fix: add user validation`, `feat(web): add status filters`
13. **Accesibilidad** — Botones icon-only con `aria-label`, `htmlFor`/`id` en labels de formulario, `role="button"` + `tabIndex={0}` + `onKeyDown` en divs clickeables, focus ring (`focus-visible:ring-ring/50 focus-visible:ring-[3px]`) en elementos interactivos custom
14. **HTML semantico** — `<nav aria-label>` en navegacion, `aria-current="page"` en link activo, `<ul>/<li>` para listas, `role="status"` en loading, `aria-expanded` en colapsables
15. **Tokens del design system** — Usar `text-destructive` (no `text-red-600`), `bg-destructive/10` (no `bg-red-50`), `bg-background` (no `bg-white`). Los style-maps importan variantes de Badge desde `@epde/shared/constants/badge-variants`
16. **`ParseUUIDPipe` en todos los path params de ID** — Todos los endpoints con `:id`, `:taskId`, `:categoryId`, etc. usan `@Param('id', ParseUUIDPipe) id: string` (como clase, sin `new`). Retorna HTTP 400 ante UUIDs inválidos en lugar de propagar un error Prisma (HTTP 500). Nunca omitir el pipe en path params de entidad.
17. **`maxPages` en infinite queries** — Todo `useInfiniteQuery` (web y mobile) DEBE incluir `maxPages: 10` para acotar memoria. Sin este limite, listas infinitas acumulan paginas indefinidamente
18. **Ownership Pattern en endpoints CLIENT** — Todo endpoint CLIENT-accessible DEBE filtrar por `userId` en la capa de service. Para listados: `where.property = { userId: user.id }`. Para getById: verificar `resource.userId === user.id` o `resource.property.userId === user.id` y lanzar `ForbiddenException` si no coincide. `BaseRepository.findById()` es owner-agnostic por diseno — la verificacion es responsabilidad del service
19. **Rutas URL en ingles** — Las rutas URL de la web usan ingles: `/maintenance-plans`, `/tasks`, `/budgets`, `/properties`. Los display strings (PageHeader, sidebar labels, breadcrumbs) van en espanol. NUNCA mezclar: si la ruta es `/tasks`, el breadcrumb es "Tareas"
20. **`@Roles()` en todos los endpoints autenticados** — Todo endpoint no-`@Public()` DEBE tener `@Roles(UserRole.ADMIN)`, `@Roles(UserRole.CLIENT, UserRole.ADMIN)`, o `@Roles(UserRole.CLIENT)` explicito. El RolesGuard deniega por defecto si no hay decorator — esto es intencional para prevenir escalation of privilege silencioso
21. **`PrismaModule` global provee `PrismaService`** — NUNCA registrar `PrismaService` en `providers[]` de modulos individuales. `PrismaModule` es `@Global()` y se importa una sola vez en `AppModule`. Cada modulo recibe la misma instancia via DI
22. **Badge variants usan tokens semanticos** — La variante `success` usa `bg-success/15 text-success` (web) y `bg-success/15 text-success` (mobile). NUNCA usar colores raw como `bg-green-100 text-green-800`
23. **Upload validation client-side obligatoria** — Usar `validateUpload(mimeType, sizeBytes)` de `@epde/shared` antes de enviar al API. Web y mobile deben validar MIME type y tamano

### NUNCA

1. **NUNCA inyectar `PrismaService` en un service** — Solo repositorios acceden a datos. Tampoco registrar `PrismaService` en `providers[]` de modulos — viene del `PrismaModule` global
2. **NUNCA usar `localStorage` para tokens** — Web usa cookies HttpOnly, mobile nativo usa SecureStore, mobile web usa sessionStorage
3. **NUNCA usar class-validator o class-transformer** — Eliminados del proyecto
4. **NUNCA usar magic strings para roles/status** — Importar de `@epde/shared`
5. **NUNCA crear interfaces duplicadas en frontend** — Importar de `@epde/shared/types`
6. **NUNCA hacer `queryClient.invalidateQueries({ queryKey: ['dashboard'] })` sin sub-key**
7. **NUNCA hacer fallback silencioso en validaciones** — Lanzar excepcion si input es invalido
8. **NUNCA loguear tokens o passwords en plaintext**
9. **NUNCA usar `any` sin justificacion documentada** — Preferir tipos especificos
10. **NUNCA usar `Float` para montos** — Usar `Decimal` en Prisma para precision monetaria
11. **NUNCA usar colores raw de Tailwind para estados** — `text-red-600` → `text-destructive`, `bg-red-50` → `bg-destructive/10`, `bg-white` → `bg-background`
12. **NUNCA crear botones icon-only sin `aria-label`** — Screen readers necesitan texto descriptivo
13. **NUNCA crear `<Label>` sin `htmlFor` vinculado a un `id`** — Accesibilidad de formularios
14. **NUNCA usar `useInfiniteQuery` sin `maxPages`** — Acotar siempre a `maxPages: 10`
15. **NUNCA usar debounce inline** — Usar el hook `useDebounce(value, delay)` de `@/hooks/use-debounce`
16. **NUNCA dejar un endpoint sin `@Roles()` ni `@Public()`** — RolesGuard deniega por defecto. Un endpoint sin decorator retorna 403 para cualquier usuario autenticado
17. **`QUERY_KEYS` es SSoT en `@epde/shared`** — Importar siempre desde `@epde/shared`, nunca redefinir localmente

---

## 2. Shared Package (`@epde/shared`)

### 2.1 Schema Zod

Cada entidad tiene schemas de creacion, actualizacion y filtros. Los tipos se infieren con `z.infer`:

```typescript
// packages/shared/src/schemas/budget.ts
import { z } from 'zod';

export const createBudgetRequestSchema = z.object({
  propertyId: z.string().uuid('ID de propiedad inválido'),
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede superar 200 caracteres'),
  description: z.string().max(2000).optional(),
});
export type CreateBudgetRequestInput = z.infer<typeof createBudgetRequestSchema>;

// Filtros con cursor pagination
export const budgetFiltersSchema = z.object({
  status: z
    .enum(['PENDING', 'QUOTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'])
    .optional(),
  propertyId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
});
export type BudgetFiltersInput = z.infer<typeof budgetFiltersSchema>;
```

**Reglas:**

- Mensajes de error en espanol
- `z.coerce.number()` para inputs de formulario (string → number)
- `z.string().date()` para fechas (no `.datetime()`)
- Exportar siempre schema + type inferido
- Registrar en `schemas/index.ts`

### 2.2 Enums

Patron `const + type union` (no TypeScript `enum`):

```typescript
// packages/shared/src/types/enums.ts
export const UserRole = { CLIENT: 'CLIENT', ADMIN: 'ADMIN' } as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const BudgetStatus = {
  PENDING: 'PENDING',
  QUOTED: 'QUOTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
export type BudgetStatus = (typeof BudgetStatus)[keyof typeof BudgetStatus];

// Enum value arrays — SSoT para z.enum() en schemas (evita duplicar Object.values localmente)
export const TASK_TYPE_VALUES = Object.values(TaskType) as [string, ...string[]];
export const RECURRENCE_TYPE_VALUES = Object.values(RecurrenceType) as [string, ...string[]];
export const PROFESSIONAL_REQUIREMENT_VALUES = Object.values(ProfessionalRequirement) as [
  string,
  ...string[],
];
```

### 2.3 Entity Types

```typescript
// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface SoftDeletable {
  deletedAt: Date | null;
}

// Serialized<T> — convierte Date → string para respuestas JSON
type SerializedValue<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Array<SerializedValue<U>>
    : T extends object
      ? Serialized<T>
      : T;
export type Serialized<T> = { [K in keyof T]: SerializedValue<T[K]> };

// Public types — excluyen campos sensibles
export type UserPublic = Omit<User, 'passwordHash'>;

// Brief types — para relaciones anidadas en listados
export interface UserBrief {
  id: string;
  name: string;
}
export interface PropertyBrief {
  id: string;
  address: string;
  city: string;
}
```

### 2.4 Constantes

Labels en espanol centralizados:

```typescript
// packages/shared/src/constants/index.ts
export const BUDGET_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  QUOTED: 'Cotizado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
} satisfies Record<BudgetStatus, string>;
// Los 16 label maps + 7 badge variant maps usan `satisfies Record<EnumType, string>` para exhaustividad

export const BCRYPT_SALT_ROUNDS = 12;
export const PAGINATION_DEFAULT_TAKE = 20;
export const PAGINATION_MAX_TAKE = 100;
```

Query keys centralizados en `@epde/shared` (SSoT para web y mobile):

```typescript
// packages/shared/src/constants/index.ts
export const QUERY_KEYS = {
  budgets: 'budgets',
  dashboard: 'dashboard',
  clients: 'clients',
  properties: 'properties',
  serviceRequests: 'service-requests',
  notifications: 'notifications',
  plans: 'plans',
  categories: 'categories',
  categoryTemplates: 'category-templates',
  taskTemplates: 'task-templates',
  taskDetail: 'task-detail',
  taskLogs: 'task-logs',
  taskNotes: 'task-notes',
} as const;
// Import: import { QUERY_KEYS } from '@epde/shared';
```

Badge variants compartidas entre web y mobile:

```typescript
// packages/shared/src/constants/badge-variants.ts
export const TASK_STATUS_VARIANT = { COMPLETED: 'success', OVERDUE: 'destructive', ... };
export const BUDGET_STATUS_VARIANT = { APPROVED: 'success', REJECTED: 'destructive', ... };
export const PLAN_STATUS_VARIANT = { DRAFT: 'secondary', ACTIVE: 'default', ARCHIVED: 'outline' };
// + SERVICE_STATUS_VARIANT, URGENCY_VARIANT, PRIORITY_VARIANT, CLIENT_STATUS_VARIANT
```

### 2.5 Design Tokens — SSoT

`@epde/shared` exporta desde `constants/design-tokens.ts`:

- `DESIGN_TOKENS_LIGHT` / `DESIGN_TOKENS_DARK` — colores de marca (SSoT)
- `TASK_TYPE_TOKENS_LIGHT` / `TASK_TYPE_TOKENS_DARK` — 9 colores de tipo de tarea (inspection, cleaning, test, treatment, sealing, lubrication, adjustment, measurement, evaluation)

Al agregar o cambiar un color:

1. Actualizar el token correspondiente en shared (`DESIGN_TOKENS_*` o `TASK_TYPE_TOKENS_*`)
2. Propagar manualmente a `apps/web/src/app/globals.css` (`:root` y `.dark`)
3. Propagar manualmente a `apps/mobile/src/global.css` (`@theme inline`)

Los tests `css-tokens.test.ts` en web y mobile verifican tanto la **existencia** como los **valores** de cada token contra `DESIGN_TOKENS_LIGHT`/`DARK` y `TASK_TYPE_TOKENS_LIGHT`/`DARK`.

### 2.6 staleTime Policy (React Query)

Regla para cuándo aplicar `staleTime` en hooks de React Query:

| Tipo de hook            | staleTime               | Razón                                                       |
| ----------------------- | ----------------------- | ----------------------------------------------------------- |
| Dashboard hooks         | `2 * 60 * 1000` (2 min) | Datos cambian infrecuentemente, usuario navega tabs seguido |
| Listados con paginación | default (0)             | Siempre fresh al navegar — cambios frecuentes por CRUD      |
| Detail views            | default (0)             | Siempre fresh — dato individual puede cambiar entre vistas  |

Aplicar en **web y mobile** por igual. Si un hook tiene `staleTime` en web, su equivalente mobile DEBE tenerlo también.

### 2.7 Limitaciones Conocidas

**BaseRepository `create`/`update` con generics opcionales:**
`BaseRepository<T, M, TCreateInput = unknown, TUpdateInput = unknown>` acepta generics para tipar `create()` y `update()`. Ejemplo: `BudgetsRepository extends BaseRepository<BudgetRequest, 'budgetRequest', Prisma.BudgetRequestCreateInput, Prisma.BudgetRequestUpdateInput>`. Si no se especifican, defaults a `unknown` (retrocompatible). La validación Zod sigue siendo el gate de entrada obligatorio en el controller.

**Mobile API URL resuelta en build time:**
`EXPO_PUBLIC_API_URL` se resuelve en build time via `babel-plugin-transform-inline-environment-variables`. Cambiar la URL de produccion requiere un nuevo build + OTA update o store release. Para migraciones de dominio, considerar Expo Updates (OTA) como canal de actualizacion rapida. Largo plazo: evaluar remote config (Firebase Remote Config).

---

## 3. API (`@epde/api`) — NestJS

### 3.1 Estructura de Feature Module

Cada feature sigue esta estructura exacta:

```
apps/api/src/<feature>/
  <feature>.module.ts         # Imports, providers, controllers, exports
  <feature>.controller.ts     # Endpoints REST con decorators
  <feature>.service.ts        # Logica de negocio (inyecta repos, NO PrismaService)
  <feature>.repository.ts     # Acceso a datos (unico que inyecta PrismaService)
  <feature>.service.spec.ts   # Unit tests con mocks de repos
```

**Excepciones:** No todos los modulos requieren las 4 piezas. Ver tabla de excepciones en `docs/architecture.md`. Ejemplos: `users` (sin controller), `upload` (sin repository), `email` (sin controller ni repository). **CI enforce:** Si modificas un `*.service.ts`, DEBE existir su `*.service.spec.ts`.

**Dependencia circular `TasksModule` ↔ `MaintenancePlansModule`:** `TasksModule` importa `MaintenancePlansModule` via `forwardRef(() => MaintenancePlansModule)` y viceversa. `MaintenancePlansModule` exporta `MaintenancePlansRepository`. NUNCA registrar `MaintenancePlansRepository` directamente en `TasksModule.providers[]` — importar el modulo via `forwardRef`.

### 3.2 Repository Pattern

```typescript
// Ejemplo: apps/api/src/budgets/budgets.repository.ts
@Injectable()
export class BudgetsRepository extends BaseRepository<BudgetRequest, 'budgetRequest'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'budgetRequest', false); // false = sin soft-delete
  }

  // Override findMany con include personalizado
  async findMany(params: FindManyParams = {}) {
    return super.findMany({ ...params, include: BUDGET_LIST_INCLUDE });
  }

  // Metodos custom para operaciones complejas
  async createResponseWithItems(budgetId: string, data: RespondBudgetInput) {
    return this.prisma.$transaction(async (tx) => {
      // ... transaccion atomica
    });
  }
}
```

**BaseRepository provee:**

- `findById(id, include?)` — usa `findUnique` (PK index)
- `findMany({ where, include, cursor, take })` — cursor-based, `take` clampeado 1-100
- `create(data, include?)`, `update(id, data, include?)`
- `softDelete(id)` — solo si `hasSoftDelete=true`
- `count(where?)`

**Dual-model pattern:**

- `this.model` — queries con filtro soft-delete automatico (`deletedAt: null`)
- `this.writeModel` — acceso directo sin filtro (para encontrar soft-deleted)

**Modelos con soft-delete:** User (`true`), Property (`true`), Task (`true`), Category (`true`), BudgetRequest (`true`), ServiceRequest (`true`)

### 3.3 Service Pattern

```typescript
// Ejemplo: apps/api/src/budgets/budgets.service.ts
@Injectable()
export class BudgetsService {
  constructor(
    private readonly repository: BudgetsRepository, // datos
    private readonly propertiesRepository: PropertiesRepository, // cross-module
    private readonly notificationsHandler: NotificationsHandlerService, // fire-and-forget
  ) {}

  async listBudgets(filters: BudgetFiltersInput, user: CurrentUserPayload) {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;

    // CLIENT solo ve sus presupuestos
    if (user.role === UserRole.CLIENT) {
      where.property = { userId: user.id };
    }

    return this.repository.findMany({ where, cursor: filters.cursor, take: filters.take });
  }

  async getBudget(id: string, user: CurrentUserPayload) {
    const budget = await this.repository.findById(id, BUDGET_DETAIL_INCLUDE);
    if (!budget) throw new NotFoundException('Presupuesto no encontrado');

    // Check ownership para CLIENT
    if (user.role === UserRole.CLIENT && budget.property?.userId !== user.id) {
      throw new ForbiddenException('No tiene acceso a este presupuesto');
    }
    return budget;
  }
}
```

**Reglas del service:**

- Inyectar SOLO repositorios y servicios auxiliares (NotificationsHandlerService, EmailQueueService)
- Verificar permisos: CLIENT solo accede a sus recursos via ownership checks
- Lanzar excepciones NestJS: `NotFoundException`, `ForbiddenException`, `BadRequestException`
- Si el service atrapa excepciones de dominio del repository, mapearlas a HTTP: `BudgetNotPendingError → BadRequestException`, `BudgetVersionConflictError → ConflictException`
- Disparar notificaciones/emails con inyeccion directa fire-and-forget: `void this.notificationsHandler.handleBudgetCreated({ ... })` — EventEmitter2 fue eliminado (Fase 15)

### 3.3b Extension Point: NotificationsHandlerService

`NotificationsHandlerService` es el **punto de extensión centralizado** para todos los side-effects
de dominio (notificaciones in-app, emails transaccionales). Es el único servicio que los domain
services deben inyectar para este propósito.

**Regla:** nunca inyectar `NotificationQueueService` o `EmailQueueService` directamente en un
domain service — siempre a través de `NotificationsHandlerService`.

```typescript
// ✅ Correcto — el domain service usa el extension point
class BudgetsService {
  constructor(
    private readonly repo: BudgetsRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  async createBudget(data: CreateBudgetInput, userId: string) {
    const budget = await this.repo.create({ ...data, requestedBy: userId });
    void this.notificationsHandler.handleBudgetCreated({
      budgetId: budget.id,
      title: budget.title,
      requesterId: userId,
      propertyId: budget.propertyId,
    });
    return budget;
  }
}

// ❌ Incorrecto — inyección directa de servicios de infraestructura
class BudgetsService {
  constructor(private readonly emailQueue: EmailQueueService) {} // nunca así
}
```

**Agregar un nuevo side-effect:**

1. Agregar `handleXxxYyy(payload): Promise<void>` en `NotificationsHandlerService`
2. Llamar `void this.notificationsHandler.handleXxxYyy(...)` después del DB write
3. El método maneja su propio try/catch — el caller nunca necesita try/catch

**Excepción — operaciones bulk del scheduler:**
`handleTaskReminders()` retorna `{ notificationCount, failedEmails }` (no void) porque el scheduler necesita logear resultados. Usa `NotificationsService.createNotifications()` directo (bulk DB insert) + `Promise.allSettled` para emails.

### 3.3c Domain Exceptions

Los repositories lanzan excepciones de dominio (no HTTP) definidas en `apps/api/src/common/exceptions/domain.exceptions.ts`. El service las atrapa y mapea a HTTP:

```typescript
// Repository — lanza excepción de dominio
if (budget.status !== 'PENDING') throw new BudgetNotPendingError();

// Service — mapea a HTTP
try {
  result = await this.budgetsRepository.respondToBudget(...);
} catch (error) {
  if (error instanceof BudgetNotPendingError) throw new BadRequestException(error.message);
  if (error instanceof BudgetVersionConflictError) throw new ConflictException(error.message);
  throw error;
}
```

**Regla:** los repositories NUNCA importan `@nestjs/common` exceptions. Solo lanzan `Error` subclasses de dominio.

### 3.4 Controller Pattern

```typescript
// Ejemplo: apps/api/src/budgets/budgets.controller.ts
@ApiTags('Presupuestos')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(budgetFiltersSchema))
  list(@Query() filters: BudgetFiltersInput, @CurrentUser() user: CurrentUserPayload) {
    return this.service.listBudgets(filters, user);
  }

  @Post()
  @Roles(UserRole.CLIENT)
  @UsePipes(new ZodValidationPipe(createBudgetRequestSchema))
  create(@Body() data: CreateBudgetRequestInput, @CurrentUser() user: CurrentUserPayload) {
    return this.service.createBudgetRequest(data, user);
  }

  @Post(':id/respond')
  @Roles(UserRole.ADMIN)
  @UsePipes(new ZodValidationPipe(respondBudgetSchema))
  respond(@Param('id') id: string, @Body() data: RespondBudgetInput, @CurrentUser() user) {
    return this.service.respondToBudget(id, data, user);
  }
}
```

**Decoradores obligatorios:**

- `@ApiTags('Nombre')` — Swagger grouping
- `@ApiBearerAuth()` — indica auth requerida
- `@UsePipes(new ZodValidationPipe(schema))` — validacion Zod en cada endpoint
- `@Roles(UserRole.ADMIN)` — si requiere rol especifico
- `@Public()` — si no requiere auth (login, health, set-password)
- `@Throttle({ medium: { limit: N, ttl: M } })` — rate limit custom por endpoint
- `@CurrentUser()` — extrae usuario del JWT

### 3.5 Guard Composition

Tres guards globales via `APP_GUARD` en `app.module.ts`:

1. **JwtAuthGuard** — Valida JWT. Salta `@Public()`. Verifica blacklist de JTI en Redis
2. **RolesGuard** — Verifica `user.role` contra `@Roles()`. **Sin `@Roles()` = deniega (403)** — deny by default. Todo endpoint autenticado requiere `@Roles()` explicito o `@Public()`
3. **ThrottlerGuard** — Rate limiting. Salta `@SkipThrottle()`

Rate limits actuales:

| Tier          | Límite                      | Endpoints                 |
| ------------- | --------------------------- | ------------------------- |
| Global short  | 5 req/1s                    | Todos (default)           |
| Global medium | 30 req/10s                  | Todos (default)           |
| Login         | 5 req/min                   | `POST /auth/login`        |
| Refresh       | 5 req/min                   | `POST /auth/refresh`      |
| Set-password  | 3 req/hora + 1 req/5s burst | `POST /auth/set-password` |
| Upload        | 3 req/s burst + 20 req/min  | `POST /upload`            |

> Regla: Todo endpoint nuevo hereda throttle global. Solo override con `@Throttle()` y justificación documentada.

### 3.6 Auth Flow

```
Login → LocalStrategy → JWT access (15m, cookie HttpOnly) + refresh (7d, cookie/SecureStore)
                       → Redis: rt:{family} = generation (TTL 7d)
Request → JwtStrategy → verifica blacklist bl:{jti} → user en request
Token expirado → POST /refresh → rota token (nueva generation, Lua atomico)
                               → generation no coincide = token reuse → revocar family
Logout → blacklist jti + revocar family + clear cookies/tokens
Set-password → verify JWT + check purpose === 'invite' + check status === 'INVITED'
```

### 3.7 Upload Pattern

```typescript
@Roles(UserRole.ADMIN) // Solo admin puede subir archivos
@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async upload(@UploadedFile() file, @Body('folder') folder: string) {
    // 1. Validar MIME con magic bytes (file-type)
    // 2. Validar folder estricto (BadRequestException si no esta en whitelist)
    // 3. Upload a R2 con Content-Disposition: attachment
  }
}
// ALLOWED_FOLDERS: uploads, properties, tasks, service-requests, budgets
```

### 3.8 Event-Driven

```typescript
// NotificationsListener — CADA handler con try-catch
@OnEvent('budget.created')
async handleBudgetCreated(payload: BudgetCreatedEvent) {
  try {
    await this.notificationsRepo.create({ ... });
    await this.emailService.send({ ... });
  } catch (error) {
    this.logger.error('Error handling budget.created', error.stack);
    // NO propagar — el error no debe afectar al emisor
  }
}
```

### 3.9 Test Pattern

```typescript
// apps/api/src/budgets/budgets.service.spec.ts
describe('BudgetsService', () => {
  let service: BudgetsService;
  let repository: jest.Mocked<BudgetsRepository>;
  let propertiesRepository: jest.Mocked<PropertiesRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: BudgetsRepository,
          useValue: { findMany: jest.fn(), findById: jest.fn(), create: jest.fn() },
        },
        {
          provide: PropertiesRepository,
          useValue: { findById: jest.fn() },
        },
        { provide: NotificationsHandlerService, useValue: { handleBudgetCreated: jest.fn() } },
      ],
    }).compile();

    service = module.get(BudgetsService);
    repository = module.get(BudgetsRepository);
    propertiesRepository = module.get(PropertiesRepository);
    jest.clearAllMocks();
  });

  describe('listBudgets', () => {
    it('should filter by property.userId for CLIENT role', async () => {
      repository.findMany.mockResolvedValue({
        data: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      });
      const user = { id: 'u1', email: 'a@b.com', role: UserRole.CLIENT };

      await service.listBudgets({ take: 20 }, user);

      expect(repository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { property: { userId: 'u1' } } }),
      );
    });
  });
});
```

**Reglas de tests:**

- Mock de repos con `jest.fn()` — nunca acceder a DB real
- `jest.clearAllMocks()` en `beforeEach`
- Test permisos CLIENT vs ADMIN
- Test happy path + error cases (not found, forbidden)
- Naming: `should <expected behavior>`

---

## 4. Web (`@epde/web`) — Next.js

### 4.1 Hook Pattern

**QUERY_KEYS** es SSoT en `@epde/shared` — nunca crear query keys locales. Import siempre: `import { QUERY_KEYS } from '@epde/shared'`.

**staleTime policy**: Dashboard hooks usan `staleTime: 2 * 60 * 1000` (2 min). El resto usa el default de React Query (0).

```typescript
// apps/web/src/hooks/use-budgets.ts — Hook template
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage, QUERY_KEYS } from '@epde/shared';

// Listado con infinite query (DEBE tener maxPages: 10)
export function useBudgets(filters: BudgetFilters) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.budgets, filters],
    queryFn: ({ pageParam, signal }) => getBudgets({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
  });
}

// Detalle con enable condicional
export function useBudget(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, id],
    queryFn: ({ signal }) => getBudget(id, signal),
    enabled: !!id,
  });
}

// Mutation con invalidacion + toasts (web: toast, mobile: Alert.alert)
export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBudgetRequest,
    onSuccess: () => {
      toast.success('Presupuesto creado');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.budgets] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, 'stats'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.dashboard, 'activity'] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Error al crear presupuesto'));
    },
  });
}
```

### 4.2 API Functions

```typescript
// apps/web/src/lib/api/budgets.ts
import { apiClient } from '../api-client';
import type { PaginatedResponse } from '@epde/shared/types'; // NUNCA redefinir tipos
import type { BudgetRequestPublic } from '@epde/shared/types';

export async function getBudgets(params?: Record<string, unknown>, signal?: AbortSignal) {
  const { data } = await apiClient.get<PaginatedResponse<BudgetRequestPublic>>('/budgets', {
    params,
    signal,
  });
  return data;
}

export async function getBudget(id: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<BudgetRequestPublic>(`/budgets/${id}`, { signal });
  return data;
}

export async function createBudgetRequest(input: CreateBudgetRequestInput) {
  const { data } = await apiClient.post<BudgetRequestPublic>('/budgets', input);
  return data;
}
```

**Patrón preferido — Shared API factory** (9 entidades ya migradas):

```typescript
// apps/web/src/lib/api/clients.ts (usa factory compartida)
import { createClientQueries } from '@epde/shared/api';
import { apiClient } from '../api-client';

export type { ClientPublic } from '@epde/shared';
export type { ClientFilters } from '@epde/shared/api';

const queries = createClientQueries(apiClient);
export const { getClients, getClient, createClient, updateClient, deleteClient } = queries;
```

Las factories viven en `packages/shared/src/api/` y encapsulan rutas + tipos. Web y mobile consumen la misma factory con su propio `apiClient`.

**Reglas:**

- Tipos de respuesta importados de `@epde/shared/types`
- `signal` para soporte de abort/cancellation
- Retornar `data` directamente (no `AxiosResponse`)
- Preferir shared factory (`createXxxQueries`) sobre funciones standalone

### 4.3 Page Pattern

```typescript
// apps/web/src/app/(dashboard)/budgets/page.tsx
'use client';

export default function BudgetsPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<BudgetFilters>({});
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useBudgets(filters);

  const allData = data?.pages.flatMap((p) => p.data) ?? [];
  const total = data?.pages[0]?.total;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl">Presupuestos</h1>
        <CreateBudgetDialog />
      </div>
      {/* Filtros */}
      <DataTable
        columns={budgetColumns}
        data={allData}
        isLoading={isLoading}
        hasMore={hasNextPage}
        onLoadMore={() => fetchNextPage()}
        isLoadingMore={isFetchingNextPage}
        total={total}
        onRowClick={(row) => router.push(`/budgets/${row.id}`)}
      />
    </div>
  );
}
```

### 4.4 Dialog/Form Pattern

```typescript
// Patron: Dialog con React Hook Form + Zod + sonner
export function CreatePropertyDialog() {
  const form = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: { type: 'HOUSE' },
  });
  const mutation = useCreateProperty();
  const [open, setOpen] = useState(false);

  const onSubmit = form.handleSubmit(async (data) => {
    await mutation.mutateAsync(data);
    setOpen(false);
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Nueva Propiedad</Button></DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          {/* Campos con form.register() */}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creando...' : 'Crear'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.5 Style Maps

Variantes de Badge centralizadas en `lib/style-maps.ts`:

```typescript
// apps/web/src/lib/style-maps.ts
// Los mapas de variantes Badge se importan desde shared (SSoT web + mobile)
import {
  TASK_STATUS_VARIANT, BUDGET_STATUS_VARIANT, SERVICE_STATUS_VARIANT,
  URGENCY_VARIANT, PRIORITY_VARIANT, CLIENT_STATUS_VARIANT
} from '@epde/shared';
export { TASK_STATUS_VARIANT as taskStatusVariant, BUDGET_STATUS_VARIANT as budgetStatusVariant, ... };
// + priorityColors, taskTypeColors, professionalReqColors (color maps locales a web)
```

**Regla:** NUNCA definir colores por estado inline en componentes. Importar de `style-maps.ts`.

### 4.6 Auth (Web)

```typescript
// apps/web/src/stores/auth-store.ts — Zustand
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (email, password) => {
    /* POST /auth/login → set user */
  },
  logout: async () => {
    queryClient.clear(); // queryClient singleton de lib/query-client.ts
    set({ user: null, isAuthenticated: false });
    await authApi.logout();
    window.location.href = '/login';
  },
  fetchUser: async () => {
    /* GET /auth/me → set user */
  },
}));

// apps/web/src/lib/query-client.ts — singleton exportable
export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 120_000 } } });
```

**Middleware (Next.js):** Verifica cookie `access_token`, decodifica JWT, redirige a `/login` si expirado (buffer 30s).

### 4.7 UI/UX Patterns

#### Detail Page — Info Card

Todas las detail pages usan el mismo patron para mostrar informacion del recurso:

```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-lg">Informacion del recurso</CardTitle>
    <Badge variant="outline">{statusLabel}</Badge>
  </CardHeader>
  <CardContent>
    <div className="bg-muted/40 rounded-lg p-4">
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-muted-foreground flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            Label
          </dt>
          <dd className="font-medium">{value}</dd>
        </div>
        {/* ... mas campos */}
      </dl>
    </div>
  </CardContent>
</Card>
```

**Reglas:** Fondo `bg-muted/40 rounded-lg p-4`, `text-sm` en `<dl>`, `space-y-1` por campo, icono Lucide `h-3.5 w-3.5` en cada `<dt>`.

#### Loading Skeleton Estructurado

Los skeletons deben reflejar la estructura real del contenido:

```tsx
<div className="space-y-6">
  <div className="flex items-start justify-between">
    <div>
      <Skeleton className="h-7 w-56" /> {/* PageHeader title */}
      <Skeleton className="mt-1.5 h-4 w-36" /> {/* PageHeader description */}
    </div>
    <Skeleton className="h-9 w-24" /> {/* Back button */}
  </div>
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <Skeleton className="h-5 w-48" /> {/* Card title */}
      <Skeleton className="h-5 w-20 rounded-full" /> {/* Badge */}
    </CardHeader>
    <CardContent>
      <div className="bg-muted/40 rounded-lg p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: N }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" /> {/* Label */}
              <Skeleton className="h-4 w-36" /> {/* Value */}
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

#### Not-Found State

Patron unificado para recursos no encontrados:

```tsx
<div className="flex flex-col items-center gap-2 py-16">
  <EntityIcon className="text-muted-foreground/50 h-10 w-10" />
  <p className="text-muted-foreground text-sm">Recurso no encontrado</p>
  <Button variant="outline" asChild className="mt-2">
    <Link href="/entity-list">
      <ArrowLeft className="mr-2 h-4 w-4" />
      Volver a listado
    </Link>
  </Button>
</div>
```

#### Empty State

Patron para listas vacias o sin resultados:

```tsx
<div className="flex flex-col items-center gap-2 py-8">
  <ContextIcon className="text-muted-foreground/50 h-8 w-8" />
  <p className="text-muted-foreground text-sm">Mensaje descriptivo</p>
</div>
```

#### DataTable — Row Interaction

Las tablas de datos siguen este patron de interaccion:

- **Row click:** `onRowClick` navega a la detail page
- **Title column:** Renderiza como `<Link>` clickeable (doble acceso: fila o link)
- **3-dot menu:** Solo para acciones destructivas o de estado (eliminar, cambiar estado). NO para navegacion
- **NUNCA:** Poner botones "Ver" en la tabla — la fila entera ya navega

#### Stat Card — Overdue Styling

Las stat cards de tareas vencidas usan styling condicional:

```tsx
<StatCard
  title="Tareas Vencidas"
  value={stats.overdueTasks}
  icon={AlertTriangle}
  className={stats.overdueTasks > 0 ? 'border-destructive/30 bg-destructive/10' : ''}
/>
```

#### Dashboard Activity List

Items de actividad con icon circle + card border:

```tsx
<li className="flex items-start gap-3 rounded-lg border p-3">
  <div className="bg-muted mt-0.5 rounded-full p-2">
    <Activity className="h-4 w-4" />
  </div>
  <div className="flex-1">
    <span className="text-sm font-medium">{description}</span>
    <span className="text-muted-foreground mt-0.5 block text-xs">{time}</span>
  </div>
</li>
```

---

## 5. Mobile (`@epde/mobile`) — Expo

### 5.1 Hook Pattern (Infinite Scroll)

```typescript
// apps/mobile/src/hooks/use-budgets.ts
export function useBudgets(filters: BudgetFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['budgets', filters],
    queryFn: ({ pageParam }) => getBudgets({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined as string | undefined,
  });
}
```

En la screen: `onEndReached={() => hasNextPage && fetchNextPage()}` con `onEndReachedThreshold={0.5}`

### 5.2 API Client (Mobile)

```typescript
// apps/mobile/src/lib/api-client.ts
import { CLIENT_TYPE_HEADER, CLIENT_TYPES, attachRefreshInterceptor } from '@epde/shared';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { [CLIENT_TYPE_HEADER]: CLIENT_TYPES.MOBILE },
});

// Request interceptor: adjunta Bearer token desde SecureStore
apiClient.interceptors.request.use(async (config) => {
  const token = await tokenService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Singleton refresh via shared factory
attachRefreshInterceptor({
  client: apiClient,
  doRefresh: async () => {
    /* refresh token logic */
  },
  onRefreshFail: async () => {
    useAuthStore.getState().logout();
  },
  onRetry: async (config) => {
    const newToken = await tokenService.getAccessToken();
    config.headers.Authorization = `Bearer ${newToken}`;
  },
});
```

> **`attachRefreshInterceptor`** (de `@epde/shared`) centraliza el patron singleton refresh usado en web y mobile. Acepta `doRefresh`, `onRefreshFail`, y opcionalmente `onRetry` (para mobile, que necesita actualizar el header Authorization).

### 5.3 Screen Pattern

```typescript
// NativeWind classes + font styles
<ScrollView className="bg-background flex-1" contentContainerStyle={{ padding: 16 }}>
  <Text style={fonts.heading} className="text-foreground text-2xl mb-4">
    Titulo
  </Text>
  <View className="border-border bg-card rounded-xl border p-4">
    <Text style={{ fontFamily: 'DMSans_400Regular' }} className="text-muted-foreground text-sm">
      Label
    </Text>
  </View>
</ScrollView>
```

**Fonts:** Heading = `DMSerifDisplay_400Regular` (via `fonts.heading` from `@/lib/fonts`), Body = `DMSans_400Regular`/`500Medium`/`700Bold`

### 5.4 Modal Pattern (con upload)

```typescript
// Patron: submit guard contra race condition
const canSubmit = isValid && !isUploading && photos.every((p) => p.uploadedUrl);

// Upload de fotos: usar expo-image-picker → multipart/form-data → URL
```

### 5.5 Auth Store (Mobile)

```typescript
// apps/mobile/src/stores/auth-store.ts — ORDEN CRITICO en logout
logout: async () => {
  // 1. PRIMERO limpiar estado local (previene race conditions)
  queryClient.cancelQueries();
  queryClient.clear();
  set({ user: null, isAuthenticated: false });
  // 2. LUEGO intentar API call
  try { await authApi.logout(); } catch { /* API puede fallar */ }
  // 3. FINALMENTE limpiar tokens
  finally { await tokenService.clearTokens(); }
},
```

### 5.6 Token Service

```typescript
// apps/mobile/src/lib/token-service.ts — SecureStore (nativo) + sessionStorage (web)
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

// Nativo: expo-secure-store (iOS keychain / Android keystore)
// Web: sessionStorage (no persiste entre tabs ni al cerrar — mitiga XSS)

export const tokenService = {
  getAccessToken: () => getItem('epde_access_token'),
  getRefreshToken: () => getItem('epde_refresh_token'),
  setTokens: async (access: string, refresh: string) => {
    await Promise.all([
      setItem('epde_access_token', access),
      setItem('epde_refresh_token', refresh),
    ]);
  },
  clearTokens: async () => {
    await Promise.all([deleteItem('epde_access_token'), deleteItem('epde_refresh_token')]);
  },
  hasTokens: async () => (await getItem('epde_access_token')) !== null,
};
```

---

## 6. Checklists

### 6.1 Nueva Entidad (End-to-End)

1. **Schema Prisma** — Agregar modelo en `apps/api/prisma/schema.prisma`, ejecutar `prisma migrate dev`
2. **Shared: Schema Zod** — `packages/shared/src/schemas/<entity>.ts` (create, update, filters)
3. **Shared: Types** — `packages/shared/src/types/entities/<entity>.ts` (entity, public, brief)
4. **Shared: Constants** — Labels en espanol en `constants/index.ts`
5. **Shared: Exports** — Registrar en `schemas/index.ts`, `types/entities/index.ts`
6. **Shared: Build** — `pnpm --filter @epde/shared build`
7. **API: Repository** — Extiende `BaseRepository<T, 'modelName'>`, con includes LIST vs DETAIL
8. **API: Service** — Inyecta repo, verifica permisos CLIENT/ADMIN
9. **API: Controller** — Decorators, ZodValidationPipe por endpoint
10. **API: Module** — Imports, providers, controllers. Registrar en `app.module.ts`
11. **API: Tests** — `*.service.spec.ts` con mocks
12. **Shared: API factory** — `packages/shared/src/api/<entity>.ts` con `createXxxQueries(apiClient)`, exportar en `api/index.ts`
13. **Web: API functions** — `lib/api/<entity>.ts` consume la factory compartida
14. **Web: Hooks** — `hooks/use-<entity>.ts` con `getErrorMessage` de `@epde/shared` + toasts + `QUERY_KEYS`
15. **Web: Page** — `app/(dashboard)/<entity>/page.tsx` + `columns.tsx`
16. **Web: Detail** — `app/(dashboard)/<entity>/[id]/page.tsx`
17. **Web: Dialog** — Dialog de creacion/edicion con RHF + Zod
18. **Web: Sidebar** — Agregar item de navegacion
19. **Mobile (si aplica):** Hook, API, screen, detalle

### 6.2 Nuevo Endpoint (en entidad existente)

1. Schema Zod en shared (si hay nuevo input)
2. Metodo en repository (si accede a datos)
3. Metodo en service (logica + permisos)
4. Metodo en controller (decorators + pipe)
5. Tests en `*.service.spec.ts`
6. API function en web `lib/api/`
7. Hook mutation en web `hooks/`

### 6.3 Security Checklist

- [ ] Endpoints con datos sensibles requieren `@Roles(UserRole.ADMIN)` o verificacion de ownership
- [ ] CLIENT solo accede a recursos de sus propiedades (`property.userId === user.id`)
- [ ] Validacion Zod en TODOS los endpoints con input
- [ ] Rate limiting en endpoints sensibles (auth, set-password)
- [ ] File uploads validan MIME + magic bytes + folder whitelist
- [ ] Tokens JWT verifican claims (purpose, exp, jti blacklist)
- [ ] No hay tokens ni passwords en logs
- [ ] Event handlers envueltos en try-catch

### 6.4 Pre-Commit Checklist

```bash
pnpm build      # Build exitoso
pnpm typecheck  # Sin errores TypeScript
pnpm lint       # Sin errores ESLint
pnpm test       # Todos los tests pasan
```

---

## 7. Anti-Patrones

| Anti-patron                                                          | Correcto                                                                           |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `this.prisma.user.findMany()` en un service                          | `this.usersRepository.findMany()`                                                  |
| `interface MyType { ... }` en `lib/api/*.ts`                         | `import type { MyType } from '@epde/shared/types'`                                 |
| `if (user.role === 'ADMIN')`                                         | `if (user.role === UserRole.ADMIN)`                                                |
| `@Body() dto: CreateUserDto` (class-validator)                       | `@UsePipes(new ZodValidationPipe(schema)) @Body() data: Input`                     |
| `localStorage.setItem('token', ...)`                                 | Cookies HttpOnly (web) / SecureStore (mobile nativo) / sessionStorage (mobile web) |
| `queryClient.invalidateQueries({ queryKey: ['dashboard'] })`         | `queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })`              |
| `const sanitized = valid ? folder : 'default'` (fallback silencioso) | `throw new BadRequestException('Folder invalido')`                                 |
| `console.log(token)`                                                 | No loguear tokens                                                                  |
| `Float` en Prisma para montos                                        | `Decimal(14,2)`                                                                    |
| `onError` ausente en `useMutation`                                   | `onError: (err) => toast.error(getErrorMessage(err, 'fallback'))`                  |
| `set-password` sin verificar `purpose` claim                         | `if (payload.purpose !== 'invite') throw Unauthorized`                             |
| Logout: API call primero, luego limpiar estado                       | Limpiar estado local PRIMERO, luego API call                                       |
| `useQueryClient()` duplicado (store + componente)                    | `queryClient` singleton desde `lib/query-client.ts`                                |
| `TypeScript enum`                                                    | `const obj as const` + `type Union`                                                |
| `import { something } from '../../../shared'`                        | `import { something } from '@epde/shared'`                                         |
| `<button><Trash2 /></button>` (icon-only sin label)                  | `<button aria-label="Eliminar"><Trash2 /></button>`                                |
| `<Label>Nombre</Label><Input />` (sin vincular)                      | `<Label htmlFor="name">Nombre</Label><Input id="name" />`                          |
| `<div onClick={fn}>` (clickeable sin teclado)                        | `<div role="button" tabIndex={0} onClick={fn} onKeyDown={handleEnterSpace}>`       |
| `<span className="text-red-600">Error</span>`                        | `<span className="text-destructive">Error</span>`                                  |
| `<div className="bg-white">`                                         | `<div className="bg-background">`                                                  |
| `<dl>` plano sin fondo ni iconos                                     | `bg-muted/40 rounded-lg p-4` + iconos Lucide en `<dt>`                             |
| Skeleton generico (`h-8 w-48` + `h-64 w-full`)                       | Skeleton estructurado que refleja layout real (PageHeader + Card + grid)           |
| `<p>Recurso no encontrado</p>` (texto plano)                         | Icon centrado `h-10 w-10` + texto + boton "Volver"                                 |
| Boton "Ver" en columna de tabla                                      | `onRowClick` en DataTable + titulo como `<Link>`                                   |
| Activity list con `<li>` planos                                      | Items con icon circle (`bg-muted rounded-full p-2`) + border card                  |
| `@Param('id') id: string` sin pipe en path params de entidad         | `@Param('id', ParseUUIDPipe) id: string`                                           |
| `useInfiniteQuery({...})` sin `maxPages`                             | `useInfiniteQuery({ ..., maxPages: 10 })`                                          |
| `const [debounced, setDebounced] = useState` con `useEffect` inline  | `const debouncedSearch = useDebounce(search, 300)`                                 |
| `Record<string, string>` sin `satisfies` en label/variant maps       | `Record<string, string> = { ... } satisfies Record<EnumType, string>`              |
| `Object.values(TaskType) as [string, ...string[]]` local en schema   | `TASK_TYPE_VALUES` de `@epde/shared` (SSoT en `enums.ts`)                          |
| Funciones API standalone con `apiClient.get()` por entidad           | `createXxxQueries(apiClient)` factory de `@epde/shared/api`                        |
| `DESIGN_TOKENS_LIGHT.success` en inline style (sin dark mode)        | CSS `var(--success)` (resuelve por tema automáticamente)                           |
