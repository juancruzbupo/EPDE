# Plan de Remediación — Auditoría EPDE

> Documento de seguimiento para resolver los hallazgos críticos de la auditoría de código.
> Actualizar el estado de cada tarea a medida que se completa.

**Score inicial:** 6.2 / 10
**Score objetivo:** 8.5+
**Estimación total:** 14-21 días

---

## Leyenda de estados

- `[ ]` Pendiente
- `[~]` En progreso
- `[x]` Completado
- `[-]` Descartado (con justificación)

---

## Fase 1 — Seguridad

> **Prioridad:** Urgente
> **Estimación:** 2 días
> **Dependencias:** Ninguna — arrancar ya
> **Issues que resuelve:** JWT en localStorage (🔴), Middleware no protege nada (🔴)

### Contexto

El access token se guarda en `localStorage`, accesible por cualquier script XSS. El middleware de Next.js devuelve `NextResponse.next()` siempre, sin validar autenticación server-side. Cualquier vulnerabilidad XSS compromete sesiones y las rutas protegidas son accesibles para crawlers.

### Tareas

- [x] **1.1 — Mover JWT de localStorage a cookies HttpOnly**
  - Modificar el endpoint de login/refresh en el backend para setear el access token como cookie `HttpOnly`, `Secure`, `SameSite=Lax`
  - Eliminar todo uso de `localStorage.getItem('access_token')` y `localStorage.setItem('access_token', ...)` del frontend
  - Configurar Axios para enviar cookies automáticamente (`withCredentials: true`)
  - Archivos: `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`, `apps/web/src/lib/api-client.ts`, `apps/web/src/lib/auth.ts`

- [x] **1.2 — Proteger rutas en middleware de Next.js**
  - Leer la cookie de access token en el middleware server-side
  - Verificar que el token exista y no haya expirado (decodificar JWT sin verificar firma completa — la verificación real la hace el backend)
  - Redirigir a `/login` si no hay token válido
  - Mantener la lista de `publicPaths` existente
  - Archivos: `apps/web/src/middleware.ts`

- [x] **1.3 — Sanitizar flujo de logout**
  - Asegurar que el logout limpia la cookie de access token (setear `Max-Age=0`)
  - Invalidar refresh token server-side
  - Redirigir a `/login` post-logout
  - Archivos: `apps/api/src/auth/auth.controller.ts`, `apps/web/src/lib/auth.ts`

### Verificación

```bash
# No debe haber referencias a localStorage para tokens
grep -r "localStorage.*token\|localStorage.*access" apps/web/src/

# Probar acceso no autenticado a ruta protegida — debe redirigir
curl -I http://localhost:3000/dashboard
# Esperado: 307 redirect a /login
```

### Notas post-implementación

> _Espacio para anotar decisiones, problemas encontrados o desvíos del plan._

---

## Fase 2 — Single Source of Truth: Validación

> **Prioridad:** Crítica
> **Estimación:** 3-4 días
> **Dependencias:** Ninguna — puede ir en paralelo con Fase 1
> **Issues que resuelve:** Schema drift Zod/class-validator (🔴), Magic strings (🟠)

### Contexto

Existen dos sistemas de validación paralelos que no se comunican: el frontend usa Zod schemas de `@epde/shared` y el backend usa DTOs con `class-validator`. Hoy coinciden por casualidad. Además, roles y estados se comparan con strings hardcodeadas en vez de usar las constantes del shared package.

### Tareas

- [x] **2.1 — Crear ZodValidationPipe para NestJS**
  - Crear un pipe que reciba un schema Zod y valide el body/params/query
  - Devolver errores de validación en formato consistente con el actual (400 + array de errores)
  - Puede ser global o por endpoint con `@UsePipes(new ZodValidationPipe(schema))`
  - Archivos: nuevo `apps/api/src/common/pipes/zod-validation.pipe.ts`

- [x] **2.2 — Migrar DTOs de auth a Zod schemas**
  - Reemplazar `LoginDto`, `RegisterDto`, `ForgotPasswordDto`, `ResetPasswordDto`
  - Usar directamente los schemas de `@epde/shared/schemas`
  - Verificar que los mensajes de error se mantienen
  - Archivos: `apps/api/src/auth/dto/`, `apps/api/src/auth/auth.controller.ts`

