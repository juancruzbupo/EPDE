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
21. **`PrismaModule` global provee `PrismaService`** — NUNCA registrar `PrismaService` en `providers[]` de modulos individuales. `PrismaModule` es `@Global()` y se importa una sola vez en `CoreModule`. Cada modulo recibe la misma instancia via DI
22. **Badge variants usan tokens semanticos** — La variante `success` usa `bg-success/15 text-success` (web) y `bg-success/15 text-success` (mobile). NUNCA usar colores raw como `bg-green-100 text-green-800`
23. **Upload validation client-side obligatoria** — Usar `validateUpload(mimeType, sizeBytes)` de `@epde/shared` antes de enviar al API. Web y mobile deben validar MIME type y tamano
24. **Dialogs/Sheets co-located con pages** — Componentes dialog/sheet que solo se usan en una pagina van en el directorio de esa pagina. Solo mover a `components/` si se reutiliza en 2+ paginas
25. **`CurrentUser` type centralizado** — Usar `import type { CurrentUser as CurrentUserPayload } from '@epde/shared'` en controllers. NUNCA tipar `@CurrentUser() user` con objetos inline como `{ id: string; role: string }`. El alias `CurrentUserPayload` evita conflicto con el decorator `@CurrentUser()`
26. **Barrel import de `@epde/shared`** — Importar SIEMPRE desde `@epde/shared` (barrel). NUNCA usar sub-paths como `@epde/shared/types`, `@epde/shared/schemas`, `@epde/shared/constants`. El barrel re-exporta todo
27. **Zod validation para Query params** — Endpoints con `@Query()` DEBEN usar `@Query(new ZodValidationPipe(schema))` con schema Zod definido en `@epde/shared`. NUNCA validar query params con regex manual o `DefaultValuePipe` + `ParseIntPipe`
28. **Certificate pinning pre-produccion mobile** — Antes de release mobile a produccion, implementar certificate pinning con `react-native-ssl-pinning`. Ver TODO [PRE-RELEASE] en `apps/mobile/src/lib/api-client.ts:34-40`
29. **Error state en paginas con queries** — Toda pagina que use `useQuery`/`useInfiniteQuery` DEBE destructurar `isError` y `refetch`, y usar `<ErrorState message="..." onRetry={refetch} />` de `@/components/error-state`. Para full-page: agregar `className="justify-center py-24"`. Para inline (dashboard cards): agregar `className="col-span-full"` si es necesario. NUNCA duplicar markup de AlertTriangle+Button inline
30. **`@ApiTags` en espanol** — Todos los controllers usan `@ApiTags('Nombre en Español')` para consistencia en Swagger. Ejemplos: `Autenticación`, `Panel`, `Carga de Archivos`, `Plantillas de Tareas`
31. **Validar ownership en rutas anidadas** — Rutas tipo `PATCH :id/tasks/:taskId` DEBEN extraer ambos params y validar que el recurso hijo pertenece al padre. Ejemplo: `if (task.maintenancePlanId !== planId) throw new NotFoundException()`. NUNCA ignorar el `:id` padre en la logica del service
32. **Tipografia: `type-*` en landing, Tailwind text en dashboard** — Las secciones de landing usan clases `type-display`, `type-heading`, `type-body`, `type-caption` definidas en `globals.css`. El dashboard y paginas autenticadas usan `text-sm`, `text-base`, `text-lg` de Tailwind directamente. NUNCA mezclar sistemas
33. **List pages siguen patron de properties** — Toda pagina de listado paginado sigue el patron de `app/(dashboard)/properties/page.tsx`: `useInfiniteQuery` + `maxPages: 10` + skeleton loading + error state + empty state + infinite scroll trigger. Copiar estructura como baseline
34. **Filter interfaces reflejan Zod schemas** — Los tipos de filtros en frontend (`PropertyFilters`, `BudgetFilters`, etc.) DEBEN ser subconjuntos de los schemas Zod de `@epde/shared`. Si el schema agrega un campo, el filtro debe reflejarlo. Evitar drift manual entre tipos de filtro locales y schemas compartidos
35. **Import ordering** — Enforced via `eslint-plugin-simple-import-sort` (`simple-import-sort/imports` + `simple-import-sort/exports` en `eslint.config.mjs`). Orden: (1) React/framework (`react`, `next/*`, `@nestjs/*`), (2) external packages (`lucide-react`, `framer-motion`, `date-fns`), (3) `@epde/shared`, (4) `@/` local imports (components, hooks, lib), (5) `type` imports al final de cada grupo. Se auto-formatea con `pnpm lint --fix`
36. **Regla de excepciones** — Domain exceptions (`XxxError extends Error` en `common/exceptions/domain.exceptions.ts`) para TODA logica de negocio: ownership, transiciones de estado, unicidad, completabilidad. Mapear a HTTP en el mismo service via try/catch. `NotFoundException` para validaciones de existencia pre-operacion es la unica HTTP exception directa aceptable. Los repositories NUNCA importan `@nestjs/common`
37. **Rutas estaticas antes de parametrizadas** — En NestJS controllers, las rutas estaticas (`@Patch('read-all')`, `@Patch('reorder/batch')`) DEBEN declararse antes de las rutas parametrizadas (`@Patch(':id/read')`, `@Patch(':id')`). Si no, NestJS matchea el segmento estatico como parametro UUID y falla con 400
38. **Axios generics en vez de `as` casts** — Preferir `apiClient.post<{ data: T }>(url, body)` en vez de `const res = ... ; return res.data as T`. Los generics permiten que TypeScript infiera el tipo de `data` sin type assertions inseguras
39. **API factory return types explícitos con `ApiResponse<T>`** — Toda funcion en `packages/shared/src/api/*.ts` DEBE tener return type explicito: `Promise<ApiResponse<T>>` para detalle/mutacion, `Promise<ApiResponse<null>>` para deletes, `Promise<PaginatedResponse<T>>` para listas paginadas. NUNCA usar `Promise<{ data: T }>` inline — usar siempre los type aliases de `../types`
40. **Template auto-fill en creacion de tareas** — El TaskDialog usa `Category.categoryTemplateId` (FK) para buscar el `CategoryTemplate` asociado y mostrar un selector de `TaskTemplate` en vez de texto libre para el nombre. Al seleccionar una plantilla se auto-completan: `taskType`, `professionalRequirement`, `priority`, `recurrenceType`, `recurrenceMonths`, `technicalDescription`, `estimatedDurationMinutes`. El admin puede sobreescribir cualquier campo. En modo edicion el nombre es siempre texto libre
41. **Domain exceptions para TODA regla de negocio** — Ownership checks, transiciones de estado, validaciones de unicidad: SIEMPRE lanzar domain exception (`XxxError extends Error` en `common/exceptions/domain.exceptions.ts`) y mapear a HTTP en el mismo service via try/catch. NUNCA lanzar `ForbiddenException`/`ConflictException` directamente desde logica de negocio — los services deben ser transport-agnostic. Excepciones existentes: `PropertyAccessDeniedError`, `PlanAccessDeniedError`, `TaskAccessDeniedError`, `BudgetAccessDeniedError`, `DuplicateClientEmailError`, `InvalidBudgetTransitionError`, `InvalidServiceStatusTransitionError`, `TaskNotCompletableError`, `CategoryHasReferencingTasksError`, `UserAlreadyHasPasswordError`
42. **Enum constants en tests** — Usar `TaskPriority.MEDIUM` en vez de `'MEDIUM'`, `RecurrenceType.ANNUAL` en vez de `'ANNUAL'` en fixtures de test. El helper `TEST_TASK_DEFAULTS` en `test/helpers/test-task-defaults.ts` centraliza valores comunes para evitar drift
43. **Entity drift check en CI** — El script `scripts/check-entity-drift.mjs` verifica que los campos de los 6 modelos principales de Prisma coincidan con las interfaces en `packages/shared/src/types/entities/`. Se ejecuta automaticamente en CI despues del schema drift check. Al agregar un campo en `schema.prisma`, actualizar tambien la interface en shared
44. **ErrorState en detail pages con initialData** — Todo componente detail que use `initialData` de RSC DEBE destructurar `isError` + `refetch` del hook y mostrar `<ErrorState>` cuando `isError && !data`. Previene que el usuario vea data stale sin feedback cuando la revalidacion falla
45. **`onError` en optimistic updates: feedback primero, restore despues** — En mutations con `onMutate` optimistic, el `onError` DEBE mostrar feedback al usuario PRIMERO (`Alert.alert` en mobile, `toast.error` en web) y restaurar el estado previo DESPUES. El usuario debe ver el error inmediatamente; la restauracion de estado es invisible. Variable de contexto: `prev` (no `previousCount`, `previousData`, etc.) para consistencia mobile ↔ web
46. **Detail hooks aceptan `initialData`** — Todo hook de detalle (`useBudget`, `useProperty`, `useServiceRequest`, etc.) DEBE aceptar `options?: { initialData?: T }` y pasarlo a `useQuery`. Permite que pantallas de lista pasen data cargada al navegar a detalle, evitando flash de loading. Aplica a web y mobile
47. **`@Throttle` en mutation endpoints** — Todo `@Post()` de creacion DEBE tener `@Throttle({ medium: { limit: 5, ttl: 60_000 } })`. El global de 5 req/s es muy permisivo para mutations. Auth y upload usan limits propios mas estrictos. Reads usan solo el throttle global
48. **Factory vs local function en API files** — Funciones en `packages/shared/src/api/*.ts` son factories platform-agnostic (web + mobile). Funciones locales en `apps/*/src/lib/api/*.ts` son role-specific (admin-only) o platform-specific. Criterio: si ambas apps consumen el endpoint, va en shared; si solo una, queda local

