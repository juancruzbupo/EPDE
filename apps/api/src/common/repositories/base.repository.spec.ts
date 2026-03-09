import { PAGINATION_DEFAULT_TAKE, PAGINATION_MAX_TAKE } from '@epde/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from './base.repository';

// Concrete test subclass — uses 'user' as the model name
class TestRepository extends BaseRepository<{ id: string }, 'user'> {
  constructor(prisma: PrismaService, hasSoftDelete = false) {
    super(prisma, 'user', hasSoftDelete);
  }
}

describe('BaseRepository', () => {
  let prisma: PrismaService;

  const mockRegularModel = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockSoftDeleteModel = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      user: mockRegularModel,
      softDelete: { user: mockSoftDeleteModel },
      softDeleteRecord: jest.fn(),
    } as unknown as PrismaService;
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------------------------------------------------------------------
  // model getter
  // ---------------------------------------------------------------------------

  describe('model getter', () => {
    it('returns prisma[modelName] when hasSoftDelete is false', () => {
      const repo = new TestRepository(prisma, false);
      // Access via findById to exercise the getter
      mockRegularModel.findUnique.mockResolvedValue(null);

      void repo.findById('any-id');

      expect(mockRegularModel.findUnique).toHaveBeenCalled();
      expect(mockSoftDeleteModel.findUnique).not.toHaveBeenCalled();
    });

    it('returns prisma.softDelete[modelName] when hasSoftDelete is true', () => {
      const repo = new TestRepository(prisma, true);
      mockSoftDeleteModel.findUnique.mockResolvedValue(null);

      void repo.findById('any-id');

      expect(mockSoftDeleteModel.findUnique).toHaveBeenCalled();
      expect(mockRegularModel.findUnique).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // writeModel getter
  // ---------------------------------------------------------------------------

  describe('writeModel getter', () => {
    it('always uses prisma[modelName] regardless of hasSoftDelete', async () => {
      const repoWithSoftDelete = new TestRepository(prisma, true);
      const record = { id: 'created-1' };
      mockRegularModel.create.mockResolvedValue(record);

      const result = await repoWithSoftDelete.create({ id: 'input' });

      expect(result).toBe(record);
      expect(mockRegularModel.create).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------

  describe('findById', () => {
    it('delegates to model.findUnique with { where: { id } }', async () => {
      const repo = new TestRepository(prisma, false);
      const record = { id: 'record-1' };
      mockRegularModel.findUnique.mockResolvedValue(record);

      const result = await repo.findById('record-1');

      expect(mockRegularModel.findUnique).toHaveBeenCalledWith({ where: { id: 'record-1' } });
      expect(result).toBe(record);
    });

    it('passes include when provided', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findUnique.mockResolvedValue(null);
      const include = { profile: true };

      await repo.findById('record-1', include);

      expect(mockRegularModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        include,
      });
    });

    it('omits include key when not provided', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findUnique.mockResolvedValue(null);

      await repo.findById('record-1');

      const call = mockRegularModel.findUnique.mock.calls[0][0] as Record<string, unknown>;
      expect(call).not.toHaveProperty('include');
    });
  });

  // ---------------------------------------------------------------------------
  // findByIdSelect
  // ---------------------------------------------------------------------------

  describe('findByIdSelect', () => {
    it('delegates to model.findUnique with { where: { id }, select }', async () => {
      const repo = new TestRepository(prisma, false);
      const partial = { id: 'record-1' };
      mockRegularModel.findUnique.mockResolvedValue(partial);
      const select = { id: true };

      const result = await repo.findByIdSelect<{ id: string }>('record-1', select);

      expect(mockRegularModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'record-1' },
        select,
      });
      expect(result).toBe(partial);
    });
  });

  // ---------------------------------------------------------------------------
  // findMany
  // ---------------------------------------------------------------------------

  describe('findMany', () => {
    it('queries with take + 1 and no cursor/skip when cursor is not provided', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findMany.mockResolvedValue([]);
      mockRegularModel.count.mockResolvedValue(0);

      await repo.findMany({ take: 5 });

      expect(mockRegularModel.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 6 }));
      const call = mockRegularModel.findMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call).not.toHaveProperty('cursor');
      expect(call).not.toHaveProperty('skip');
    });

    it('includes cursor: { id } and skip: 1 when cursor is provided', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findMany.mockResolvedValue([]);
      mockRegularModel.count.mockResolvedValue(0);

      await repo.findMany({ cursor: 'cursor-id', take: 5 });

      expect(mockRegularModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'cursor-id' },
          skip: 1,
        }),
      );
    });

    it('sets hasMore=true, slices data, and sets nextCursor when items.length > take', async () => {
      const repo = new TestRepository(prisma, false);
      const take = 3;
      // Return take + 1 items to simulate hasMore
      const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
      mockRegularModel.findMany.mockResolvedValue(items);
      mockRegularModel.count.mockResolvedValue(10);

      const result = await repo.findMany({ take });

      expect(result.hasMore).toBe(true);
      expect(result.data).toHaveLength(take);
      expect(result.data).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
      expect(result.nextCursor).toBe('c');
    });

    it('sets hasMore=false and nextCursor=null when items.length <= take', async () => {
      const repo = new TestRepository(prisma, false);
      const items = [{ id: 'a' }, { id: 'b' }];
      mockRegularModel.findMany.mockResolvedValue(items);
      mockRegularModel.count.mockResolvedValue(2);

      const result = await repo.findMany({ take: 5 });

      expect(result.hasMore).toBe(false);
      expect(result.data).toEqual(items);
      expect(result.nextCursor).toBeNull();
    });

    it('skips the COUNT query and returns total=0 when count is false', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findMany.mockResolvedValue([]);

      const result = await repo.findMany({ count: false });

      expect(mockRegularModel.count).not.toHaveBeenCalled();
      expect(result.total).toBe(0);
    });

    it('clamps take to PAGINATION_MAX_TAKE when an oversized value is passed', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findMany.mockResolvedValue([]);
      mockRegularModel.count.mockResolvedValue(0);

      await repo.findMany({ take: 99999 });

      const call = mockRegularModel.findMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call.take).toBe(PAGINATION_MAX_TAKE + 1);
    });

    it('clamps take to 1 when zero or negative value is passed', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findMany.mockResolvedValue([]);
      mockRegularModel.count.mockResolvedValue(0);

      await repo.findMany({ take: 0 });

      const call = mockRegularModel.findMany.mock.calls[0][0] as Record<string, unknown>;
      // Math.min(Math.max(0, 1), PAGINATION_MAX_TAKE) + 1 = 2
      expect(call.take).toBe(2);
    });

    it('uses PAGINATION_DEFAULT_TAKE when take is not provided', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findMany.mockResolvedValue([]);
      mockRegularModel.count.mockResolvedValue(0);

      await repo.findMany();

      const call = mockRegularModel.findMany.mock.calls[0][0] as Record<string, unknown>;
      expect(call.take).toBe(PAGINATION_DEFAULT_TAKE + 1);
    });

    it('returns empty data, null nextCursor and hasMore=false for empty result', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findMany.mockResolvedValue([]);
      mockRegularModel.count.mockResolvedValue(0);

      const result = await repo.findMany();

      expect(result.data).toEqual([]);
      expect(result.nextCursor).toBeNull();
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(0);
    });

    it('passes where, orderBy and include to the underlying query', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.findMany.mockResolvedValue([]);
      mockRegularModel.count.mockResolvedValue(0);

      const where = { name: 'test' };
      const orderBy = { name: 'asc' };
      const include = { profile: true };

      await repo.findMany({ where, orderBy, include });

      expect(mockRegularModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where, orderBy, include }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  describe('create', () => {
    it('delegates to writeModel.create with { data }', async () => {
      const repo = new TestRepository(prisma, false);
      const input = { id: 'new-1' };
      mockRegularModel.create.mockResolvedValue(input);

      const result = await repo.create(input);

      expect(mockRegularModel.create).toHaveBeenCalledWith({ data: input });
      expect(result).toBe(input);
    });

    it('passes include when provided', async () => {
      const repo = new TestRepository(prisma, false);
      const input = { id: 'new-1' };
      const include = { profile: true };
      mockRegularModel.create.mockResolvedValue(input);

      await repo.create(input, include);

      expect(mockRegularModel.create).toHaveBeenCalledWith({ data: input, include });
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe('update', () => {
    it('delegates to writeModel.update with { where: { id }, data }', async () => {
      const repo = new TestRepository(prisma, false);
      const updated = { id: 'rec-1' };
      mockRegularModel.update.mockResolvedValue(updated);

      const result = await repo.update('rec-1', { id: 'rec-1' });

      expect(mockRegularModel.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: { id: 'rec-1' },
      });
      expect(result).toBe(updated);
    });

    it('passes include when provided', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.update.mockResolvedValue({ id: 'rec-1' });
      const include = { profile: true };

      await repo.update('rec-1', { id: 'rec-1' }, include);

      expect(mockRegularModel.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: { id: 'rec-1' },
        include,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // softDelete
  // ---------------------------------------------------------------------------

  describe('softDelete', () => {
    it('delegates to prisma.softDeleteRecord when hasSoftDelete is true', async () => {
      const repo = new TestRepository(prisma, true);
      const deleted = { id: 'rec-1' };
      (prisma.softDeleteRecord as jest.Mock).mockResolvedValue(deleted);

      const result = await repo.softDelete('rec-1');

      expect(prisma.softDeleteRecord).toHaveBeenCalledWith('user', { id: 'rec-1' });
      expect(result).toBe(deleted);
    });

    it('throws an Error when hasSoftDelete is false', async () => {
      const repo = new TestRepository(prisma, false);

      await expect(repo.softDelete('rec-1')).rejects.toThrow(
        'Model user does not support soft delete',
      );
      expect(prisma.softDeleteRecord).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // hardDelete
  // ---------------------------------------------------------------------------

  describe('hardDelete', () => {
    it('delegates to writeModel.delete with { where: { id } }', async () => {
      const repo = new TestRepository(prisma, false);
      const deleted = { id: 'rec-1' };
      mockRegularModel.delete.mockResolvedValue(deleted);

      const result = await repo.hardDelete('rec-1');

      expect(mockRegularModel.delete).toHaveBeenCalledWith({ where: { id: 'rec-1' } });
      expect(result).toBe(deleted);
    });
  });

  // ---------------------------------------------------------------------------
  // count
  // ---------------------------------------------------------------------------

  describe('count', () => {
    it('delegates to model.count without where when called with no arguments', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.count.mockResolvedValue(42);

      const result = await repo.count();

      expect(mockRegularModel.count).toHaveBeenCalledWith({});
      expect(result).toBe(42);
    });

    it('delegates to model.count with { where } when where is provided', async () => {
      const repo = new TestRepository(prisma, false);
      mockRegularModel.count.mockResolvedValue(5);
      const where = { active: true };

      const result = await repo.count(where);

      expect(mockRegularModel.count).toHaveBeenCalledWith({ where });
      expect(result).toBe(5);
    });

    it('uses softDelete model for count when hasSoftDelete is true', async () => {
      const repo = new TestRepository(prisma, true);
      mockSoftDeleteModel.count.mockResolvedValue(3);

      const result = await repo.count();

      expect(mockSoftDeleteModel.count).toHaveBeenCalled();
      expect(mockRegularModel.count).not.toHaveBeenCalled();
      expect(result).toBe(3);
    });
  });
});
