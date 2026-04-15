# ADR 013 — Política de imports entre módulos + enforcement automático

**Estado**: Aceptada
**Fecha**: 2026-04-15

## Contexto

EPDE tiene 28+ feature modules en `apps/api/src/*/`. El audit arquitectónico del 2026-04-15 identificó que el grafo de dependencias entre módulos **no está visualizado ni verificado** — un ciclo accidental se detecta recién al bootstrapear Nest, con un mensaje genérico que no apunta al edge culpable.

ADR-007 ya documentó un caso puntual (Tasks ↔ MaintenancePlans, resuelto con `PlanDataModule`). Esta ADR extrae la doctrina generalizada y la enforza en CI.

## Política de imports

### 1. Dirección preferida: **servicios → repositorios de otros módulos**

Si un servicio necesita datos de otro dominio, inyecta el repository directamente. No el service.

```ts
// ✅ BUENO — BudgetsService necesita verificar ownership, inyecta el repo
@Module({ imports: [PropertiesModule] })
// BudgetsService usa PropertiesRepository

// ❌ EVITAR — acopla a la lógica de negocio de properties
// BudgetsService usa PropertiesService
```

Rationale: los repos tienen superficie estable (CRUD + queries nombradas). Los services cambian con el negocio. Inyectar el repo minimiza el blast radius ante cambios.

### 2. Cuando dos módulos se necesitan mutuamente: `*DataModule`

Si A y B se necesitan bidireccionalmente, extraé un tercer módulo thin que exponga solo los repositories compartidos. Ver ADR-007 (`PlanDataModule`).

**NO usar `forwardRef()`** como primera opción. Es opaco, genera errores de inicialización difíciles de diagnosticar, y oculta el problema en lugar de resolverlo.

### 3. Scheduler → domain: permitido. Domain → scheduler: prohibido

Los cron services en `apps/api/src/scheduler/` consumen repos/services de domain modules. El flujo inverso está bloqueado por la ESLint rule `local/no-scheduler-import-from-domain`.

Rationale: crons son consumidores; domain nunca debería saber que existe un cron.

### 4. Servicios que inyectan servicios: permitido con JSDoc

Si un caso justifica inyectar un service de otro módulo (ej. `BudgetsService` ← `NotificationsHandlerService` para emitir eventos), documentar la razón en el `@Module({})` decorator del consumer. Ver `budgets.module.ts` como referencia.

## Enforcement

### Test automático: `apps/api/src/common/module-graph.spec.ts`

Parsea todos los `*.module.ts` bajo `apps/api/src` con TS Compiler API, construye el grafo dirigido de imports **internos** (ignora `@nestjs/*` y paquetes third-party), y corre Tarjan SCC. Falla CI si existe un ciclo, imprimiendo el path completo (`A → B → C → A`).

También verifica:

- Al menos 20 módulos descubiertos (detecta si el parser rompió)
- Ningún import referencia un módulo que el parser no encontró (coverage del parser)

### Cuándo el test falla

Si ves `Module import cycles detected: X → Y → X`:

1. **NO agregues `forwardRef()`** — oculta el problema, no lo resuelve
2. Opciones en orden de preferencia:
   - Extraé un `*DataModule` con solo el repository compartido (ADR-007)
   - Invertí la dependencia: el que emite datos publica un evento, el otro se suscribe
   - Si el ciclo es entre dos features muy acoplados (ej. Tasks + MaintenancePlans), reevaluá si son dos features o uno

## Consecuencias

**Positivo**

- Ciclos detectados en CI, antes de llegar a runtime
- Grafo de dependencias auditable vía el parser
- ADR-007 queda como caso concreto de este patrón general

**Negativo**

- Un nuevo contributor puede no conocer la política hasta que CI falla
- Parser asume estructura canónica de `@Module({ imports: [...] })` — si alguien usa sintaxis exótica (spread, función helper), el parser puede no verlo

## Cuándo revisitar

Si `apps/api/src/` gana modules fuera del pattern `<feature>/<feature>.module.ts` (ej. `core/`, `infrastructure/`), ajustar el parser para incluirlos.
