import { PrismaService } from '../../prisma/prisma.service';

export interface FindManyParams {
  cursor?: string;
  take?: number;
  where?: Record<string, unknown>;
  orderBy?: Record<string, string>;
  include?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: string,
    protected readonly hasSoftDelete: boolean = false,
  ) {}

  protected get model() {
    if (this.hasSoftDelete) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (this.prisma.softDelete as any)[this.modelName];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any)[this.modelName];
  }

  protected get writeModel() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: string, include?: Record<string, unknown>): Promise<T | null> {
    return this.model.findFirst({ where: { id }, ...(include && { include }) });
  }

  private static readonly MAX_PAGE_SIZE = 100;

  async findMany(params: FindManyParams = {}): Promise<PaginatedResult<T>> {
    const take = Math.min(Math.max(params.take ?? 20, 1), BaseRepository.MAX_PAGE_SIZE);
    const where = params.where ?? {};
    const orderBy = params.orderBy ?? { createdAt: 'desc' };
    const include = params.include;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryParams: any = {
      where,
      orderBy,
      take: take + 1,
      ...(include && { include }),
    };

    if (params.cursor) {
      queryParams.cursor = { id: params.cursor };
      queryParams.skip = 1;
    }

    // Parallelize count + findMany for better performance
    const [total, items] = await Promise.all([
      this.model.count({ where }) as Promise<number>,
      this.model.findMany(queryParams) as Promise<T[]>,
    ]);

    const hasMore = items.length > take;
    const data = hasMore ? items.slice(0, take) : items;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextCursor = hasMore ? ((data[data.length - 1] as any)?.id ?? null) : null;

    return { data, nextCursor, hasMore, total };
  }

  async create(data: unknown, include?: Record<string, unknown>): Promise<T> {
    return this.writeModel.create({ data, ...(include && { include }) });
  }

  async update(id: string, data: unknown, include?: Record<string, unknown>): Promise<T> {
    return this.writeModel.update({ where: { id }, data, ...(include && { include }) });
  }

  async softDelete(id: string): Promise<T> {
    if (!this.hasSoftDelete) {
      throw new Error(`Model ${this.modelName} does not support soft delete`);
    }
    return this.prisma.softDeleteRecord(this.modelName as 'user' | 'property' | 'task', {
      id,
    }) as Promise<T>;
  }

  async hardDelete(id: string): Promise<T> {
    return this.writeModel.delete({ where: { id } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.model.count({ ...(where && { where }) });
  }
}