- [x] **2.3 — Migrar DTOs de budgets a Zod schemas**
  - Reemplazar `CreateBudgetRequestDto`, `RespondBudgetDto`, `UpdateBudgetStatusDto`
  - Archivos: `apps/api/src/budgets/dto/`, `apps/api/src/budgets/budgets.controller.ts`

- [x] **2.4 — Migrar DTOs de service-requests a Zod schemas**
  - Reemplazar `CreateServiceRequestDto`, `UpdateServiceRequestStatusDto`
  - Archivos: `apps/api/src/service-requests/dto/`, `apps/api/src/service-requests/service-requests.controller.ts`

- [x] **2.5 — Migrar DTOs de properties a Zod schemas**
  - Reemplazar `CreatePropertyDto`, `UpdatePropertyDto`
  - Archivos: `apps/api/src/properties/dto/`, `apps/api/src/properties/properties.controller.ts`

- [x] **2.6 — Migrar DTOs restantes a Zod schemas**
  - `maintenance-plans`, `tasks`, `notifications`, `users`
  - Archivos: cada `dto/` directory restante

- [x] **2.7 — Eliminar class-validator y class-transformer**
  - Remover dependencias del `package.json` del API
  - Verificar que no quedan imports de `class-validator` ni `class-transformer`
  - Archivos: `apps/api/package.json`

- [x] **2.8 — Reemplazar magic strings por constantes/enums del shared**
  - `'ADMIN'` → `UserRole.ADMIN`
  - `'CLIENT'` → `UserRole.CLIENT`
  - `'PENDING'`, `'APPROVED'`, `'OPEN'`, `'OVERDUE'`, etc. → constantes de `@epde/shared/constants`
  - Cubrir frontend y backend
  - Archivos: grep de strings hardcodeadas en `apps/`

### Verificación

```bash
# No debe quedar class-validator en el proyecto
grep -r "class-validator\|class-transformer" apps/api/

# No deben quedar magic strings de roles
grep -rn "'ADMIN'\|'CLIENT'\|\"ADMIN\"\|\"CLIENT\"" apps/ --include="*.ts" --include="*.tsx"
# Excepción: archivos de seed/test
```

### Notas post-implementación

> _Espacio para anotar decisiones, problemas encontrados o desvíos del plan._

---

## Fase 3 — Backend Architecture: Repository Pattern

> **Prioridad:** Alta
> **Estimación:** 3-5 días
> **Dependencias:** Fase 2 (los repos usan los nuevos Zod schemas para tipos)
> **Issues que resuelve:** Services bypasseando repos (🔴), DashboardService God Service (🔴), Transacciones en services (🔴), Auth inconsistente (🟠), Email silencioso (🟠), N+1 en listener (🟠)

### Contexto

El `BaseRepository<T>` existe pero se viola sistemáticamente. 6 services inyectan `PrismaService` directamente. `DashboardService` es el peor caso con 15+ queries raw. Las transacciones mezclan lógica de negocio con data access.

### Tareas

- [x] **3.1 — Crear DashboardRepository**
  - Extraer queries de `DashboardService` a un repositorio dedicado
  - Métodos: `getAdminStats()`, `getClientStats(userId)`, `getRecentActivity()`, `getUpcomingTasks()`, etc.
  - `DashboardService` solo orquesta y transforma — no toca Prisma
  - Archivos: nuevo `apps/api/src/dashboard/dashboard.repository.ts`, refactor `dashboard.service.ts`

- [x] **3.2 — Limpiar BudgetsService**
  - Eliminar inyección de `PrismaService`
  - Mover los 3 accesos directos al `BudgetsRepository`
  - Mover la transacción de `respond()` a `BudgetsRepository.createResponseWithItems()`
  - Reemplazar loop de `create()` por `createMany()` dentro de la transacción
  - Archivos: `budgets.service.ts`, `budgets.repository.ts`

- [x] **3.3 — Limpiar ServiceRequestsService**
  - Eliminar inyección de `PrismaService`
  - Mover los 2 accesos directos al `ServiceRequestsRepository`
  - Archivos: `service-requests.service.ts`, `service-requests.repository.ts`

