# ADR 015 — Mobile admin readiness: trigger + checklist preventivo

**Estado**: Aceptada
**Fecha**: 2026-04-15

## Contexto

El audit del 2026-04-15 identificó como zona de drift potencial: "mobile es CLIENT-only por diseño; cuando producto pida features admin (ej. arquitecta completando inspecciones desde el celular), los hooks van a explotar de tamaño y a duplicar lógica de roles".

Hoy mobile **no** tiene rol admin. Toda la admin UI vive en web. Pero esa frontera es producto-driven, no técnica — un pedido razonable de "que la arquitecta vea el plan en el campo y marque tareas como hechas" puede llegar en cualquier momento.

Esta ADR no escribe código. Documenta el **trigger** que gatilla la activación de guardrails preventivos y el **checklist exacto** a aplicar cuando llegue, para que no se descubra el costo después de hacer un PR de 2 días.

## Trigger de activación

Aplicar el checklist abajo **el día que llegue el primer PR que cumpla cualquiera de estos**:

1. Una mutation expuesta en mobile que requiera `UserRole.ADMIN` para invocarse (la API la rechaza con 403 si la llama un CLIENT).
2. Un feature gate en mobile basado en role (ej. `if (user.role === 'ADMIN') ...`).
3. Una pantalla nueva en mobile que solo deba ser visible a admins (ej. `app/admin/clients.tsx`).

Si solo agregás permisos finos dentro de roles existentes (ej. CLIENT puede o no aprobar X), eso NO es trigger — son features de CLIENT, no admin.

## Checklist preventivo (al activar)

Aplicar TODO antes de mergear el primer PR de admin en mobile.

### 1. Decisión de arquitectura: ¿hooks compartidos o split?

Mobile hoy tiene `useBudgets()`, `useServiceRequests()`, etc. con asunciones CLIENT-only (filtros default a `{}`, sin `userId`). Cuando admin entra:

- **Opción A — extender los hooks existentes**: agregar `userId?` opcional, dejar que admin pase un valor para filtrar por cliente. Bajo costo, alto acoplamiento.
- **Opción B — splitear por rol**: `useBudgets()` (client) + `useAdminBudgets()` (admin con filtros completos). Más archivos, más claro qué hace cada uno.

Decidir antes de tocar código. Si elegís A, documentarlo en la ADR de ese feature; si B, escribir el helper compartido `useRoleAwareQuery` primero.

### 2. Helper `useIsAdmin()` (escribir AHORA si no existe)

```ts
// apps/mobile/src/hooks/use-is-admin.ts
import { UserRole } from '@epde/shared';
import { useAuthStore } from '@/stores/auth-store';

export function useIsAdmin(): boolean {
  return useAuthStore((s) => s.user?.role === UserRole.ADMIN);
}
```

Cero callers el día 1. Existir como helper centralizado evita 3 implementaciones inline distintas en los próximos 3 PRs.

### 3. Route gating

Si el primer PR agrega una pantalla admin-only, redirigir CLIENT con un layout guard:

```tsx
// apps/mobile/src/app/admin/_layout.tsx
import { Redirect, Stack } from 'expo-router';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { ROUTES } from '@/lib/routes';

export default function AdminLayout() {
  const isAdmin = useIsAdmin();
  if (!isAdmin) return <Redirect href={ROUTES.tabs} />;
  return <Stack />;
}
```

API ya rechaza con 403, pero la UI debe nunca **mostrar** la pantalla — sin el redirect, un CLIENT que linkea a `/admin/clients` ve el flash de la pantalla antes de que la mutation falle.

### 4. Hooks: max-lines 150 ya está activado

PR-6 (commit `e43ba5cd`) activó `max-lines: 150` en `apps/mobile/src/hooks/use-*.ts` con split variants ignorados. Cualquier hook nuevo que crece pasando 150 LOC → CI falla → splitear queries/mutations.

Cero acción adicional. Solo confirmar al PR que el rule sigue activo.

### 5. Test parity contra web

Si la mutation admin que mobile estrena ya existe en web (ej. `useUpdateBudgetStatus` con valid transitions distintas para CLIENT vs ADMIN), agregar test parity en `packages/shared/src/__tests__/` que verifique:

- Ambas plataformas usan los mismos `BUDGET_STATUS_TRANSITIONS` de shared.
- Ambas plataformas invalidan los mismos query keys post-mutation.

Patrón ya establecido en `invalidate-dashboard-parity.test.ts` (PR-7).

### 6. Documentar en CLAUDE.md / docs/ai-development-guide.md

Agregar SIEMPRE rule:

> **Mobile admin features**: hook que se llama desde una ruta admin-only debe vivir en `hooks/admin/use-X.ts` (no en `hooks/use-X.ts`). El path es la marca de "esto es admin" — más visible que un comentario.

(Solo si elegiste Opción B en paso 1. Si A, agregar en su lugar el lineamiento de cuándo `userId?` es admin-only).

### 7. Auth store: confirmar que `user.role` está presente y correcto

`useAuthStore` ya expone `user.role` (web lo usa). Mobile lo lee del JWT al login. Confirmar al primer feature que el role llega correctamente — agregar log + smoke test si hay duda.

## Consecuencias

**Positivo**

- Cuando llegue el pedido, el dev no tiene que improvisar. El checklist es referenciable y aplicable en orden.
- Las dudas de diseño (extender vs splitear hooks, dónde vive `useIsAdmin`, gating de rutas) están pre-resueltas.
- Los guardrails ya enforzados (max-lines, parity tests) se mencionan explícitamente para que el dev no los bypase pensando "no aplica, esto es admin".

**Negativo**

- ADR sin código. Si nadie lo lee cuando llegue el trigger, es papel mojado. Mitigación: linkear desde CLAUDE.md y desde la sección "Mobile" del ai-development-guide.

## Cuándo revisitar

- Inmediatamente al activar el trigger — actualizar esta ADR con qué decisiones se tomaron en cada paso del checklist (queda como historial).
- Si producto explícitamente decide que mobile permanece CLIENT-only de manera permanente, archivar esta ADR como "Superseded by decisión de producto".
