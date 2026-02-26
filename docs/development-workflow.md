# Workflow de Desarrollo

Guia de referencia para desarrollo con AI y humanos.

## Comandos Principales

```bash
pnpm install          # Instalar dependencias
pnpm dev              # Levantar API + Web + Shared (watch)
pnpm dev:mobile       # Levantar Expo dev server
pnpm build            # Build de produccion (todos los workspaces)
pnpm lint             # ESLint en todos los workspaces
pnpm typecheck        # TypeScript check en todos los workspaces
pnpm test             # Tests unitarios (API jest, Shared vitest, Web vitest, Mobile jest-expo)

# Tests e2e (requiere DB + Redis corriendo)
pnpm --filter @epde/api test:e2e

# Workspace especifico
pnpm --filter @epde/api <comando>
pnpm --filter @epde/web <comando>
pnpm --filter @epde/mobile <comando>
pnpm --filter @epde/shared <comando>

# Prisma
pnpm --filter @epde/api exec prisma migrate dev     # Crear migracion
pnpm --filter @epde/api exec prisma db push          # Push schema sin migracion
pnpm --filter @epde/api exec prisma db seed           # Seed data
pnpm --filter @epde/api exec prisma studio            # UI de BD
```

## Convenciones de Codigo

### Estructura de Archivos

| Tipo              | Convención                | Ejemplo                          |
| ----------------- | ------------------------- | -------------------------------- |
| Componentes React | kebab-case                | `invite-client-dialog.tsx`       |
| Hooks             | `use-` prefix, kebab-case | `use-clients.ts`                 |
| API functions     | kebab-case                | `service-requests.ts`            |
| NestJS modules    | kebab-case directorio     | `service-requests/`              |
| NestJS files      | kebab-case con sufijo     | `service-requests.controller.ts` |
| Zod schemas       | kebab-case                | `service-request.ts`             |
| Constantes        | SCREAMING_SNAKE_CASE      | `BUDGET_STATUS_LABELS`           |
| Enums TypeScript  | PascalCase                | `BudgetStatus`                   |
| Interfaces        | PascalCase                | `CreateBudgetRequestInput`       |

### Imports

```typescript
// 1. Librerias externas
import { Injectable } from '@nestjs/common';
import { useQuery } from '@tanstack/react-query';

// 2. Paquete compartido
import { createBudgetRequestSchema } from '@epde/shared';

// 3. Imports internos con alias @/
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
```

### TypeScript

- Strict mode habilitado
- No usar `any` sin `eslint-disable` comment explicito
- Preferir interfaces sobre types para objetos
- Usar `as const` para objetos constantes

## Crear un Nuevo Modulo (Backend)

### 1. Crear archivos

```
apps/api/src/my-feature/
  my-feature.module.ts
  my-feature.controller.ts
  my-feature.service.ts
  my-feature.repository.ts
  my-feature.service.spec.ts
```

### 2. Modelo Prisma

Agregar en `apps/api/prisma/schema.prisma` y ejecutar `prisma migrate dev`.

### 3. Repository

```typescript
@Injectable()
export class MyFeatureRepository extends BaseRepository<MyModel> {
  constructor(prisma: PrismaService) {
    super(prisma, 'myModel', false); // true si necesita soft delete
  }
}
```

### 4. Service

```typescript
@Injectable()
export class MyFeatureService {
  constructor(private readonly repository: MyFeatureRepository) {}
  // Logica de negocio aqui. NO inyectar PrismaService — solo el repository accede a datos.
}
```

### 5. Controller

```typescript
@ApiTags('Mi Feature')
@ApiBearerAuth()
@Controller('my-feature')
export class MyFeatureController {
  constructor(private readonly service: MyFeatureService) {}

  @Get()
  list(@Query() filters: FiltersDto, @CurrentUser() user) {
    return this.service.list(filters, user);
  }

  @Post()
  @Roles('ADMIN') // o 'CLIENT', o sin decorator para ambos
  create(@Body() dto: CreateDto, @CurrentUser() user) {
    return this.service.create(dto, user.id);
  }
}
```

### 6. Validacion (Zod — SSoT compartido)

Los schemas Zod en `@epde/shared` son el unico SSoT. El backend valida via `ZodValidationPipe`:

```typescript
// En el controller
@Post()
@UsePipes(new ZodValidationPipe(createMyFeatureSchema))
create(@Body() data: CreateMyFeatureInput, @CurrentUser() user) {
  return this.service.create(data, user.id);
}
```

