import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Recursively checks whether `deletedAt` appears in a where clause,
 * including inside AND, OR, and NOT logical operators.
 * Coverage: root-level, AND[], OR[], NOT (object or array).
 */
export function hasDeletedAtKey(where: Record<string, unknown>): boolean {
  if ('deletedAt' in where) return true;

  for (const key of ['AND', 'OR', 'NOT']) {
    const val = where[key];
    if (Array.isArray(val)) {
      if (val.some((v) => typeof v === 'object' && v !== null && hasDeletedAtKey(v))) return true;
    } else if (val && typeof val === 'object') {
      if (hasDeletedAtKey(val as Record<string, unknown>)) return true;
    }
  }
  return false;
}

function addSoftDeleteFilter(args: { where?: Record<string, unknown> }) {
  if (!hasDeletedAtKey(args.where || {})) {
    args.where = { ...args.where, deletedAt: null };
  }
}

/**
 * Prisma extension that implements soft delete for User, Property, Task, Category,
 * BudgetRequest, and ServiceRequest models.
 *
 * - Read queries (findMany, findFirst, findUnique, count, aggregate, groupBy)
 *   and updateMany auto-filter `deletedAt: null` unless `deletedAt` is
 *   explicitly set in the where clause (including inside AND/OR/NOT).
 * - Use `writeModel` in BaseRepository to bypass soft delete filtering.
 */
function softDeleteExtension() {
  return Prisma.defineExtension({
    name: 'softDelete',
    query: {
      // Keep in sync with SOFT_DELETABLE_MODELS
      user: softDeleteHandlers(),
      property: softDeleteHandlers(),
      task: softDeleteHandlers(),
      category: softDeleteHandlers(),
      budgetRequest: softDeleteHandlers(),
      serviceRequest: softDeleteHandlers(),
      inspectionChecklist: softDeleteHandlers(),
      inspectionItem: softDeleteHandlers(),
      professional: softDeleteHandlers(),
    },
  });
}

function softDeleteHandlers() {
  return {
    async findMany({
      args,
      query,
    }: {
      args: { where?: Record<string, unknown> };
      query: (args: unknown) => unknown;
    }) {
      addSoftDeleteFilter(args);
      return query(args);
    },
    async findFirst({
      args,
      query,
    }: {
      args: { where?: Record<string, unknown> };
      query: (args: unknown) => unknown;
    }) {
      addSoftDeleteFilter(args);
      return query(args);
    },
    async findUnique({
      args,
      query,
    }: {
      args: { where: Record<string, unknown> };
      query: (args: unknown) => unknown;
    }) {
      addSoftDeleteFilter(args);
      return query(args);
    },
    async count({
      args,
      query,
    }: {
      args: { where?: Record<string, unknown> };
      query: (args: unknown) => unknown;
    }) {
      addSoftDeleteFilter(args);
      return query(args);
    },
    async aggregate({
      args,
      query,
    }: {
      args: { where?: Record<string, unknown> };
      query: (args: unknown) => unknown;
    }) {
      addSoftDeleteFilter(args);
      return query(args);
    },
    async groupBy({
      args,
      query,
    }: {
      args: { where?: Record<string, unknown> };
      query: (args: unknown) => unknown;
    }) {
      addSoftDeleteFilter(args);
      return query(args);
    },
    async updateMany({
      args,
      query,
    }: {
      args: { where?: Record<string, unknown> };
      query: (args: unknown) => unknown;
    }) {
      addSoftDeleteFilter(args);
      return query(args);
    },
  };
}