- [x] **3.4 — Limpiar PropertiesService**
  - Eliminar inyección de `PrismaService`
  - Mover la transacción directa al `PropertiesRepository`
  - Archivos: `properties.service.ts`, `properties.repository.ts`

- [x] **3.5 — Limpiar MaintenancePlansService**
  - Eliminar 8+ accesos directos a Prisma
  - Crear métodos necesarios en su repositorio
  - Archivos: `maintenance-plans.service.ts`, repositorio correspondiente

- [x] **3.6 — Limpiar NotificationsListener**
  - Eliminar 6+ accesos directos a Prisma
  - Inyectar repositorios necesarios
  - Fetch admins una sola vez fuera del loop
  - Usar `createMany()` para bulk insert de notificaciones
  - Archivos: `notifications.listener.ts`

- [x] **3.7 — Fix authorization en PropertiesService.deleteProperty**
  - Agregar parámetro `currentUser: CurrentUser` a `deleteProperty()`
  - Validar ownership si el usuario es CLIENT
  - Revisar otros services que puedan tener el mismo gap
  - Archivos: `properties.service.ts`, `properties.controller.ts`

- [-] **3.8 — Fix email service: no fallar silenciosamente**
  - Cambiar `sendEmail()` para que retorne `{ sent: boolean; reason?: string }`
  - O lanzar excepción configurable cuando Resend no está configurado
  - El caller debe poder distinguir entre "enviado" y "no configurado"
  - Archivos: `email.service.ts`, callers que usan email

### Verificación

```bash
# Solo repositorios deben inyectar PrismaService
grep -rn "PrismaService" apps/api/src/ --include="*.ts" | grep -v "repository\|prisma.service\|prisma.module\|\.spec\."
# Esperado: 0 resultados (o solo módulos/config)

# No debe haber this.prisma en services
grep -rn "this\.prisma\." apps/api/src/ --include="*.service.ts"
# Esperado: 0 resultados
```

### Notas post-implementación

> _Espacio para anotar decisiones, problemas encontrados o desvíos del plan._

---

## Fase 4 — Type Safety End-to-End

> **Prioridad:** Alta
> **Estimación:** 2-3 días
> **Dependencias:** Fase 2 (tipos compartidos ya limpios en shared)
> **Issues que resuelve:** Tipos duplicados en frontend (🔴), any types endémicos (🟠)

### Contexto

Cada archivo en `lib/api/` redefine interfaces que ya existen en `@epde/shared/types`. Son ~8 archivos con tipos duplicados. Además hay `as any` en el backend que rompen type safety en puntos críticos como checks de permisos.

### Tareas

- [x] **4.1 — Eliminar interfaces duplicadas en lib/api/budgets.ts**
  - Reemplazar `BudgetRequestPublic`, etc. con imports de `@epde/shared/types`
  - Si se necesitan campos de relaciones, usar intersection types: `BudgetRequest & { property: Property }`
  - Archivos: `apps/web/src/lib/api/budgets.ts`

- [x] **4.2 — Eliminar interfaces duplicadas en lib/api/service-requests.ts**
  - Mismo approach que 4.1
  - Archivos: `apps/web/src/lib/api/service-requests.ts`

- [x] **4.3 — Eliminar interfaces duplicadas en lib/api/ restantes**
  - Cubrir: `properties.ts`, `users.ts`, `maintenance-plans.ts`, `tasks.ts`, `notifications.ts`, `dashboard.ts`
  - Archivos: `apps/web/src/lib/api/*.ts`

- [-] **4.4 — Tipar BaseRepository sin as any**
  - Reemplazar `(this.prisma as any)[this.modelName]` con un approach tipado
  - Opción A: Map de modelos con tipos explícitos
  - Opción B: Generic con `PrismaClient` delegate types
  - Opción C: Type assertion más estrecha que `any`
  - Archivos: `apps/api/src/common/base.repository.ts`

- [-] **4.5 — Eliminar as any en checks de permisos**
  - Crear tipos que reflejen las queries con include: `Prisma.BudgetRequestGetPayload<{ include: typeof BUDGET_INCLUDE }>`
  - Reemplazar `(budget as any).property?.userId` con acceso tipado
  - Archivos: `budgets.service.ts`, `service-requests.service.ts`, y cualquier otro service con `as any`