### NUNCA

1. **NUNCA inyectar `PrismaService` en un service** — Solo repositorios acceden a datos. Tampoco registrar `PrismaService` en `providers[]` de modulos — viene del `PrismaModule` global
2. **NUNCA usar `localStorage` para tokens** — Web usa cookies HttpOnly, mobile nativo usa SecureStore, mobile web usa sessionStorage
3. **NUNCA usar class-validator o class-transformer** — Eliminados del proyecto
4. **NUNCA usar magic strings para roles/status** — Importar de `@epde/shared`
5. **NUNCA crear interfaces duplicadas en frontend** — Importar de `@epde/shared` (barrel)
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
18. **NUNCA crear hooks monoliticos con 10+ exports** — Dividir por dominio (queries vs mutations, plan-level vs task-level). Los importers usan los archivos split directamente; NO crear barrel re-exports
19. **NUNCA importar desde sub-paths de `@epde/shared`** — No usar `@epde/shared/types`, `@epde/shared/schemas`, etc. Usar siempre el barrel `@epde/shared`
20. **NUNCA tipar `@CurrentUser()` con objetos inline** — Usar `CurrentUserPayload` de `@epde/shared` (alias de `CurrentUser`)
21. **NUNCA envolver `PaginatedResult` en `{ data }`** — Los endpoints de listado paginado retornan `return this.service.listXxx(...)` directo. Solo endpoints de detalle/mutacion usan `return { data }`. Envolver produce doble envelope `{ data: { data: [...], nextCursor } }` que rompe `useInfiniteQuery`
22. **NUNCA usar `as Omit<Type, 'field'>` para excluir campos de un DTO** — El type cast NO elimina la propiedad en runtime. Usar destructuring: `const { field, ...rest } = dto`. Ejemplo: `categoryId` en un update DTO debe destructurarse antes de spread a Prisma, o se genera conflicto FK + relation connect
23. **NUNCA declarar ruta parametrizada antes de ruta estatica** — En NestJS, `@Patch(':id')` matchea antes que `@Patch('reorder/batch')` si esta declarada primero. Resultado: `ParseUUIDPipe` falla con 400 al recibir `'reorder'` como UUID
24. **NUNCA usar `as string` / `as T` para tipar responses de Axios** — Usar generics: `apiClient.post<{ data: T }>(...)`. Los type assertions no validan en runtime y ocultan mismatches entre el tipo esperado y el response real
25. **NUNCA lanzar HTTP exceptions directamente desde logica de negocio** — `ForbiddenException`, `ConflictException`, `BadRequestException` DEBEN ser mapeados desde domain exceptions via try/catch. `NotFoundException` para existencia pre-operacion es la unica excepcion aceptable (no hay domain exception para "no existe")
26. **NUNCA usar string literals para enums en tests** — Usar `TaskPriority.MEDIUM`, `RecurrenceType.ANNUAL`, etc. Si un enum value cambia, TypeScript debe capturarlo en tests tambien
27. **NUNCA definir `const QUERY_KEY` local en hooks** — Escribir `[QUERY_KEYS.xxx]` inline en cada `queryKey`/`invalidateQueries`. Una constante local esconde la key real y dificulta busquedas globales

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
// IMPORTANTE: Usar el tipo enum real (no string) para que z.infer<> preserve la unión
export const TASK_TYPE_VALUES = Object.values(TaskType) as [TaskType, ...TaskType[]];
export const RECURRENCE_TYPE_VALUES = Object.values(RecurrenceType) as [
  RecurrenceType,
  ...RecurrenceType[],
];
export const PROFESSIONAL_REQUIREMENT_VALUES = Object.values(ProfessionalRequirement) as [
  ProfessionalRequirement,
  ...ProfessionalRequirement[],
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

// Public types — excluyen campos sensibles + serializan Date→string
export type UserPublic = Serialized<Omit<User, 'passwordHash'>>;

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

| Tipo de hook            | staleTime            | Razón                                                       |
| ----------------------- | -------------------- | ----------------------------------------------------------- |
| Dashboard hooks         | `2 * 60_000` (2 min) | Datos cambian infrecuentemente, usuario navega tabs seguido |
| Listados con paginación | default (0)          | Siempre fresh al navegar — cambios frecuentes por CRUD      |
| Detail views            | default (0)          | Siempre fresh — dato individual puede cambiar entre vistas  |

Aplicar en **web y mobile** por igual. Si un hook tiene `staleTime` en web, su equivalente mobile DEBE tenerlo también.

**Nota:** Web y mobile definen `staleTime: 2 * 60_000` como global default en el QueryClient. Hooks individuales PUEDEN overridear el global si necesitan datos mas frescos (ej. `staleTime: 0` para detail views con edicion frecuente). El global es el floor, no un lock.

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

**Dependencia circular `TasksModule` ↔ `MaintenancePlansModule`:** Resuelta via `PlanDataModule` (data-only module que provee `MaintenancePlansRepository`). `TasksModule` importa `PlanDataModule` (no `MaintenancePlansModule`). `MaintenancePlansModule` importa `PlanDataModule` + `TasksModule`. No se usa `forwardRef` — el `PlanDataModule` rompe el ciclo limpiamente.

### 3.2 Repository Pattern

```typescript
// Ejemplo: apps/api/src/budgets/budgets.repository.ts
@Injectable()
export class BudgetsRepository extends BaseRepository<BudgetRequest, 'budgetRequest'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'budgetRequest', true); // true = con soft-delete
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

**ADR — Inyección directa vs Event Bus:**
El patrón actual (inyección directa de `NotificationsHandlerService`) es la decisión correcta para 2-3 consumers (`BudgetsService`, `ServiceRequestsService`, `ClientsService`). Es explícito, tipado, y fácil de testear. Si los consumers crecen a 5+, considerar reintroducir un event bus liviano (`EventEmitter2` o un decorator `@Notify()`) para reducir acoplamiento lineal. Por ahora, la simplicidad vale más que la abstracción.

### 3.3c Domain Exceptions

Los repositories y services lanzan excepciones de dominio (no HTTP) definidas en `apps/api/src/common/exceptions/domain.exceptions.ts`. El service las atrapa y mapea a HTTP:

```typescript
// Dominio — lanza excepción framework-agnostic
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

**Excepciones existentes:**

| Exception                             | Usada en                      | HTTP mapping |
| ------------------------------------- | ----------------------------- | ------------ |
| `BudgetNotPendingError`               | `budgets.service.ts`          | BadRequest   |
| `BudgetVersionConflictError`          | `budgets.service.ts`          | Conflict     |
| `CategoryHasReferencingTasksError`    | `categories.service.ts`       | BadRequest   |
| `TaskNotCompletableError`             | `task-lifecycle.service.ts`   | BadRequest   |
| `InvalidBudgetTransitionError`        | `budgets.service.ts`          | BadRequest   |
| `UserAlreadyHasPasswordError`         | `auth.service.ts`             | BadRequest   |
| `BudgetAccessDeniedError`             | `budgets.service.ts`          | Forbidden    |
| `InvalidServiceStatusTransitionError` | `service-requests.service.ts` | BadRequest   |

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
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async list(
    @Query(new ZodValidationPipe(budgetFiltersSchema)) filters: BudgetFiltersInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.listBudgets(filters, user); // PaginatedResult directo, sin { data }
  }

  @Post()
  @Roles(UserRole.CLIENT)
  async create(
    @Body(new ZodValidationPipe(createBudgetRequestSchema)) data: CreateBudgetRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.service.createBudgetRequest(data, user.id);
    return { data: result, message: 'Presupuesto solicitado' };
  }

  @Post(':id/respond')
  @Roles(UserRole.ADMIN)
  async respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(respondBudgetSchema)) data: RespondBudgetInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const result = await this.service.respondToBudget(id, data, user.id);
    return { data: result, message: 'Presupuesto cotizado' };
  }
}
```

**Decoradores obligatorios:**

- `@ApiTags('Nombre')` — Swagger grouping
- `@ApiBearerAuth()` — indica auth requerida
- `@UsePipes(new ZodValidationPipe(schema))` — validacion Zod en cada endpoint
- `@Roles(UserRole.ADMIN)` — si requiere rol especifico (tipado `UserRole[]`, no `string[]`)
- `@Public()` — si no requiere auth (login, health, set-password)
- `@Throttle({ medium: { limit: N, ttl: M } })` — rate limit custom por endpoint
- `@CurrentUser()` — extrae usuario del JWT

### 3.4b API Response Envelope

Todas las respuestas siguen esta convención:

| Operación                 | Forma de respuesta                                |
| ------------------------- | ------------------------------------------------- |
| **List** (con paginación) | `PaginatedResult<T>` directo (sin wrapper `data`) |
| **Detail** (GET /:id)     | `{ data: T }`                                     |
| **Create** (POST)         | `{ data: T, message: string }`                    |
| **Update** (PATCH)        | `{ data: T, message: string }`                    |
| **Delete** (DELETE)       | `{ data: null, message: string }`                 |

```typescript
// ✅ Correcto — el service retorna { message } directamente
@Delete(':id')
async delete(@Param('id', ParseUUIDPipe) id: string) {
  return this.service.delete(id);
}