/**
 * Models that opt into the soft-delete pattern. The Prisma extension
 * (`buildSoftDeleteExtension` above) injects `deletedAt: null` into every
 * findMany/findFirst/findUnique read for these models, and `softDeleteRecord`
 * sets `deletedAt: <now>` instead of issuing a DELETE.
 *
 * ## Criteria for adding a model here
 *
 * Add a model to this list ONLY if all three apply:
 *
 *   1. **Audit relevance** — there is a legal, commercial, or operational
 *      reason history must remain queryable. Audit logs do NOT belong here
 *      — they're append-only by construction (no soft-delete needed).
 *   2. **Recoverability is useful** — there is a realistic "undo delete"
 *      flow someone might invoke (admin restores a client; user un-archives
 *      a property). If the only outcome of "delete" is permanent removal,
 *      hard-delete is fine.
 *   3. **NOT a state machine** — the model's lifecycle is not modeled by a
 *      status enum. If status transitions cover the "removed but visible"
 *      case (e.g. `PlanStatus.ARCHIVED`, `BudgetStatus.REJECTED`), use the
 *      state machine — adding soft-delete on top creates two ways to mean
 *      "gone" and they will drift.
 *
 * ## Models that intentionally opt out
 *
 * - **MaintenancePlan** — uses `PlanStatus { DRAFT, ACTIVE, ARCHIVED }`. Plans
 *   live in cycles, are never "deleted" — they're activated, archived, and
 *   eventually superseded. See ADR-011.
 * - **Referral** — append-only audit history; conversion is a one-way
 *   transition (PENDING → CONVERTED). See ADR-010.
 * - **TaskLog / TaskNote / BudgetAuditLog / ServiceRequestAuditLog /
 *   Milestone / FailedNotification / PushTokens** — append-only or write-once
 *   tables. Soft-delete adds an unused `deletedAt` column.
 * - **Notification** — read state is mutated, but rows are hard-deleted on
 *   user clear-all. No history value past inbox eviction.
 *
 * ## When you change this list
 *
 * Update **all** of these together:
 *   1. This array (runtime extension behavior)
 *   2. `SOFT_DELETABLE_MODELS` in `eslint-rules/no-tx-without-soft-delete-filter.mjs`
 *      (lint-time enforcement; can't import this constant)
 *   3. `SOFT_DELETABLE_MODELS` in
 *      `eslint-rules/no-soft-deletable-include-without-filter.mjs`
 *   4. The Prisma model: add `deletedAt DateTime?` and `@@index([deletedAt])`
 *
 * The drift test `soft-deletable-models-sync.test.ts` in `@epde/shared`
 * will fail CI if (1) and (2)/(3) get out of sync.
 */
export const SOFT_DELETABLE_MODELS = [
  'user',
  'property',
  'task',
  'category',
  'budgetRequest',
  'serviceRequest',
  'inspectionChecklist',
  'inspectionItem',
  'professional',
] as const;
export type SoftDeletableModel = (typeof SOFT_DELETABLE_MODELS)[number];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _extended: ReturnType<typeof this.createExtended> | undefined;

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? [
              { emit: 'event', level: 'warn' },
              { emit: 'event', level: 'error' },
            ]
          : [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'warn' },
              { emit: 'event', level: 'error' },
            ],
    });
  }

  async onModuleInit() {
    // Subscribe to Prisma log events for observability
    // @ts-expect-error -- Prisma event callback types are not perfectly typed
    this.$on('warn', (e: { message: string }) => {
      this.logger.warn(`Prisma: ${e.message}`);
    });
    // @ts-expect-error -- Prisma event callback types
    this.$on('error', (e: { message: string }) => {
      this.logger.error(`Prisma: ${e.message}`);
    });
    if (process.env.NODE_ENV !== 'production') {
      // Log slow queries (> 500ms) in development for early detection
      // @ts-expect-error -- Prisma event callback types
      this.$on('query', (e: { query: string; duration: number }) => {
        if (e.duration > 500) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query.slice(0, 200)}`);
        }
      });
    }

    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Returns the Prisma client with soft delete extensions applied.
   * Use this for all read operations on soft-deletable models.
   */
  get softDelete() {
    if (!this._extended) {
      this._extended = this.createExtended();
    }
    return this._extended;
  }

  /**
   * Soft-delete a record by setting deletedAt to now.
   * Use this instead of prisma.model.delete() for soft-deletable models.
   */
  async softDeleteRecord<T extends SoftDeletableModel>(model: T, where: { id: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this[model] as any).update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  /**
   * ⚠️ CRITICAL: This soft-delete extension does NOT apply inside $transaction callbacks.
   * Inside $transaction, you MUST add `deletedAt: null` manually to all queries
   * on soft-deletable models (user, property, task, category, budgetRequest, serviceRequest).
   * See ai-development-guide.md SIEMPRE #72 for details.
   */
  private createExtended() {
    return this.$extends(softDeleteExtension());
  }
}
