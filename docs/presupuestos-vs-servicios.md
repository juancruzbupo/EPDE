# Presupuestos vs Solicitudes de Servicio — Definición de negocio

## Regla fundamental

**¿El trabajo es de mantenimiento?**

- **Sí** → Solicitud de Servicio
- **No (es arquitectura, desarrollo, habilitación)** → Presupuesto

## Presupuesto

**Qué es**: una cotización para un trabajo profesional de arquitectura que **no es mantenimiento preventivo**. EPDE ofrece estos servicios adicionales más allá del plan de mantenimiento.

**Ejemplos concretos**:

- Ampliación de la vivienda
- Renovación / remodelación de un ambiente
- Desarrollo de planos de obra
- Planos para presentar en la municipalidad
- Habilitaciones (comercial, gas, etc.)
- Relevamiento arquitectónico

**Lo que NO es un presupuesto**:

- Reparar una canilla (→ solicitud de servicio)
- Limpiar canaletas (→ solicitud de servicio)
- Cualquier tarea del plan de mantenimiento (→ solicitud de servicio)

**Flujo**: el cliente describe el proyecto → EPDE cotiza con ítems, montos y plazo → el cliente aprueba o rechaza → EPDE ejecuta el trabajo.

## Solicitud de Servicio

**Qué es**: un pedido para que EPDE **ejecute una tarea de mantenimiento**, ya sea que esté en el plan de la propiedad o no.

**Tres casos de uso**:

1. **Tarea del plan que requiere profesional**: la inspección detectó que la instalación eléctrica necesita revisión por un electricista matriculado. El propietario no puede hacerla solo → solicita servicio.

2. **Tarea del plan que el propietario podría hacer pero prefiere que EPDE lo haga**: limpiar canaletas es una tarea que el dueño podría hacer, pero prefiere que un profesional lo haga por comodidad o seguridad → solicita servicio.

3. **Problema nuevo no contemplado en el plan**: apareció una humedad nueva que no estaba en la inspección original → solicita servicio para que EPDE lo evalúe y resuelva.

**Lo que NO es una solicitud de servicio**:

- Pedir un plano para la municipalidad (→ presupuesto)
- Cotizar una ampliación (→ presupuesto)
- Cualquier trabajo de arquitectura que no sea mantenimiento (→ presupuesto)

**Flujo**: el cliente describe la necesidad → EPDE evalúa → coordina ejecución con profesional → resuelve.

## Copy canónico para la app

### En cada página

**Presupuesto — PageHeader description**:

> "Trabajos de arquitectura fuera del plan de mantenimiento."

**Solicitud de Servicio — PageHeader description**:

> "Pedí que EPDE ejecute tareas de mantenimiento por vos."

### En el helper "¿Qué necesitás?"

**Presupuesto**:

> "Un trabajo de arquitectura que no es mantenimiento: ampliación, renovación, plano municipal, habilitación, relevamiento."

**Solicitud de Servicio**:

> "Una tarea de mantenimiento que querés que EPDE haga por vos. Puede ser una tarea del plan, algo que requiere profesional, o un problema nuevo."

### Ejemplos canónicos

**Presupuesto**: "Quiero ampliar la cocina", "Necesito un plano para presentar en la municipalidad", "¿Cuánto sale remodelar el baño?"

**Solicitud de Servicio**: "Necesito que revisen la instalación eléctrica", "Quiero que limpien las canaletas por mí", "Apareció humedad en la pared"

## Ubicaciones en el código que deben estar alineadas

1. `packages/shared/src/constants/glossary.ts` — términos "Presupuesto" y "Solicitud de servicio"
2. `apps/web/src/app/(dashboard)/budgets/page.tsx` — PageHeader description + help prop
3. `apps/web/src/app/(dashboard)/service-requests/page.tsx` — PageHeader description + help prop
4. `apps/web/src/components/request-type-helper.tsx` — inline helpers + dialog
5. `apps/mobile/src/components/request-type-helper.tsx` — mobile dialog
6. `docs/manual-operativo-admin.md` — sección 10 (presupuestos) callout box
7. `docs/ai-development-guide.md` — SIEMPRE #109