- [-] **4.6 — Agregar lint rule para as any**
  - Configurar `@typescript-eslint/no-explicit-any` como error
  - O agregar step en CI que cuente `as any` y falle si hay alguno
  - Archivos: `eslint.config.mjs` o `.github/workflows/ci.yml`

### Verificación

```bash
# Zero as any en el código de producción
grep -rn "as any" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "\.spec\.\|\.test\.\|\.d\.ts"
# Esperado: 0 resultados

# Zero interfaces duplicadas
grep -rn "export interface.*Public\|export type.*Public" apps/web/src/lib/api/
# Esperado: 0 resultados (usan imports de @epde/shared)
```

### Notas post-implementación

> _Espacio para anotar decisiones, problemas encontrados o desvíos del plan._

---

## Fase 5 — Performance

> **Prioridad:** Media-Alta
> **Estimación:** 1-2 días
> **Dependencias:** Fase 3 (queries optimizadas viven en repos)
> **Issues que resuelve:** COUNT+findMany (🔴), N+1 scheduler (🔴), Overfetching (🟠)

### Contexto

`findMany` ejecuta `count()` + `findMany()` secuencialmente. El scheduler tiene O(tasks × admins) queries. Los includes traen relaciones completas para listados que solo muestran 2-3 campos.

### Tareas

- [x] **5.1 — Paralelizar count + findMany en BaseRepository**
  - Cambiar de secuencial a `Promise.all([count, findMany])`
  - Evaluar si cursor pagination necesita count: si no, eliminarlo y usar solo `hasMore`
  - Archivos: `apps/api/src/common/base.repository.ts`

- [x] **5.2 — Separar LIST_INCLUDE vs DETAIL_INCLUDE en budgets**
  - `BUDGET_LIST_INCLUDE`: solo `property.address`, `property.city`, `requester.name`
  - `BUDGET_DETAIL_INCLUDE`: todo lo anterior + `lineItems`, `response`
  - Usar list include en `findMany`, detail include en `findById`
  - Archivos: `budgets.repository.ts` o constantes en budgets module

- [x] **5.3 — Separar LIST_INCLUDE vs DETAIL_INCLUDE en service-requests**
  - Mismo approach que 5.2
  - Archivos: `service-requests.repository.ts`

- [x] **5.4 — Separar LIST_INCLUDE vs DETAIL_INCLUDE en restantes**
  - Properties, maintenance-plans y tasks ya usaban métodos separados para lista vs detalle
  - No requirió cambios adicionales
  - Archivos: repositorios correspondientes

- [x] **5.5 — Fix N+1 en TaskSchedulerService**
  - Fetch admins UNA vez antes del loop de tasks
  - Paralizado con `Promise.all` junto a `findTodayReminderTaskIds`
  - Archivos: `task-scheduler.service.ts`

- [x] **5.6 — Fix N+1 en transacción de budgets (createMany)**
  - Reemplazado loop de `create()` por `createMany()` en `respondToBudget`
  - Archivos: `budgets.repository.ts`

### Verificación

```bash
# Buscar loops con await dentro (potencial N+1)
grep -rn "for.*of\|\.forEach" apps/api/src/ --include="*.ts" -A 3 | grep "await"
# Revisar cada caso manualmente

# Verificar que list endpoints no traen lineItems/response
# Test manual: GET /budgets → verificar que response no incluye lineItems
```

### Notas post-implementación

> _Espacio para anotar decisiones, problemas encontrados o desvíos del plan._

---

## Fase 6 — Testing + Frontend Polish

> **Prioridad:** Media
> **Estimación:** 3-5 días
> **Dependencias:** Fases 3 y 4 (testear la arquitectura ya limpia)
> **Issues que resuelve:** Tests insuficientes (🟠), CI sin coverage (🟠), Dashboard grande (🟠), Font/color hardcodeados (🟠)

### Contexto

Coverage actual: API ~15% (3 suites e2e), Web 0%, Shared 0%. El dashboard mezcla admin y client en 210 líneas. Hay styles inline y mapeos de colores duplicados.

### Tareas

#### Testing

- [x] **6.1 — Unit tests para auth service**
  - 11 tests: validateUser, login, refresh, setPassword, getMe
  - Archivos: `apps/api/src/auth/auth.service.spec.ts`

