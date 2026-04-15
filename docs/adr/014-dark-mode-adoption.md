# ADR 014 — Dark mode: adoption status, convention, y acceptance criteria

**Estado**: Aceptada
**Fecha**: 2026-04-15

## Contexto

El audit arquitectónico del 2026-04-15 marcó dark mode como "promesa incompleta" — observó que solo 1 archivo del dashboard usa el prefix `dark:` de Tailwind, concluyendo "0% de coverage". La verificación detallada **invalida esa lectura**: el coverage no se hace por `dark:` prefix sino por tokens semánticos sobre CSS variables, y ese mecanismo está plenamente aplicado.

Esta ADR fija la convención, declara dark mode como **soportado**, y establece acceptance criteria para mantener el invariante.

## Estado real (verificado 2026-04-15)

### Infraestructura presente

- **CSS variables** en `apps/web/src/app/globals.css`: 93 tokens definidos en bloques `:root` (light) y `.dark` que swap todos automáticamente cuando se agrega la clase `.dark` al `<html>`.
- **Pre-hydration script** en `apps/web/src/app/layout.tsx:42-45`: lee `localStorage.theme` antes del primer render y aplica `.dark` para evitar flash-of-wrong-theme.
- **Theme toggle UI** en `apps/web/src/app/(dashboard)/profile/page.tsx:133-170`: opciones Claro / Oscuro / System con persistencia en localStorage y respuesta a `prefers-color-scheme: dark` cuando System.
- **99 archivos del dashboard** consumen tokens semánticos (`bg-card`, `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted`) — el flip de tema ocurre vía CSS variables sin tocar el componente.
- **Drift test** `design-tokens-parity.test.ts` en shared compara `DESIGN_TOKENS_LIGHT/DARK` contra los blocks `:root`/`.dark` de globals.css y falló 2 veces capturando drifts reales.
- **Mobile**: tiene su propio `theme-store` (Zustand) + `useColorScheme()` + `darkTheme/lightTheme` exports. Patrón distinto pero el resultado es el mismo: tokens responden al modo.

### Lo que el audit interpretó como "0% coverage"

Solo 1 archivo (`inspection-guide-dialog.tsx`) usa el prefix `dark:` de Tailwind. **Eso es esperado y correcto** — el prefix se usa solo para overrides puntuales donde el token semántico no aplica. La regla general es: usar tokens semánticos, no `dark:` prefix.

### Hardcoded colors auditados

11 instancias de `text-white` / `bg-white` / `bg-black/50` en dashboard + UI primitives. **Todas verificadas como intencionales y theme-agnostic**:

- `text-white` sobre `bg-destructive` (badges rojos), `bg-success` (badges verdes): blanco sobre color saturado lee bien en ambos modos.
- `bg-black/50` overlay de dialogs: semitransparente sobre cualquier contenido.
- `text-white` sobre fotos (`property-photos-tab`): las fotos no se themean, el texto debe contrastar con la imagen.
- WhatsApp float button: brand green + white, mismo color en todos los modos.

Cero hardcoded colors a corregir.

## Decisión

**Dark mode está soportado**. La convención es:

### Para escribir un componente nuevo

1. **Usar tokens semánticos por defecto**: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`. La lista completa vive en `apps/web/src/app/globals.css` (`:root` y `.dark`).
2. **Para colores con semántica de estado**: `bg-destructive`, `bg-success`, `bg-warning`, `text-primary`. Estos cambian intensidad entre modos automáticamente.
3. **`dark:` prefix es excepcional** — solo cuando un componente necesita un comportamiento radicalmente distinto en dark (ej. invertir un PNG con fondo blanco). Si te encontrás escribiendo `dark:` mucho, probablemente estás bypaseando un token que ya cubre el caso.
4. **Hardcoded `text-white` / `bg-white` / `bg-black` permitidos** solo cuando el contexto es theme-agnostic (texto sobre color saturado, overlay sobre foto, brand color).

### Para el contributor que duda

Si tenés que decidir entre `text-foreground` y `text-white`: usá `text-foreground`. Excepción documentada arriba.

## Acceptance criteria (nuevo)

Para sostener "dark mode soportado" como verdad, todos estos invariantes deben mantenerse en CI:

| Invariante                                                                                              | Mecanismo                                  | Estado       |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------ |
| `:root` y `.dark` blocks de globals.css coinciden en valores con `DESIGN_TOKENS_{LIGHT,DARK}` de shared | `design-tokens-parity.test.ts` (existente) | ✅ enforzado |
| Componentes nuevos usan tokens semánticos en vez de hardcoded `text-gray-*`, `bg-slate-*`, etc.         | Code review (low cost — pattern is sticky) | manual       |
| Theme toggle persiste el modo entre sesiones                                                            | E2E o smoke test manual al tocar el toggle | manual       |
| Theme System respeta `prefers-color-scheme: dark`                                                       | Smoke test manual                          | manual       |

**No se promete**:

- Páginas públicas (landing, login) están en light fijo por diseño — branding consistente. Esa decisión queda fuera de scope de "soporte dark mode" del dashboard.
- PDFs / print views (`/properties/[id]/report/`) son print-first y siempre claros. Forzar dark en print rompe legibilidad en papel.

## Trabajo concreto (este PR)

Solo es la ADR. Cero código se modifica — el estado actual ya cumple los acceptance criteria. Si en el futuro un dev escribe `text-gray-400`, el code review lo redirige al token semántico correspondiente.

## Consecuencias

**Positivo**

- La promesa "dark mode soportado" deja de ser ambigua. Próximo dev que mire el código encuentra esta ADR y entiende que no hay deuda pendiente — la abstracción ya está, solo hay que respetarla.
- El audit inicial ("0% coverage") queda invalidado con evidencia. Futuras auditorías verán esta ADR antes de re-flaggear.
- El drift test `design-tokens-parity.test.ts` queda como guardrail durable.

**Negativo / Trade-off**

- No hay enforcement automático contra hardcoded colors (`bg-gray-200` etc.). El code review es el guardrail. Si alguna vez se vuelve un problema recurrente, agregar una ESLint rule `no-raw-color-class` en `apps/web/src/app/(dashboard)`. Por ahora no se justifica — la pattern es sticky.

## Cuándo revisitar

- Si producto pide que landing/login también respondan a dark mode (cambia el scope).
- Si aparecen ≥3 PRs nuevos con hardcoded colors en dashboard (señal de que la convención no es lo suficientemente visible — agregar ESLint rule).
- Si mobile y web divergen visiblemente al mismo modo (señal de que el drift test no está cubriendo algún token).
