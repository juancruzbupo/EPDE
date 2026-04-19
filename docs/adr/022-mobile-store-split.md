# ADR-022: Mobile divide UI preferences en stores separados; web usa uno consolidado

## Estado

Aceptada — documenta decisión vigente desde 2026-Q1.

## Contexto

Durante la auditoría de 2026-04-19 se observó que web tiene 2 Zustand stores (`auth-store`, `ui-preferences-store`) mientras mobile tiene 4 (`auth-store`, `theme-store`, `font-scale-store`, `motivation-store`). La interpretación inicial fue "divergencia injustificada".

Tras auditar los docstrings de las stores mobile, la divergencia es **intencional y documentada**:

- `theme-store.ts` — preferencia dark/light. Mirrors `ui-preferences-store.theme` en web.
- `font-scale-store.ts` — multiplier 0.9/1/1.15/1.3. Mirrors `ui-preferences-store.fontScale` en web.
- `motivation-store.ts` — `rewards` vs `minimal`. Mirrors `ui-preferences-store.motivationStyle` en web.

Tres stores separadas en mobile implementan los mismos 3 campos que están combinados en 1 store en web. Storage keys son **idénticos** entre plataformas (`epde-font-scale`, `epde-motivation-style`) para debuggability.

## Decisión

Mantener la divergencia. Razón técnica:

**Web** usa `localStorage` sincrónicamente. Un store consolidado lee las 3 preferencias en una operación atómica:

```ts
// ui-preferences-store.ts (web)
const persisted = {
  theme: localStorage.getItem('epde-theme') ?? 'system',
  fontScale: localStorage.getItem('epde-font-scale') ?? 'base',
  motivationStyle: localStorage.getItem('epde-motivation-style') ?? 'rewards',
};
```

**Mobile** usa `AsyncStorage` asincrónicamente. Cada `await AsyncStorage.getItem()` es una operación independiente. Combinarlas en un solo store significa:

1. La hidratación es un `Promise.all([...])` que bloquea el UI hasta que las 3 resuelven.
2. Si una preferencia no existe aún (primer run), se inicializa con default + escribe async.
3. Estado `hydrated: boolean` es compartido — un consumer que solo necesita `theme` espera por los 3.

Separadas:

1. Cada store maneja su propio ciclo async independiente.
2. Consumers que solo necesitan theme no esperan por motivation.
3. Estado `hydrated` es por-store — gate UI solo en el que importa.

## Criterio para futuras preferencias

- **Web**: agregar a `ui-preferences-store.ts` (un solo campo más en el store existente).
- **Mobile**: crear `xxx-store.ts` nuevo si el hydration flow es independiente. Combinar en uno existente si se consume siempre junto (ej. un theme-variant).
- **Ambos**: storage key debe ser idéntico entre plataformas (`epde-<kebab-case-name>`) para parity en debug.

## Aplicación al naming

Por ser intencional, el naming de las stores mobile no debe "consolidarse" a `ui-preferences-store.ts` para matchear web. Cada mobile store tiene su nombre semántico (`theme-store`, `font-scale-store`, `motivation-store`).

## Consecuencias

**Positivas**

- Hidratación granular en mobile: UI que solo depende de theme no se bloquea por otras preferencias.
- Divergencia técnica está justificada y documentada — no es drift arquitectónico.
- Code review nuevo dev: respuesta a "¿por qué mobile tiene más stores?" apunta a esta ADR.

**Negativas / costos**

- Consumer que necesita las 3 preferencias en mobile debe usar 3 hooks. Caso raro pero existe.
- Agregar una preferencia requiere acción en ambos lados (1 campo web + 1 store mobile). Aceptable — las preferencias UX no son frecuentes.

**Relación con otras ADRs**

- ADR-016 (loading state divergence): pattern similar — web y mobile divergen donde la plataforma lo justifica.
