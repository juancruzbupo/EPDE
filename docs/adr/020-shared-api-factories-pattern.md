# ADR-020: Shared API factories como SSoT de la surface HTTP

## Estado

Aceptada — formaliza el patrón vigente desde 2026-Q1.

## Contexto

Las factories `createXxxQueries(apiClient)` viven en `packages/shared/src/api/*.ts`. Cada app (web + mobile) hace:

```ts
const queries = createXxxQueries(apiClient);
export const { getX, createX, ... } = queries;
```

Ese patrón ya está documentado en el header de [packages/shared/src/api/index.ts](../../packages/shared/src/api/index.ts) con 4 excepciones justificadas (`auth` base flow, `upload`, `landing-settings` web-only, `inspections` web-only).

Durante la auditoría arquitectónica de 2026-04-19 se observó que el patrón **se sigue consistentemente en 13 de 17 archivos** de `apps/{web,mobile}/src/lib/api/*.ts`, pero no está elevado a ADR: un dev nuevo puede no ver el docstring del index y agregar una API nueva **escribiendo functions directas en vez de factory**, generando drift silencioso cuando cambie un endpoint.

Además, no hay enforcement automático. El ESLint rule `api-factory-must-exist.mjs` valida que la factory **exista**, no que los consumidores la **usen**.

## Decisión

**1. Pattern canónico**: los reads (GET endpoints) de un domain consumido por 2+ plataformas **deben** venir de una factory destructurada. Los writes (POST/PATCH/DELETE) pueden venir de la factory o estar escritos directamente, pero el wrapping de errores + types debe ser consistente.

**2. Allowlist explícita de exceptions**:

| Archivo                                         | Razón de exception                                                                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/*/src/lib/api/auth-features.ts` base flow | Login/refresh diverge por plataforma (cookies web vs SecureStore mobile). La factory cubre post-login features (milestones, streak freezes). |
| `apps/*/src/lib/api/upload.ts`                  | Multipart diverge: browser `File` API vs React Native `FormData` + `expo-file-system`.                                                       |
| `apps/web/src/lib/api/landing-settings*.ts`     | Web-only (admin gestión). Promoverlo sería dead weight.                                                                                      |
| `apps/web/src/lib/api/inspections.ts`           | Web-only (admin flow de inspección → plan).                                                                                                  |

**3. Enforcement automático**: nueva ESLint rule `no-ad-hoc-api-read.mjs` prohibe `export async function get*` en `apps/*/src/lib/api/*.ts` excepto en los archivos allowlisted. La rule obliga al dev a: (a) crear la factory en shared si la feature es cross-platform, o (b) agregar el archivo a la allowlist con justificación en el JSDoc del archivo.

**4. Migrations opcionales en el futuro**: si un archivo hoy allowlisted deja de tener divergencia entre plataformas (ej. si mobile implementa upload de plataforma), remover del allowlist + migrar a factory.

## Por qué híbrido (factory reads + mutations directos)

- Los **reads** son los que más drift tienen: rutas, params, filtros, cache keys. Unificarlos en factory resuelve el 80% del riesgo.
- Los **mutations** varían significativamente: web puede usar FormData para uploads + photos, mobile usa JSON + FileSystem URIs. Forzar factory para todos los writes genera abstracciones lossy.
- El patrón híbrido **ya existe** (la mayoría de archivos lo siguen). Esta ADR lo **formaliza** y **protege**, no introduce cambio.

## Consecuencias

**Positivas**

- Cerrar la ambigüedad: un dev nuevo sabe dónde va una API nueva sin leer docstrings.
- Drift de rutas/params entre web y mobile se vuelve imposible (factory es SSoT).
- ESLint rule previene regresiones.

**Negativas / costos**

- Allowlist necesita mantenimiento (si una feature deja de ser web-only, hay que actualizar).
- ESLint rule puede generar falsos positivos en nuevas excepciones; la primera vez que falle, el PR debe documentar en JSDoc por qué.

**Relaciones**

- Complementa `api-factory-must-exist.mjs` (valida existencia) con `no-ad-hoc-api-read.mjs` (valida uso).
- ADR-013 (module import policy) sobre cómo no introducir ciclos; esta ADR es sobre cómo no introducir drift.

## Appendix — Reads vs writes

Para un endpoint HTTP, "read" = GET sin side effects. "Write" = POST/PATCH/PUT/DELETE.

La rule `no-ad-hoc-api-read.mjs` se aplica solo a reads (funciones exportadas cuyo nombre empieza con `get*`, `list*`, `fetch*`). Writes quedan libres para escritura directa porque la firma (y el DTO) puede ser más específico por plataforma.
