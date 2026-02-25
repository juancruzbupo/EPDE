# EPDE - Documentacion del Proyecto

**EPDE** (Estudio Profesional de Diagnostico Edilicio) es una plataforma de mantenimiento preventivo para viviendas unifamiliares. Dos interfaces: panel de administracion y portal de cliente. Dos roles: `ADMIN` y `CLIENT`.

## Indice

| Documento                                          | Descripcion                                                    |
| -------------------------------------------------- | -------------------------------------------------------------- |
| [architecture.md](architecture.md)                 | Estructura del monorepo, patrones de diseno, capas del sistema |
| [design-system.md](design-system.md)               | Tokens de diseno, colores, tipografia, componentes UI          |
| [development-workflow.md](development-workflow.md) | Guia de desarrollo para AI y humanos, convenciones, flujos     |
| [data-model.md](data-model.md)                     | Modelo de datos completo, entidades, relaciones, enums         |
| [api-reference.md](api-reference.md)               | Endpoints, autenticacion, respuestas, errores                  |

## Stack Tecnologico

| Capa           | Tecnologia                                           | Version |
| -------------- | ---------------------------------------------------- | ------- |
| Monorepo       | Turborepo + pnpm                                     | 10.6.1  |
| Frontend       | Next.js (App Router)                                 | 15.5    |
| Backend        | NestJS                                               | 11      |
| Base de datos  | PostgreSQL                                           | 16      |
| ORM            | Prisma                                               | 6       |
| Shared         | tsup (ESM + CJS)                                     | -       |
| UI             | shadcn/ui + Tailwind CSS 4                           | -       |
| State (global) | Zustand                                              | -       |
| State (server) | TanStack React Query                                 | 5       |
| Validacion     | Zod (unico SSoT, shared + API via ZodValidationPipe) | -       |
| Auth           | Passport JWT + Local                                 | -       |
| Email          | Resend                                               | -       |
| Storage        | Cloudflare R2                                        | -       |
| CI/CD          | GitHub Actions                                       | -       |
| Monitoreo      | Sentry                                               | -       |

## Workspaces

```
epde/
  apps/
    api/          # NestJS REST API (puerto 3001)
    web/          # Next.js frontend (puerto 3000)
  packages/
    shared/       # Tipos, schemas Zod, constantes, utilidades
```

## Inicio Rapido

```bash
# Instalar dependencias
pnpm install

# Levantar PostgreSQL
docker compose up -d

# Aplicar migraciones y seed
pnpm --filter @epde/api exec prisma migrate dev
pnpm --filter @epde/api exec prisma db seed

# Desarrollo
pnpm dev

# Build completo
pnpm build

# Verificaciones
pnpm lint
pnpm typecheck
pnpm test
```

## Credenciales de Desarrollo

| Rol   | Email          | Password  |
| ----- | -------------- | --------- |
| Admin | admin@epde.com | Admin123! |

## URLs de Desarrollo

| Servicio | URL                            |
| -------- | ------------------------------ |
| Frontend | http://localhost:3000          |
| API      | http://localhost:3001/api/v1   |
| Swagger  | http://localhost:3001/api/docs |
| pgAdmin  | http://localhost:5050          |
