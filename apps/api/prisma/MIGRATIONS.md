# Prisma migrations — conventions

Checklist to follow when generating a new migration with `pnpm db:migrate` (or equivalently `prisma migrate dev --name <slug>`).

## 1. Before generating

- Update `schema.prisma` with the intended final shape.
- Know what tables the migration will touch in production. If any of them will be **large** (tens of thousands of rows and above) at the time the migration runs, some DDL operations will block writers while they execute — plan accordingly.

## 2. After generating, before committing

Open the generated SQL in `prisma/migrations/<timestamp>_<slug>/migration.sql` and review each statement. The common gotchas:

### CREATE INDEX on large tables → use CONCURRENTLY

Prisma emits plain `CREATE INDEX`, which takes an `ACCESS EXCLUSIVE` lock on the target table and blocks all writes until the index is built. For large tables this can mean minutes of downtime on the affected endpoints.

Fix: edit the SQL to use `CREATE INDEX CONCURRENTLY`. Important caveats:

- `CONCURRENTLY` cannot run inside a transaction. Prisma wraps the migration in a transaction by default — you need to break it out or accept that the statement will run in autocommit mode. Prisma migrate handles this correctly when the statement is the _only_ one in its own file; split the migration if necessary.
- A failing `CONCURRENTLY` leaves behind an `INVALID` index — the migration needs to drop and recreate it.

For **new tables** (never populated in production), the plain `CREATE INDEX` is fine: no blocking because no writers.

### ALTER TABLE ADD COLUMN with a default on large tables

Postgres 11+ supports fast default backfill for non-volatile defaults, so this is usually fine. For expressions that evaluate per-row (e.g. `DEFAULT now()` on a `DEFAULT` set at column creation for an existing wide table), consider a multi-step deploy: add the column nullable → backfill in a second migration → `SET NOT NULL` once the backfill is complete.

### DROP COLUMN / RENAME COLUMN

These break clients still running the old shape. Prefer the expand-and-contract pattern:

1. Migration A: add the new column (or new name), keep the old one around.
2. Deploy code that reads from the new column and writes to both.
3. Migration B (after the new code is fully rolled out): drop the old column.

## 3. Running on the dev database

If `prisma migrate status` reports drift, treat it as a signal to reconcile before layering more migrations. See [20260413200000_capture_db_push_drift](./migrations/20260413200000_capture_db_push_drift/migration.sql) for an example of capturing a prior `db:push` delta as a formal migration.

## 4. Production rollout

- Confirm the target DB is on the latest migration that is already in production (`prisma migrate status`).
- Apply with `prisma migrate deploy` (not `dev`), which is idempotent and non-interactive.
- If the migration contains `CONCURRENTLY` statements, monitor `pg_stat_activity` during the run for the index build progress.

## 5. Extensions

We depend on `pg_trgm` (declared via `previewFeatures = ["postgresqlExtensions"]` and `extensions = [pg_trgm]` in `schema.prisma`). Prisma emits the `CREATE EXTENSION IF NOT EXISTS` statement automatically when generating migrations — just make sure the managed DB allows extension creation (most Postgres providers do; some require a support ticket).
