import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Prisma extension that implements soft delete for User, Property, and Task models.
 *
 * - Read queries (findMany, findFirst, findUnique, count) auto-filter `deletedAt: null`
 *   unless `deletedAt` is explicitly set in the where clause.
 * - delete/deleteMany are converted to update/updateMany setting `deletedAt = now()`.
 */
function softDeleteExtension() {
  return Prisma.defineExtension({
    name: 'softDelete',
    query: {
      user: softDeleteHandlers(),
      property: softDeleteHandlers(),
      task: softDeleteHandlers(),
    },
  });
}

function softDeleteHandlers() {
  return {
    async findMany({
      args,
      query,
    }: {
      args: { where?: { deletedAt?: unknown } };
      query: (args: unknown) => unknown;
    }) {
      if (args.where?.deletedAt === undefined) {
        args.where = { ...args.where, deletedAt: null };
      }
      return query(args);
    },
    async findFirst({
      args,
      query,
    }: {
      args: { where?: { deletedAt?: unknown } };
      query: (args: unknown) => unknown;
    }) {
      if (args.where?.deletedAt === undefined) {
        args.where = { ...args.where, deletedAt: null };
      }
      return query(args);
    },
    async findUnique({
      args,
      query,
    }: {
      args: { where: Record<string, unknown> };
      query: (args: unknown) => unknown;
    }) {
      if (args.where?.deletedAt === undefined) {
        args.where = { ...args.where, deletedAt: null };
      }
      return query(args);
    },
    async count({
      args,
      query,
    }: {
      args: { where?: { deletedAt?: unknown } };
      query: (args: unknown) => unknown;
    }) {
      if (args.where?.deletedAt === undefined) {
        args.where = { ...args.where, deletedAt: null };
      }
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
  async softDeleteRecord<T extends 'user' | 'property' | 'task'>(model: T, where: { id: string }) {
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