No se usan DTOs con class-validator. Los tipos se infieren del schema Zod:

```typescript
// packages/shared/src/schemas/my-feature.ts
export const createMyFeatureSchema = z.object({ ... });
export type CreateMyFeatureInput = z.infer<typeof createMyFeatureSchema>;
```

### 7. Module

```typescript
@Module({
  imports: [PrismaModule],
  providers: [MyFeatureService, MyFeatureRepository],
  controllers: [MyFeatureController],
})
export class MyFeatureModule {}
```

### 8. Registrar en AppModule

Agregar `MyFeatureModule` al array `imports` en `app.module.ts`.

## Crear una Nueva Pagina (Frontend)

### 1. Ruta y pagina

```
apps/web/src/app/(dashboard)/my-feature/
  page.tsx            # Listado
  columns.tsx         # Definicion de columnas
  [id]/
    page.tsx          # Detalle
  create-dialog.tsx   # Dialog de creacion (si aplica)
```

### 2. API functions

```typescript
// lib/api/my-feature.ts
import { apiClient } from './client';
import type { PaginatedResponse, MyFeature } from '@epde/shared';

export async function getMyFeatures(params?) {
  const { data } = await apiClient.get<PaginatedResponse<MyFeature>>('/my-feature', { params });
  return data;
}
```

**Nota:** Los tipos publicos de la API se definen en `@epde/shared/types`, no como interfaces locales en cada archivo.

### 3. React Query hooks

```typescript
// hooks/use-my-feature.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMyFeatures(filters?) {
  return useQuery({
    queryKey: ['my-features', filters],
    queryFn: () => getMyFeatures(filters),
  });
}

export function useCreateMyFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMyFeature,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-features'] });
      // Invalidar solo sub-keys especificas del dashboard (no todo ['dashboard'])
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] });
    },
  });
}
```

**Nota:** El `queryClient` es un singleton exportado desde `lib/query-client.ts` (tanto en web como en mobile). Esto permite que el auth store haga `queryClient.clear()` en logout sin depender del React context. El `QueryProvider` importa ese mismo singleton.

### 4. Pagina con DataTable

```tsx
'use client';

export default function MyFeaturePage() {
  const router = useRouter();
  const [filters, setFilters] = useState({});
  const { data, isLoading } = useMyFeatures(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mi Feature</h1>
        <CreateDialog />
      </div>
      <DataTable
        columns={myColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        hasMore={data?.hasMore}
        total={data?.total}
        onRowClick={(row) => router.push(`/my-feature/${row.id}`)}
      />
    </div>
  );
}
```

### 5. Agregar a navegacion

En `components/layout/sidebar.tsx`, agregar item al array de navegacion correspondiente (admin o client).

## Agregar un Schema Compartido

### 1. Crear schema Zod

```typescript
// packages/shared/src/schemas/my-feature.ts
import { z } from 'zod';

export const createMyFeatureSchema = z.object({
  title: z.string().min(3, 'El titulo debe tener al menos 3 caracteres'),
  description: z.string().optional(),
});

export type CreateMyFeatureInput = z.infer<typeof createMyFeatureSchema>;
```

### 2. Exportar

Agregar `export * from './my-feature';` en `packages/shared/src/schemas/index.ts`.

### 3. Rebuild shared

```bash
pnpm --filter @epde/shared build
```

O si `pnpm dev` esta corriendo, tsup watch lo detecta automaticamente.

## Shared Package

### Exports disponibles

```typescript
import { createBudgetRequestSchema } from '@epde/shared'; // schemas
import { BUDGET_STATUS_LABELS } from '@epde/shared'; // constants
import type { BudgetRequest, BudgetStatus } from '@epde/shared'; // types
import { formatRelativeDate, isOverdue } from '@epde/shared'; // utils

// O imports especificos por path
import { createBudgetRequestSchema } from '@epde/shared/schemas';
import type { BudgetRequest } from '@epde/shared/types';
```

### Notas

- El shared package se builda con tsup (ESM + CJS + .d.ts)
- En modo dev, `tsup --watch` rebuilda automaticamente
- **Siempre rebuildar shared** si cambiaron schemas y no esta en modo watch
- El API (NestJS) consume como CommonJS, el Web (Next.js) como ESM

## Git y Commits

### Commitlint

El proyecto usa commitlint con convencion conventional commits:

```
tipo(scope): descripcion en minuscula

Cuerpo opcional (lineas max 100 chars)
```

