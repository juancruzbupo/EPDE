# ADR-001: Monorepo con @epde/shared como SSoT

## Estado

Aceptada

## Contexto

EPDE tiene 3 apps (API NestJS, Web Next.js, Mobile Expo) que comparten tipos, validaciones, constantes y utilidades. Sin un mecanismo de compartición, cada app definiría sus propios tipos, generando drift.

## Decisión

- Monorepo con Turborepo + pnpm workspaces
- Package `@epde/shared` como Single Source of Truth para: tipos TypeScript, schemas Zod, constantes (labels, tokens, query keys), utilidades (dates, currency, errors), API factories
- Dual build ESM/CJS via tsup para compatibilidad con Next.js y NestJS
- Barrel exports: consumidores importan `from '@epde/shared'` (nunca sub-paths)

## Consecuencias

- Todo cambio en un tipo/label se propaga automáticamente a las 3 apps
- Zod schemas validan en backend (controller pipes) y frontend (form validation) con la misma definición
- API factories (`createBudgetQueries(apiClient)`) eliminan duplicación de endpoints entre web y mobile
- Trade-off: cambios en shared requieren rebuild antes de que los consumidores los vean en desarrollo