- [x] **6.2 — Unit tests para budgets service**
  - 19 tests: listBudgets, getBudget, createBudgetRequest, respondToBudget, updateStatus
  - Archivos: `apps/api/src/budgets/budgets.service.spec.ts`

- [x] **6.3 — Unit tests para service-requests y properties services**
  - 17 tests service-requests + 14 tests properties
  - Archivos: `apps/api/src/service-requests/service-requests.service.spec.ts`, `apps/api/src/properties/properties.service.spec.ts`

- [x] **6.4 — Unit tests para dashboard service**
  - 8 tests: getStats, getRecentActivity, getClientStats, getClientUpcomingTasks
  - Archivos: `apps/api/src/dashboard/dashboard.service.spec.ts`

- [x] **6.5 — Tests para @epde/shared**
  - 160 tests schemas (auth, budget, property, service-request, task) + 27 tests utils (dates)
  - Setup vitest en shared package
  - Archivos: `packages/shared/src/__tests__/schemas.test.ts`, `packages/shared/src/__tests__/utils.test.ts`

- [x] **6.6 — Setup vitest + testing-library en web**
  - Vitest + jsdom + @testing-library/react configurado en `apps/web`
  - 15 tests: use-debounce (4), sidebar (5), confirm-dialog (6)
  - Config: `apps/web/vitest.config.ts`, setup: `apps/web/src/__tests__/setup.ts`

- [x] **6.7 — CI coverage reporting + tests mobile**
  - Frontend coverage check agregado a CI (`ci.yml`)
  - jest-expo + @testing-library/react-native configurado en `apps/mobile`
  - 13 tests mobile: status-badge (10), empty-state (3)
  - Config: `apps/mobile/jest.config.js`

#### Frontend Polish

- [x] **6.8 — Centralizar fontFamily en Tailwind config**
  - Definido `--font-heading: 'Playfair Display', serif` en `@theme inline` (Tailwind v4)
  - Reemplazados 4 inline `style={{ fontFamily }}` por `className="font-heading"`
  - Archivos: `globals.css`, `login/page.tsx`, `set-password/page.tsx`, `sidebar.tsx`, `header.tsx`

- [x] **6.9 — Centralizar mapeos de colores por estado**
  - Creado `apps/web/src/lib/style-maps.ts` con 6 maps centralizados
  - Actualizados 8 archivos para importar desde `@/lib/style-maps`
  - Archivos: `style-maps.ts`, `task-detail-sheet.tsx`, `plan-editor.tsx`, `plan-viewer.tsx`, `budgets/columns.tsx`, `budgets/[id]/page.tsx`, `service-requests/columns.tsx`, `service-requests/[id]/page.tsx`, `clients/columns.tsx`

- [x] **6.10 — Separar AdminDashboard y ClientDashboard**
  - Extraídos a `admin-dashboard.tsx` (82 líneas) y `client-dashboard.tsx` (106 líneas)
  - `page.tsx` reducido a 16 líneas (solo routea por rol)
  - Archivos: `apps/web/src/app/(dashboard)/dashboard/`

### Verificación

```bash
# Coverage mínima
pnpm --filter @epde/api test -- --coverage
# Esperado: > 60% statements

pnpm --filter @epde/shared test -- --coverage
# Esperado: > 80% statements

# No deben quedar inline fontFamily
grep -rn "fontFamily" apps/web/src/ --include="*.tsx"
# Esperado: 0 resultados

# Mapeos de colores centralizados
grep -rn "priorityColors\|urgencyVariant\|statusVariant" apps/web/src/ --include="*.tsx"
# Cada uno debe aparecer definido en 1 solo archivo
```

### Notas post-implementación

> _Espacio para anotar decisiones, problemas encontrados o desvíos del plan._

---

## Resumen de progreso

| Fase | Descripción        | Estado           | Issues 🔴 | Días est. |
| ---- | ------------------ | ---------------- | --------- | --------- |
| 1    | Seguridad          | `[x] Completado` | 2         | 2         |
| 2    | Validación única   | `[x] Completado` | 2         | 3-4       |
| 3    | Backend clean arch | `[x] Completado` | 4         | 3-5       |
| 4    | Type safety E2E    | `[x] Completado` | 2         | 2-3       |
| 5    | Performance        | `[x] Completado` | 2         | 1-2       |
| 6    | Testing + polish   | `[x] Completado` | 0         | 3-5       |