// ❌ Incorrecto — doble envelope (controller wrapping service result)
@Delete(':id')
async delete(@Param('id', ParseUUIDPipe) id: string) {
  const data = await this.service.delete(id);
  return { data, message: 'Recurso eliminado' };
}
```

### 3.5 Guard Composition

Tres guards globales via `APP_GUARD` en `app.module.ts` (los guards se registran en AppModule; la config de ThrottlerModule/LoggerModule/BullMQ vive en `CoreModule`):

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
@Roles(UserRole.ADMIN, UserRole.CLIENT) // Ambos roles pueden subir archivos
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

### 3.8 Side-Effects (NotificationsHandlerService)

```typescript
// Centralized side-effect handler — fire-and-forget pattern
// Domain services inject NotificationsHandlerService, NOT EmailQueueService/NotificationQueueService directly.

// In the domain service (e.g. BudgetsService):
void this.notificationsHandler.handleBudgetCreated({
  budgetId, title, requesterId, propertyId,
});

// In NotificationsHandlerService — each method catches its own errors:
async handleBudgetCreated(payload: { budgetId: string; title: string; ... }): Promise<void> {
  try {
    await this.notificationQueueService.enqueueBatch([...]);
  } catch (error) {
    this.logger.error(`Error handling budget.created: ${error.message}`, error.stack);
    // NO propagar — el error no debe afectar al emisor
  }
}

