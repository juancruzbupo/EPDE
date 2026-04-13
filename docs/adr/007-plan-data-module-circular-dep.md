# ADR 007 — PlanDataModule para romper dependencia circular

**Estado**: Aceptada  
**Fecha**: 2026-04-13

## Contexto

`TasksModule` necesita acceder a `MaintenancePlansRepository` para verificar a qué plan pertenece una tarea durante el ciclo de vida (activación, completado, avance). Al mismo tiempo, `MaintenancePlansModule` necesita `TasksRepository` para activar un plan (crear tareas a partir de templates).

Si `TasksModule` importara `MaintenancePlansModule` y `MaintenancePlansModule` importara `TasksModule`, NestJS lanzaría un error de dependencia circular en runtime.

## Decisión

Se creó `PlanDataModule` (`apps/api/src/maintenance-plans/plan-data.module.ts`) como un módulo deliberadamente delgado que solo exporta `MaintenancePlansRepository`, sin importar `TasksModule`.

- `TasksModule` importa `PlanDataModule` (solo el repository, sin lógica de negocio de planes)
- `MaintenancePlansModule` importa `TasksModule` (para activación de planes)
- No hay ciclo

## Consecuencias

**Positivo**

- Ciclo eliminado sin usar `forwardRef()`, que es frágil y difícil de debuggear
- `PlanDataModule` actúa como interfaz explícita: solo expone lo que los consumidores externos necesitan

**Negativo / Trade-off**

- Dos módulos para el mismo dominio de planes: `PlanDataModule` (datos) y `MaintenancePlansModule` (lógica)
- Un developer nuevo puede agregar providers a `MaintenancePlansModule` sin darse cuenta de que `TasksModule` no los verá

## Cuándo revisitar

Si en el futuro `TasksModule` necesita acceder a lógica de negocio de `MaintenancePlansService` (no solo al repository), evaluar si conviene:

1. Mover esa lógica a `PlanDataModule` (expande su scope)
2. Extraer un `PlansSharedModule` con las partes compartidas
3. Usar `forwardRef()` si el acoplamiento es inevitable

No usar `forwardRef()` como solución de primera instancia — es opaco y genera errores de inicialización difíciles de diagnosticar.