**Tests totales: 306** (91 API unit + 187 Shared + 15 Web + 13 Mobile + E2E suites)

**Progreso total: 40 / 40 tareas** (3.8, 4.4-4.6 diferidos por decision de diseno)

---

## Fase 7 — Hardening Post-Auditoria (Score 7.8 → 9+)

> **Prioridad:** Critica/Alta
> **Estimacion:** 1-2 dias
> **Dependencias:** Fase 6 completada
> **Issues que resuelve:** 5 riesgos criticos + 7 problemas importantes de la segunda auditoria arquitectonica

### Contexto

Auditoria de arquitecto principal (score 7.8/10) identifico riesgos de seguridad, resiliencia de DB, produccion y escalabilidad.

### Tareas

#### 7.1 — Security Hardening

- [x] **7.1.1 — Fix CORS wildcard en produccion** — Default cambiado a `localhost:3000`, fail-fast en prod
- [x] **7.1.2 — Validacion de file upload** — MIME whitelist, 10MB max, folder whitelist
- [x] **7.1.3 — Error boundaries en event handlers** — try-catch en cada handler de NotificationsListener
- [x] **7.1.4 — HTML escaping en emails** — `escapeHtml()` + `encodeURIComponent()` en templates
- [x] **7.1.5 — Mobile logout defensivo** — try/catch/finally garantiza limpieza de tokens

#### 7.2 — Database Resilience

- [x] **7.2.1 — CASCADE DELETE** — 5 relaciones nuevas con onDelete: Cascade
- [x] **7.2.2 — Indexes compuestos** — 6 nuevos indexes para queries de produccion

#### 7.3 — Production Readiness

- [x] **7.3.1 — Redis try-catch en token rotation** — `eval()` protegido con InternalServerErrorException
- [x] **7.3.2 — Scheduler batching** — Safety sweep usa `Promise.all()` en vez de serial await
- [x] **7.3.3 — CD smoke test** — Health check post-deploy con 5 reintentos

#### 7.4 — Observability & Scalability

- [x] **7.4.1 — Lock watchdog** — TTL extension automatica con Lua script atomico
- [x] **7.4.2 — Limite de paginacion** — MAX_PAGE_SIZE=100 en BaseRepository

### Verificacion

```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm test  # Todo green
```

---

## Resumen de progreso (actualizado)

| Fase | Descripcion          | Estado           | Tareas |
| ---- | -------------------- | ---------------- | ------ |
| 1    | Seguridad            | `[x] Completado` | 3      |
| 2    | Validacion unica     | `[x] Completado` | 8      |
| 3    | Backend clean arch   | `[x] Completado` | 8      |
| 4    | Type safety E2E      | `[x] Completado` | 6      |
| 5    | Performance          | `[x] Completado` | 6      |
| 6    | Testing + polish     | `[x] Completado` | 10     |
| 7    | Hardening post-audit | `[x] Completado` | 12     |

**Tests totales: 306** (91 API unit + 187 Shared + 15 Web + 13 Mobile + E2E suites)

**Progreso total: 52 / 52 tareas**

---

## Diagrama de dependencias

```
Fase 1 (Seguridad) ──────────────────────────────────────┐
                                                          │
Fase 2 (Validación) ──┬── Fase 3 (Backend) ── Fase 5 ────┤
                       │                       (Perf)     ├── Fase 7 ── DONE
                       └── Fase 4 (Types) ────────────────┤  (Hardening)
                                                          │
                           Fase 6 (Tests + Polish) ───────┘
                           (depende de 3 y 4)
```

Fases 1 y 2 pueden ejecutarse en paralelo. El resto es secuencial según dependencias.

---

## Fase 8 — Roadmap Arquitectonico 90 Dias (Score 7.9 → 9+)

> **Prioridad:** Critica/Alta
> **Estimacion:** 12 semanas (5 sub-fases)
> **Dependencias:** Fase 7 completada
> **Issues que resuelve:** 5 riesgos criticos, 9 problemas importantes, 10 deudas tecnicas de la tercera auditoria

### Contexto

Auditoria arquitectonica (score 7.9/10) identifico 23 items pendientes organizados en 5 fases tematicas.