// Adding a new side-effect:
// 1. Add handleXxxYyy() method in NotificationsHandlerService
// 2. Inject NotificationsHandlerService in the target domain service
// 3. Call: void this.notificationsHandler.handleXxxYyy({...}) after the DB write
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

**Test estructural — Endpoint protection:**

`test/endpoint-protection.e2e-spec.ts` usa `DiscoveryService` + `Reflector` para iterar todos los controllers y verificar que cada route handler tenga `@Roles()` o `@Public()`. Si alguien agrega un endpoint sin decorator, este test falla. Refuerza NUNCA #16.

**ESM mock pattern (file-type):**

`file-type` es ESM-only y no se puede importar en Jest/CJS. Se resuelve con `moduleNameMapper` en `jest-e2e.config.ts` apuntando a `test/__mocks__/file-type.ts` (mock manual que detecta JPEG/PNG via magic bytes). Usar este patron para cualquier paquete ESM-only en tests E2E.

---

## 4. Web (`@epde/web`) — Next.js

### 4.1 Hook Pattern

**QUERY_KEYS** es SSoT en `@epde/shared` — nunca crear query keys locales. Import siempre: `import { QUERY_KEYS } from '@epde/shared'`.

**staleTime policy**: Global `staleTime: 2 * 60_000` (2 min) en ambos query clients. Hooks pueden overridear si necesitan datos más frescos.

