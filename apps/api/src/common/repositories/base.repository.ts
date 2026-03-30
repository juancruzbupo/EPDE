import { PAGINATION_DEFAULT_TAKE, PAGINATION_MAX_TAKE } from '@epde/shared';
import { Inject, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { PrismaService, SoftDeletableModel } from '../../prisma/prisma.service';
import { RequestCacheService } from '../request-cache/request-cache.service';

/**
 * Union of valid Prisma model names (lowercase camelCase delegates).
 * Constrains BaseRepository.modelName to prevent typos at compile time.
 */
export type PrismaModelName = {
  [K in keyof PrismaClient]: PrismaClient[K] extends { findMany: (...args: never[]) => unknown }
    ? K
    : never;
}[keyof PrismaClient];

// SoftDeletableModel is imported from prisma.service — keep in sync with SOFT_DELETABLE_MODELS
export type { SoftDeletableModel };

type PrismaQueryParams = {
  where?: Record<string, unknown>;
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  include?: Record<string, unknown>;
};

export interface FindManyParams {
  cursor?: string;
  take?: number;
  where?: Record<string, unknown>;
  orderBy?: Record<string, string>;
  include?: Record<string, unknown>;
  /** Skip COUNT(*) query for infinite-scroll callers that don't need a total. Default: true. */
  count?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export abstract class BaseRepository<
  T,
  M extends PrismaModelName = PrismaModelName,
  TCreateInput = unknown,
  TUpdateInput = unknown,
> {
  /**
   * Request-scoped cache injected via DI. Undefined in non-request contexts
   * (e.g. scheduler cron jobs) because Scope.REQUEST services have no scope there.
   */
  @Optional()
  @Inject(RequestCacheService)
  protected readonly requestCache?: RequestCacheService;

  /**
   * @param hasSoftDelete Must match SOFT_DELETABLE_MODELS in prisma.service.ts.
   *   When true, softDelete() is available and model/writeModel use the soft-delete extension.
   */
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: M,
    protected readonly hasSoftDelete: boolean = false,
  ) {}

  protected get model() {
    if (this.hasSoftDelete) {
      // Dynamic access — Prisma typed client doesn't support string-keyed model access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.prisma.softDelete as any)[this.modelName];
    }
    // Dynamic access — Prisma typed client doesn't support string-keyed model access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any)[this.modelName];
  }

  protected get writeModel() {
    // Dynamic access — Prisma typed client doesn't support string-keyed model access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Finds a record by primary key.
   * ⚠️ Owner-agnostic by design — does NOT filter by userId or any ownership field.
   * For CLIENT-accessible endpoints, always verify ownership in the service layer:
   *   - Listados: add `where.property = { userId: user.id }` before calling findMany
   *   - getById: check `record.userId === user.id` and throw ForbiddenException if not
   *   - Use findByIdSelect() for type-safe ownership field access
   */
  async findById(id: string, include?: Record<string, unknown>): Promise<T | null> {
    // Only cache simple lookups (no include) to avoid stale partial data
    if (!include && this.requestCache) {
      const cached = this.requestCache.get<T>(this.modelName, id);
      if (cached !== undefined) return cached;
    }

    const result = await this.model.findUnique({ where: { id }, ...(include && { include }) });

    if (!include && this.requestCache && result) {
      this.requestCache.set(this.modelName, id, result);
    }

    return result;
  }

  /**
   * Retrieves specific fields of an entity by ID using a typed `select` object.
   * Use this for ownership checks or when you need a typed subset of fields
   * without the `include`/`T` type gap that `findById` has.
   *
   * NOTE: `findById` with `include` returns `T` at the type level but the runtime
   * object contains the included relations. Use `findByIdSelect` when you need
   * to access specific fields in a type-safe way.
   *
   * @example
   * // Type-safe ownership check
   * const record = await this.repo.findByIdSelect<{ userId: string }>(id, { userId: true });
   * if (record?.userId !== currentUser.id) throw new ForbiddenException();
   */
  async findByIdSelect<TResult>(
    id: string,
    select: Record<string, boolean>,
  ): Promise<TResult | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.model as any).findUnique({ where: { id }, select });
  }

  async findMany(params: FindManyParams = {}): Promise<PaginatedResult<T>> {
    const take = Math.min(Math.max(params.take ?? PAGINATION_DEFAULT_TAKE, 1), PAGINATION_MAX_TAKE);
    const where = params.where ?? {};
    const orderBy = params.orderBy ?? { createdAt: 'desc' };
    const include = params.include;

    const queryParams: PrismaQueryParams = {
      where,
      orderBy,
      take: take + 1,
      ...(include && { include }),
    };

    if (params.cursor) {
      queryParams.cursor = { id: params.cursor };
      queryParams.skip = 1;
    }

    // Parallelize count + findMany for better performance.
    // Pass count: false for infinite-scroll callers that don't need a total (saves one DB round-trip).
    const shouldCount = params.count !== false;
    const [total, items] = await Promise.all([
      shouldCount ? (this.model.count({ where }) as Promise<number>) : Promise.resolve(0),
      this.model.findMany(queryParams) as Promise<T[]>,
    ]);

    const hasMore = items.length > take;
    const data = hasMore ? items.slice(0, take) : items;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextCursor = hasMore ? ((data[data.length - 1] as any)?.id ?? null) : null;

    return { data, nextCursor, hasMore, total };
  }

  async create(data: TCreateInput, include?: Record<string, unknown>): Promise<T> {
    return this.writeModel.create({ data, ...(include && { include }) });
  }

  async update(id: string, data: TUpdateInput, include?: Record<string, unknown>): Promise<T> {
    this.requestCache?.invalidate(this.modelName, id);
    return this.writeModel.update({ where: { id }, data, ...(include && { include }) });
  }

  async softDelete(id: string): Promise<T> {
    if (!this.hasSoftDelete) {
      throw new Error(`Model ${this.modelName} does not support soft delete`);
    }
    this.requestCache?.invalidate(this.modelName, id);
    return this.prisma.softDeleteRecord(this.modelName as SoftDeletableModel, { id }) as Promise<T>;
  }

  async hardDelete(id: string): Promise<T> {
    this.requestCache?.invalidate(this.modelName, id);
    return this.writeModel.delete({ where: { id } });
  }

  /**
   * Counts records matching the given filter.
   *
   * ⚠️ Prisma limitation: `_count` in `include` and raw `count()` on
   * soft-deletable models DO filter out `deletedAt != null` rows (via the
   * extension middleware). However, `_count` on **relations** (e.g.
   * `property._count.tasks`) does NOT inherit the soft-delete filter —
   * you must add `deletedAt: null` manually in those nested where clauses.
   */
  async count(where?: Record<string, unknown>): Promise<number> {
    return this.model.count({ ...(where && { where }) });
  }
}