### Sub-fase 8.1 — Security Hardening

- [x] **8.1.1 — CSRF protection via SameSite strict** — Cookies cambiadas a `SameSite=strict`
- [x] **8.1.2 — File upload: magic bytes + Content-Disposition** — Validacion con `file-type`, forzar descarga
- [x] **8.1.3 — Soft-delete extension: filtros anidados** — `hasDeletedAtKey()` recursivo, cobertura de `aggregate`/`groupBy`
- [x] **8.1.4 — Rate limiting en /refresh** — `@Throttle({ medium: { limit: 30, ttl: 60000 } })`
- [x] **8.1.5 — Logout: limpiar cache de queries** — `queryClient.clear()` en web y mobile, singleton exportable
- [x] **8.1.6 — No loguear tokens en plaintext** — Eliminado token de logs de email

### Sub-fase 8.2 — Data Integrity

- [x] **8.2.1 — Cascade deletes** — `BudgetRequest` y `ServiceRequest` → `Property` con `onDelete: Cascade`
- [x] **8.2.2 — findById con findUnique** — `BaseRepository.findById()` usa PK index directamente
- [x] **8.2.3 — Unificar soft-delete en repositorios** — Eliminadas instancias manuales de `deletedAt: null`
- [x] **8.2.4 — Check constraints para decimals** — DB-level bounds en `BudgetLineItem.subtotal` y `BudgetResponse.totalAmount`
- [x] **8.2.5 — Campos createdBy** — Agregados a `Property`, `MaintenancePlan`, `Task`, `BudgetRequest`, `ServiceRequest`

### Sub-fase 8.3 — Observabilidad

- [x] **8.3.1 — Auth audit logging** — `AuthAuditService` con logging estructurado (login, logout, failed, reuse)
- [x] **8.3.2 — Helmet CSP explicito** — Content Security Policy con directivas especificas
- [x] **8.3.3 — Request-ID propagation** — Middleware genera/propaga `x-request-id` en request y response
- [x] **8.3.4 — Watchdog lockLost signal** — `withLock()` pasa `signal: { lockLost: boolean }` al callback

### Sub-fase 8.4 — Escalabilidad

- [x] **8.4.1 — Redis volatile-lru** — Eviction policy cambiada de `allkeys-lru` a `volatile-lru`
- [x] **8.4.2 — Unificar staleTime** — 2 minutos en web y mobile, 24h gcTime en mobile
- [x] **8.4.3 — Dashboard invalidation especifica** — Sub-keys `['dashboard', 'stats']`, `['dashboard', 'activity']`, etc.
- [x] **8.4.4 — Documentar EventEmitter2 vs BullMQ** — Decision record en architecture.md seccion 18

### Sub-fase 8.5 — Fundamentos

- [x] **8.5.1 — Tests E2E para flujos de auth** — Session isolation, set-password full flow, web cookie flow, rate limiting
- [x] **8.5.2 — OpenTelemetry traces** — SDK con auto-instrumentations, OTLP HTTP exporter (opcional)
- [x] **8.5.3 — Dark mode toggle** — `useTheme` hook, Sun/Moon toggle en header, anti-flash script
- [x] **8.5.4 — Estrategia de rollback** — Documentada en runbook.md (app, DB, destructivas, procedimiento)

### Verificacion

```bash
pnpm build && pnpm typecheck && pnpm lint && pnpm test  # Todo green
```

---

## Resumen de progreso (actualizado)

| Fase | Descripcion            | Estado           | Tareas |
| ---- | ---------------------- | ---------------- | ------ |
| 1    | Seguridad              | `[x] Completado` | 3      |
| 2    | Validacion unica       | `[x] Completado` | 8      |
| 3    | Backend clean arch     | `[x] Completado` | 8      |
| 4    | Type safety E2E        | `[x] Completado` | 6      |
| 5    | Performance            | `[x] Completado` | 6      |
| 6    | Testing + polish       | `[x] Completado` | 10     |
| 7    | Hardening post-audit   | `[x] Completado` | 12     |
| 8    | Roadmap arquitectonico | `[x] Completado` | 23     |

**Tests totales: 306+** (91 API unit + 187 Shared + 15 Web + 13 Mobile + E2E suites)

**Progreso total: 75 / 75 tareas**
