# ADR-021: Criterios para exportar repositorios desde un módulo

## Estado

Aceptada — formaliza la práctica vigente desde abril 2026.

## Contexto

Durante la auditoría arquitectónica de 2026-04-19 se observó inconsistencia en los `exports` de módulos NestJS: algunos exportan solo el service (`ClientsModule.exports = [ClientsService]`), otros exportan service + repositorios (`BudgetsModule.exports = [BudgetsService, BudgetsRepository, BudgetAuditLogRepository]`). Sin criterio explícito, un dev nuevo no sabe si debe exportar el repo cuando crea un módulo, ni por qué.

Dos problemas que genera esto:

1. **Fricción cuando otro módulo necesita leer cross-model**: el dev modifica el módulo origen para exportar el repo. Cambio atómico aceptable, pero acumulativo (con 15 módulos, el 50% de los módulos tiene exports "por si acaso").
2. **Over-export gratis**: exportar un repo que nadie consume exterior es superficie de API innecesaria. Refactors internos (rename de métodos del repo) se propagan a consumers imaginarios.

## Decisión

**Regla**: un módulo exporta su repositorio **solo si cumple ambos criterios**:

1. El repo es **consumido por 2+ módulos externos** (no contando el propio).
2. El docstring del módulo documenta explícitamente **qué consumers lo usan y por qué no pueden obtener la data de otra forma** (el service).

**Corolario**: si solo un módulo externo lo necesita, evaluar alternativas antes de exportar:

- ¿El dato se puede pedir al service del módulo origen? (preferido)
- ¿Es una lectura cross-model que pertenece al dashboard read-models (ADR-011 cross-model)?
- ¿Es una operación que debería exponerse como endpoint HTTP en vez de cross-module?

Si tras descartar las 3 opciones el export sigue siendo la respuesta correcta, es de 1 consumer — OK, pero documentar el razonamiento.

## Aplicación a módulos vigentes

Repos **correctamente exportados** (2+ consumers documentados):

- `BudgetsRepository` — consumed by `ScheduleModule` (cron de recordatorios), `DashboardModule` (stats), `PropertiesModule` (billing list).
- `ProfessionalsRepository` — consumed by `ServiceRequestsModule` (smart-match), `DashboardModule`.
- `TechnicalInspectionsRepository` — consumed by `PropertiesModule`, `DashboardModule`.
- `PropertiesRepository` — consumed by `ScheduleModule`, `DashboardModule`, `MaintenancePlansModule`, `TechnicalInspectionsModule`, `BudgetsModule`.

Repos **evaluados y mantenidos encapsulados**:

- `ClientsRepository` — consumed solo desde `ClientsModule`. Si en el futuro `DashboardModule` necesita leer clientes, va a `DashboardStatsRepository.getAdminStats()` (ya existe). NO exportar.
- `CategoriesRepository` — consumed solo desde `CategoriesModule`. Mismo criterio.

## Enforcement

**No se crea ESLint rule** para esto por dos razones:

1. La regla es semántica (qué se considera "consumer"), no sintáctica. La rule sería falsos positivos o falsos negativos.
2. El cost-benefit de una rule extra es bajo: exportar un repo de más no rompe nada, solo amplía superficie. PR review alcanza.

**En code review**: si un PR agrega `RepositoryX` a `exports`, el reviewer pregunta: "¿quién más lo consume?". Si respuesta es "nadie todavía, puede que lo necesitemos", el export se posterga hasta que haya consumer real.

## Consecuencias

**Positivas**

- Superficie pública mínima por módulo. Refactors internos no rompen consumers inexistentes.
- Criterio explícito para code review sobre exports de repos.
- Cierra ambigüedad vigente desde 2026-Q1.

**Negativas / costos**

- Primera vez que un 2do consumer aparece, PR debe agregar `exports`. Fricción de 2 líneas de código, aceptable.

**Relación con otras ADRs**

- ADR-011 (scope de BaseRepository): este ADR asume que ya se decidió extender BaseRepository. Luego decide exportar o no.
- ADR-013 (module import policy): este ADR es la cara "export" del tema; ADR-013 es la cara "import" (qué modules se pueden importar desde qué).
