import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Checks if `deletedAt` is present in the where clause at the root level
 * or inside logical operators (AND, OR, NOT). This prevents the extension
 * from overriding explicit soft-delete filters.
 */
function hasDeletedAtKey(where: Record<string, unknown>): boolean {
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
      user: softDeleteHandlers(),
      property: softDeleteHandlers(),
      task: softDeleteHandlers(),
      category: softDeleteHandlers(),
      budgetRequest: softDeleteHandlers(),
      serviceRequest: softDeleteHandlers(),
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

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _extended: ReturnType<typeof this.createExtended> | undefined;

  async onModuleInit() {
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
  async softDeleteRecord<
    T extends 'user' | 'property' | 'task' | 'category' | 'budgetRequest' | 'serviceRequest',
  >(model: T, where: { id: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this[model] as any).update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  private createExtended() {
    return this.$extends(softDeleteExtension());
  }
}