**Tipos:** `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `ci`

**Reglas:**

- Subject en minuscula (no `fix: Add feature`, si `fix: add feature`)
- No camelCase en subject (no `fix: add userId field`, si `fix: add user id field`)
- Lineas del body max 100 caracteres
- No punto al final del subject

### Branching

- `main` — branch principal
- Feature branches: `feat/<nombre>`, `fix/<nombre>`

## Variables de Entorno

Referencia completa en [env-vars.md](env-vars.md).

### Archivos de ejemplo

- `apps/api/.env.example` — Variables del API
- `apps/web/.env.local` — Variables del frontend

### Notas importantes

- Variables `NEXT_PUBLIC_*` se resuelven en **build time** — reiniciar dev server despues de cambiar
- La app mobile auto-detecta la URL del API en desarrollo (no requiere `.env`)
- En produccion, configurar `CORS_ORIGIN` para restringir origenes permitidos

## Troubleshooting

### Errores comunes

| Error                                        | Causa                                | Solucion                              |
| -------------------------------------------- | ------------------------------------ | ------------------------------------- |
| `Cannot find module dist/main`               | API no buildeada                     | `pnpm --filter @epde/api build`       |
| `Module not found @/components/ui/x`         | Componente nuevo sin restart         | Reiniciar dev server                  |
| `Unique constraint on (email)`               | Email existe (incluido soft-deleted) | Usar `writeModel` en repository       |
| `NEXT_PUBLIC_* undefined`                    | Env var no disponible                | Reiniciar dev server                  |
| Port 3000/3001 in use                        | Proceso previo corriendo             | `lsof -ti:3000,3001 \| xargs kill -9` |
| `z.coerce.number()` falla con ""             | Empty string → 0 → falla min()       | Usar `setValueAs` en form register    |
| `z.string().datetime()` falla con date input | Input retorna YYYY-MM-DD             | Usar `z.string().date()`              |
| Permission check falla (403)                 | Falta campo en Prisma `select`       | Agregar campo (ej: `userId: true`)    |
| Redis connection refused                     | Redis no esta corriendo              | `docker compose up -d`                |
| Port 8081 in use                             | Expo ya corriendo                    | `lsof -ti:8081 \| xargs kill -9`      |

## Testing

### Unit Tests

```bash
pnpm test                                    # Todos (API + Shared + Web + Mobile)
pnpm --filter @epde/api test                 # Solo API (jest --runInBand)
pnpm --filter @epde/shared test              # Solo Shared (vitest)
pnpm --filter @epde/web test                 # Solo Web (vitest + jsdom)
pnpm --filter @epde/mobile test              # Solo Mobile (jest-expo)
```

- **API**: Jest con mocks de repositorios (no accede a DB). `--runInBand` evita conflictos
- **Shared**: Vitest — schemas Zod + utils
- **Web**: Vitest + jsdom + @testing-library/react — hooks y componentes
- **Mobile**: jest-expo + @testing-library/react-native — componentes

Total: 306 tests (91 API + 187 Shared + 15 Web + 13 Mobile)

### Tests E2E

```bash
# Requiere: Docker (PostgreSQL + Redis) corriendo
docker compose up -d
pnpm --filter @epde/api test:e2e
```

- Config: `apps/api/jest-e2e.config.ts`
- Setup: `apps/api/src/test/setup.ts` — helpers `createTestApp()`, `cleanDatabase()` (TRUNCATE CASCADE)
- Pattern: `*.e2e-spec.ts` en `apps/api/test/`
- Suites: auth, auth-flows (session isolation, rate limiting), budgets, properties, service-requests, token-rotation, budget-concurrency
- Timeout: 30 segundos por test
- La limpieza usa `TRUNCATE CASCADE` (no `deleteMany`) para evitar race conditions con event handlers asincronos

### CI

GitHub Actions ejecuta en orden: lint → typecheck → build → test → test:e2e → frontend coverage check. Los services PostgreSQL 16 y Redis 7 se levantan como containers en CI.

### CD

Deploy automatico via GitHub Actions:

- **Produccion** (`cd.yml`): trigger en push a `main`
  - API → Railway (`railway up --service epde-api`) con migraciones Prisma previas
  - **Smoke test post-deploy**: 5 reintentos de health check con 15s backoff. Falla el workflow si no responde 200
  - Web → Vercel (`vercel deploy --prebuilt --prod`)
- **Staging** (`cd-staging.yml`): trigger en push a `develop`
  - Misma pipeline con secrets de staging