**retry policy**: Smart retry — skip errores 4xx (auth/validación), retry 5xx una vez. Configurado globalmente en ambos query clients.

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

// Detalle con enable condicional + initialData opcional (para pasar data de lista al navegar a detalle)
export function useBudget(id: string, options?: { initialData?: BudgetRequestPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, id],
    queryFn: ({ signal }) => getBudget(id, signal).then((r) => r.data),
    initialData: options?.initialData,
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
import type { PaginatedResponse, BudgetRequestPublic } from '@epde/shared';

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
import { createClientQueries } from '@epde/shared';
import { apiClient } from '../api-client';

export type { ClientPublic, ClientFilters } from '@epde/shared';

const queries = createClientQueries(apiClient);
export const { getClients, getClient, createClient, updateClient, deleteClient } = queries;
```

Las factories viven en `packages/shared/src/api/` y encapsulan rutas + tipos. Web y mobile consumen la misma factory con su propio `apiClient`.

**Reglas:**

- Tipos de respuesta importados de `@epde/shared`
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

Las variantes de Badge se importan directamente desde `@epde/shared` (SSoT):

```typescript
// Variantes de Badge — importar directo de @epde/shared
import { TASK_STATUS_VARIANT, BUDGET_STATUS_VARIANT, PRIORITY_VARIANT } from '@epde/shared';

<Badge variant={TASK_STATUS_VARIANT[task.status]}>...</Badge>
```

Color maps locales (CSS tokens para task types) se mantienen en `lib/style-maps.ts`:

```typescript
// apps/web/src/lib/style-maps.ts — solo color maps, NO badge variants
export const TASK_TYPE_COLORS: Record<TaskType, string> = { ... };
export const PROFESSIONAL_REQ_COLORS: Record<ProfessionalRequirement, string> = { ... };
```

**Regla:** NUNCA definir colores por estado inline en componentes. Badge variants desde `@epde/shared`, color maps desde `style-maps.ts`.

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
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000, // 2 min
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status < 500) return false; // Skip 4xx (auth/validation)
        return failureCount < 1; // Retry 5xx once
      },
    },
  },
});
```

**Middleware (Next.js):** Verifica cookie `access_token`, decodifica JWT, redirige a `/login` si expirado (buffer 30s).

**Dashboard layout — Server Component:** `(dashboard)/layout.tsx` es un Server Component (async) que llama a `getServerUser()` (lee cookie server-side, decodifica JWT). Si no hay usuario, redirige a `/login` con `redirect()`. Las child pages son Client Components con `'use client'` + React Query. Este patron evita flash de contenido no autenticado y es mas eficiente que verificar auth client-side con `useEffect`.

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

### 5.1 Hook Pattern (Infinite Scroll + Detail + Mutation)

```typescript
// apps/mobile/src/hooks/use-budgets.ts

// Lista con infinite scroll (mobile es CLIENT-only, filters default a {})
export function useBudgets(filters: Omit<BudgetFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.budgets, filters],
    queryFn: ({ pageParam, signal }) => getBudgets({ ...filters, cursor: pageParam }, signal),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    maxPages: 10,
  });
}

// Detalle con initialData opcional (mismo patron que web §4.1)
export function useBudget(id: string, options?: { initialData?: BudgetRequestPublic }) {
  return useQuery({
    queryKey: [QUERY_KEYS.budgets, id],
    queryFn: ({ signal }) => getBudget(id, signal).then((r) => r.data),
    initialData: options?.initialData,
    enabled: !!id,
  });
}

// Mutation con optimistic update — onError: feedback PRIMERO, restore DESPUES
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
      });
      const prev = queryClient.getQueryData<number>([
        QUERY_KEYS.notifications,
        QUERY_KEYS.notificationsUnreadCount,
      ]);
      if (prev !== undefined) {
        queryClient.setQueryData(
          [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
          Math.max(0, prev - 1),
        );
      }
      return { prev };
    },
    onError: (_err, _id, context) => {
      Alert.alert('Error', getErrorMessage(_err, 'Error al marcar notificación')); // feedback primero
      if (context?.prev !== undefined) {
        queryClient.setQueryData(
          [QUERY_KEYS.notifications, QUERY_KEYS.notificationsUnreadCount],
          context.prev,
        ); // restore despues
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] });
    },
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
  <Text style={TYPE.displayLg} className="text-foreground mb-4">
    Titulo
  </Text>
  <View className="border-border bg-card rounded-xl border p-4">
    <Text style={TYPE.bodySm} className="text-muted-foreground">
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

### 5.7 Mobile Query Configuration

El QueryClient de mobile difiere de web para soportar uso offline durante inspecciones de campo:

| Config        | Web                    | Mobile                          | Razon                                    |
| ------------- | ---------------------- | ------------------------------- | ---------------------------------------- |
| `staleTime`   | 2 min (global default) | 2 min (global default)          | Alineado entre plataformas               |
| `gcTime`      | 5 min (default TQ)     | 24h (`24 * 60 * 60_000`)        | Datos disponibles offline entre sesiones |
| `networkMode` | `online` (default TQ)  | `offlineFirst`                  | Queries corren desde cache sin conexion  |
| Persister     | Ninguno                | AsyncStorage (key versionada)   | Datos sobreviven cierre de app           |
| Online sync   | N/A                    | `NetInfo.addEventListener`      | Detecta reconexion → refetch automatico  |
| Logout        | `queryClient.clear()`  | `AsyncStorage.multiRemove(...)` | Limpia cache persistido + in-memory      |

**Persister key:** `epde-query-cache-v{APP_VERSION}` — al actualizar la app, las keys viejas se limpian automaticamente via `AsyncStorage.getAllKeys()` + `multiRemove()`.

**Archivos:** `apps/mobile/src/lib/query-client.ts` (QueryClient + NetInfo sync), `apps/mobile/src/lib/query-persister.ts` (AsyncStorage persister).

### 5.8 Test Runners por Workspace

| Workspace         | Runner           | Mock syntax                 | Config             |
| ----------------- | ---------------- | --------------------------- | ------------------ |
| `apps/api`        | Jest + ts-jest   | `jest.mock()` / `jest.fn()` | `jest.config.js`   |
| `apps/web`        | Vitest + jsdom   | `vi.mock()` / `vi.fn()`     | `vitest.config.ts` |
| `apps/mobile`     | Jest + jest-expo | `jest.mock()` / `jest.fn()` | `jest.config.js`   |
| `packages/shared` | Vitest           | `vi.mock()` / `vi.fn()`     | `vitest.config.ts` |

> NUNCA usar `jest.fn()` en web/shared tests ni `vi.fn()` en mobile/API tests. Los test runners no son intercambiables.

**Coverage Thresholds por Workspace:**

| Workspace | Statements | Branches | Functions | Lines | Rationale                                                                                                             |
| --------- | ---------- | -------- | --------- | ----- | --------------------------------------------------------------------------------------------------------------------- |
| API       | 75         | 60       | 65        | 75    | Core de negocio — mayor rigor. Jest + ts-jest permite coverage preciso                                                |
| Web       | 70         | 70       | 65        | 70    | Pages excluidas del coverage (`page.tsx`, `layout.tsx`, `ui/**`). Hooks y componentes custom cubren el grueso         |
| Mobile    | 55         | 35       | 45        | 55    | jest-expo + react-native-reanimated mocks limitan cobertura de branches. Animaciones y gestures no son unit-testables |

Los thresholds se bumpen progresivamente al subir la cobertura real. El floor actual refleja la complejidad de cada runner, no una decision arbitraria. API > Web > Mobile es intencional.

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

| Anti-patron                                                          | Correcto                                                                            |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `this.prisma.user.findMany()` en un service                          | `this.usersRepository.findMany()`                                                   |
| `interface MyType { ... }` en `lib/api/*.ts`                         | `import type { MyType } from '@epde/shared'`                                        |
| `if (user.role === 'ADMIN')`                                         | `if (user.role === UserRole.ADMIN)`                                                 |
| `@Body() dto: CreateUserDto` (class-validator)                       | `@UsePipes(new ZodValidationPipe(schema)) @Body() data: Input`                      |
| `localStorage.setItem('token', ...)`                                 | Cookies HttpOnly (web) / SecureStore (mobile nativo) / sessionStorage (mobile web)  |
| `queryClient.invalidateQueries({ queryKey: ['dashboard'] })`         | `queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] })`               |
| `const sanitized = valid ? folder : 'default'` (fallback silencioso) | `throw new BadRequestException('Folder invalido')`                                  |
| `console.log(token)`                                                 | No loguear tokens                                                                   |
| `Float` en Prisma para montos                                        | `Decimal(14,2)`                                                                     |
| `onError` ausente en `useMutation`                                   | `onError: (err) => toast.error(getErrorMessage(err, 'fallback'))`                   |
| `onError` que restaura estado antes de mostrar feedback              | Feedback primero (`Alert.alert`/`toast.error`), restore despues                     |
| `set-password` sin verificar `purpose` claim                         | `if (payload.purpose !== 'invite') throw Unauthorized`                              |
| Logout: API call primero, luego limpiar estado                       | Limpiar estado local PRIMERO, luego API call                                        |
| `useQueryClient()` duplicado (store + componente)                    | `queryClient` singleton desde `lib/query-client.ts`                                 |
| `TypeScript enum`                                                    | `const obj as const` + `type Union`                                                 |
| `import { something } from '../../../shared'`                        | `import { something } from '@epde/shared'`                                          |
| `<button><Trash2 /></button>` (icon-only sin label)                  | `<button aria-label="Eliminar"><Trash2 /></button>`                                 |
| `<Label>Nombre</Label><Input />` (sin vincular)                      | `<Label htmlFor="name">Nombre</Label><Input id="name" />`                           |
| `<div onClick={fn}>` (clickeable sin teclado)                        | `<div role="button" tabIndex={0} onClick={fn} onKeyDown={handleEnterSpace}>`        |
| `<span className="text-red-600">Error</span>`                        | `<span className="text-destructive">Error</span>`                                   |
| `<div className="bg-white">`                                         | `<div className="bg-background">`                                                   |
| `<dl>` plano sin fondo ni iconos                                     | `bg-muted/40 rounded-lg p-4` + iconos Lucide en `<dt>`                              |
| Skeleton generico (`h-8 w-48` + `h-64 w-full`)                       | Skeleton estructurado que refleja layout real (PageHeader + Card + grid)            |
| `<p>Recurso no encontrado</p>` (texto plano)                         | Icon centrado `h-10 w-10` + texto + boton "Volver"                                  |
| Boton "Ver" en columna de tabla                                      | `onRowClick` en DataTable + titulo como `<Link>`                                    |
| Activity list con `<li>` planos                                      | Items con icon circle (`bg-muted rounded-full p-2`) + border card                   |
| `@Param('id') id: string` sin pipe en path params de entidad         | `@Param('id', ParseUUIDPipe) id: string`                                            |
| `useInfiniteQuery({...})` sin `maxPages`                             | `useInfiniteQuery({ ..., maxPages: 10 })`                                           |
| `const [debounced, setDebounced] = useState` con `useEffect` inline  | `const debouncedSearch = useDebounce(search, 300)`                                  |
| `Record<string, string>` anotación explícita en label/variant maps   | Solo `satisfies Record<EnumType, string>` (sin anotación, para preservar narrowing) |
| `Object.values(TaskType) as [string, ...string[]]` local en schema   | `TASK_TYPE_VALUES` de `@epde/shared` (SSoT en `enums.ts`)                           |
| Funciones API standalone con `apiClient.get()` por entidad           | `createXxxQueries(apiClient)` factory de `@epde/shared`                             |
| `DESIGN_TOKENS_LIGHT.success` en inline style (sin dark mode)        | CSS `var(--success)` (resuelve por tema automáticamente)                            |
