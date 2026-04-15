# ADR 016 — Loading state: web Skeleton vs mobile ActivityIndicator (divergence by design)

**Estado**: Aceptada
**Fecha**: 2026-04-15

## Contexto

El audit del 2026-04-15 identificó como inconsistencia: "web usa shadcn `<Skeleton />` (bloques grises pulsantes con forma del contenido), mobile usa `<ActivityIndicator />` (spinner nativo)". El finding propuso evaluar 3 opciones: portar Skeleton a mobile, mantener divergencia, o crear un `<LoadingState>` cross-platform.

Esta ADR fija la decisión: **la divergencia es intencional y se mantiene**.

## Decisión

Web sigue usando `<Skeleton />` de shadcn. Mobile sigue usando `<ActivityIndicator />` nativo. NO se crea una abstracción `<LoadingState>` compartida.

## Por qué la divergencia es correcta

Estos no son dos sabores arbitrarios del mismo patrón — son dos patrones distintos que resuelven dos problemas distintos en dos plataformas con expectativas distintas:

### Web: skeleton screens

- Pantallas grandes con layouts complejos. Layout shift al cargar es muy notorio.
- Usuario tiene contexto visual de "esto es una tabla, voy a ver filas".
- Skeleton bloques replican esa forma → percepción de carga rápida.
- shadcn `<Skeleton />` es la primitiva idiomatic en el ecosistema React/Tailwind/shadcn.

### Mobile: activity indicators

- Pantallas chicas. Múltiples skeletons crowding la vista.
- Usuario espera el spinner nativo (iOS spinner, Android circular progress) — es el lenguaje visual del sistema operativo.
- React Native `ActivityIndicator` mapea a `UIActivityIndicatorView` (iOS) / `ProgressBar` (Android).
- El usuario interpreta "spinner nativo = la app está bien, está cargando" más rápido que "bloques grises pulsando".

### Por qué NO crear `<LoadingState>` compartido

Una abstracción cross-platform terminaría siendo lowest-common-denominator:

- Si el shape es `<LoadingState shape="card" count={3} />`, mobile pierde el patrón nativo (el spinner hace lo que tres skeletons NO hacen — comunica indeterminación).
- Si el shape es `<LoadingState>{children}</LoadingState>`, cada plataforma ignora `children` y renderiza su primitiva — es API teatro, no abstracción real.
- 6h de implementación + permanente fricción de "¿cómo lo uso en mobile vs web?" + leakage en cualquier sitio donde una plataforma quiera comportarse distinto.

El **costo de la divergencia es cero** — los devs nunca cruzan código de un app al otro escribiendo loading states. El **beneficio de unificar** es solo "se ve más simétrico el repo", que no es razón válida.

## Cuándo SÍ tiene sentido unificar

Si en el futuro:

- Producto pide una experiencia visual uniforme cross-platform (ej. branding fuerte que requiere mismo loading visual en web y mobile);
- O si surge un caso real donde la divergencia causa un bug (ej. analytics no puede medir "tiempo en loading" porque las primitivas son distintas);

revisitar esta ADR. Hasta entonces, los devs deben:

- En web: importar `Skeleton` de `@/components/ui/skeleton` y usarlo según el patrón shadcn.
- En mobile: importar `ActivityIndicator` de `react-native` y centrar/dimensionar según el contexto.

## Convención (referenciar en code review)

| Plataforma                        | Loading pattern                                                      | Cuándo usar                                            |
| --------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ |
| Web — pantallas con layout grande | `<Skeleton className="h-X w-Y" />` × N matching content              | Lista, tabla, card grid                                |
| Web — single inline spinner       | `<Loader2 className="animate-spin" />` (lucide-react)                | Botón "Guardando…", retry inline                       |
| Mobile — pantalla completa        | `<ActivityIndicator size="large" color={COLORS.primary} />` centrado | Initial fetch de la pantalla                           |
| Mobile — inline                   | `<ActivityIndicator size="small" />`                                 | Pull-to-refresh, paginación bottom, botón "Guardando…" |

## Consecuencias

**Positivo**

- Cero código nuevo. Cero refactor.
- Los devs siguen usando el patrón natural de su plataforma sin pelear contra una abstracción.
- Cuando alguien futuro quiera "consolidar", esta ADR explica por qué no.

**Negativo**

- El audit que escaneó "skeleton vs activity indicator" va a re-flaggearlo si no encuentra la ADR. Mitigación: linkear esta ADR desde la sección "Loading patterns" del `docs/design-system.md`.
- Si producto cambia de opinión y exige consistencia visual cross-platform, el costo de portar cae sobre el equipo que lo pida — no hay base compartida pre-construida. Es un trade-off aceptado: optimizar para "lo correcto hoy" no para "lo flexible mañana".

## Cuándo revisitar

Triggers explícitos para reabrir:

1. Producto pide branding visual uniforme cross-platform.
2. Aparece un bug donde el patrón divergente es la causa raíz.
3. ≥3 PRs nuevos en el mismo trimestre quieren replicar el patrón del otro app — señal de que los devs intuyen que falta una abstracción.
