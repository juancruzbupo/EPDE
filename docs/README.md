# EPDE - Documentacion del Proyecto

**EPDE** (Estudio Profesional de Diagnostico Edilicio) es una plataforma de mantenimiento preventivo para viviendas residenciales. Dos interfaces: panel de administracion y portal de cliente. Dos roles: `ADMIN` y `CLIENT`.

## Indice

| Documento                                                          | Descripcion                                                    |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| [architecture.md](architecture.md)                                 | Estructura del monorepo, patrones de diseno, capas del sistema |
| [mobile.md](mobile.md)                                             | App mobile Expo/React Native, navegacion, patrones             |
| [design-system.md](design-system.md)                               | Tokens de diseno, colores, tipografia, componentes UI          |
| [development-workflow.md](development-workflow.md)                 | Guia de desarrollo para AI y humanos, convenciones, flujos     |
| [data-model.md](data-model.md)                                     | Modelo de datos completo, entidades, relaciones, enums         |
| [api-reference.md](api-reference.md)                               | Endpoints, autenticacion, respuestas, errores                  |
| [monorepo-completo.md](monorepo-completo.md)                       | Arquitectura completa del monorepo, tecnologias y patrones     |
| [env-vars.md](env-vars.md)                                         | Referencia completa de variables de entorno                    |
| [runbook.md](runbook.md)                                           | Runbook operativo: health checks, incidentes, deploy, rollback |
| [deploy-checklist.md](deploy-checklist.md)                         | Checklist de deploy a produccion, variables, verificaciones    |
| [ai-development-guide.md](ai-development-guide.md)                 | Guia de desarrollo con AI, reglas SIEMPRE/NUNCA                |
| [audit-prompt.md](audit-prompt.md)                                 | Prompt de auditoria tecnica para revisiones                    |
| [scheduler-registry.md](scheduler-registry.md)                     | Registro de cron jobs y schedulers del sistema                 |
| [feature-matrix.md](feature-matrix.md)                             | Matriz de features por rol y plataforma                        |
| [backlog.md](backlog.md)                                           | Oportunidades de negocio y features futuras                    |
| [plan-e-isv-guia-tecnica.md](plan-e-isv-guia-tecnica.md)           | Guia tecnica del plan de mantenimiento e ISV                   |
| [actualizacion-costos.md](actualizacion-costos.md)                 | Referencia de costos para futura seccion de pricing            |
| [guia-usuario-admin-y-cliente.md](guia-usuario-admin-y-cliente.md) | Guia de usuario para admin y cliente                           |
| [guias-inspeccion-progreso.md](guias-inspeccion-progreso.md)       | Progreso de guias de inspeccion por sector                     |
| [guion-video-demo-nuevo.md](guion-video-demo-nuevo.md)             | Guion para video demo del sistema                              |
| [manual-inspeccion-ocular.md](manual-inspeccion-ocular.md)         | Manual de inspeccion ocular para la arquitecta                 |
| [manual-operativo-admin.md](manual-operativo-admin.md)             | Manual operativo del panel de administracion                   |
| [auditoria-competitiva-ux.md](auditoria-competitiva-ux.md)         | Auditoria competitiva de UX                                    |
| [resumen-completo-para-ai.md](resumen-completo-para-ai.md)         | Resumen completo del proyecto para contexto AI                 |
| [sistema-conversion-whatsapp.md](sistema-conversion-whatsapp.md)   | Sistema de conversion via WhatsApp                             |

## Stack Tecnologico

| Capa           | Tecnologia                                           | Version   |
| -------------- | ---------------------------------------------------- | --------- |
| Monorepo       | Turborepo + pnpm                                     | 10.6.1    |
| Frontend       | Next.js (App Router)                                 | 15.5      |
| Mobile         | Expo + React Native + NativeWind                     | 54 / 0.81 |
| Backend        | NestJS                                               | 11        |
| Base de datos  | PostgreSQL                                           | 16        |
| ORM            | Prisma                                               | 6         |
| Shared         | tsup (ESM + CJS)                                     | -         |
| UI Web         | shadcn/ui + Tailwind CSS 4                           | -         |
| UI Mobile      | NativeWind 5 (Tailwind para RN)                      | -         |
| State (global) | Zustand                                              | -         |
| State (server) | TanStack React Query                                 | 5         |
| Validacion     | Zod (unico SSoT, shared + API via ZodValidationPipe) | -         |
| Cache/State    | Redis (token rotation, distributed lock)             | 7         |
| Auth           | Passport JWT + Local + Token Rotation                | -         |
| Email          | Resend                                               | -         |
| Storage        | Cloudflare R2                                        | -         |
| CI/CD          | GitHub Actions + Render (API) + Vercel (Web)         | -         |
| Testing Web    | Vitest + Testing Library                             | -         |
| Testing Mobile | Jest + jest-expo + Testing Library RN                | -         |
| Monitoreo      | Sentry + OpenTelemetry (Prometheus)                  | -         |
| Logging        | nestjs-pino (JSON estructurado)                      | -         |

## Workspaces

```
epde/
  apps/
    api/          # NestJS REST API (puerto 3001)
    web/          # Next.js frontend (puerto 3000)
    mobile/       # Expo React Native app (cliente)
  packages/
    shared/       # Tipos, schemas Zod, constantes, utilidades
```

## Inicio Rapido

```bash
# Instalar dependencias
pnpm install

# Levantar PostgreSQL + Redis
docker compose up -d

# Aplicar migraciones y seed
pnpm --filter @epde/api exec prisma migrate dev
pnpm --filter @epde/api exec prisma db seed

# Desarrollo (web + api)
pnpm dev

# Desarrollo mobile
pnpm dev:mobile

# Build completo
pnpm build

# Verificaciones
pnpm lint
pnpm typecheck
pnpm test                            # Tests unitarios (API + Shared + Web + Mobile)
pnpm --filter @epde/api test:e2e    # Tests E2E (requiere DB + Redis)
```

## Credenciales de Desarrollo

| Rol   | Email          | Password  |
| ----- | -------------- | --------- |
| Admin | admin@epde.com | Admin123! |

## URLs de Desarrollo

| Servicio | URL                                 |
| -------- | ----------------------------------- |
| Frontend | http://localhost:3000               |
| Mobile   | Expo Dev Server (puerto 8081)       |
| API      | http://localhost:3001/api/v1        |
| Swagger  | http://localhost:3001/api/docs      |
| Health   | http://localhost:3001/api/v1/health |
| Metrics  | http://localhost:9464/metrics       |
| pgAdmin  | http://localhost:5050               |
