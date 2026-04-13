import { QuoteTemplatesRepository } from './quote-templates.repository';

/**
 * QuoteTemplatesRepository spec
 *
 * Verifies repository behaviour in isolation using a fully-mocked PrismaService.
 * Hard-delete and $transaction semantics are explicitly tested to document the
 * intentional bypass of BaseRepository (see class-level JSDoc for rationale).
 */
describe('QuoteTemplatesRepository', () => {
  const ITEM = { description: 'Mano de obra', quantity: 1, unitPrice: 5000, displayOrder: 0 };
  const TEMPLATE = { id: 'tpl-1', name: 'Pintura básica', items: [ITEM] };

  const mockFindMany = jest.fn();
  const mockFindUnique = jest.fn();
  const mockCreate = jest.fn();
  const mockDelete = jest.fn();
  const mockTransaction = jest.fn();

  const prisma = {
    quoteTemplate: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      delete: mockDelete,
    },
    $transaction: mockTransaction,
  };

  let repository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new QuoteTemplatesRepository(prisma as never);
  });

  // ─── findAll ─────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('delegates to prisma.quoteTemplate.findMany with items ordered by displayOrder', async () => {
      mockFindMany.mockResolvedValue([TEMPLATE]);

      const result = await repository.findAll();

      expect(mockFindMany).toHaveBeenCalledWith({
        include: { items: { orderBy: { displayOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      expect(result).toEqual([TEMPLATE]);
    });

    it('returns empty array when no templates exist', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns template with items when found', async () => {
      mockFindUnique.mockResolvedValue(TEMPLATE);

      const result = await repository.findById('tpl-1');

      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
        include: { items: { orderBy: { displayOrder: 'asc' } } },
      });
      expect(result).toEqual(TEMPLATE);
    });

    it('returns null when template does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);
      const result = await repository.findById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates template with nested items using displayOrder', async () => {
      mockCreate.mockResolvedValue(TEMPLATE);

      const result = await repository.create({
        name: 'Pintura básica',
        createdBy: 'user-1',
        items: [{ description: 'Mano de obra', quantity: 1, unitPrice: 5000 }],
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          name: 'Pintura básica',
          createdBy: 'user-1',
          items: {
            create: [
              { description: 'Mano de obra', quantity: 1, unitPrice: 5000, displayOrder: 0 },
            ],
          },
        },
        include: { items: { orderBy: { displayOrder: 'asc' } } },
      });
      expect(result).toEqual(TEMPLATE);
    });

    it('uses provided displayOrder when given', async () => {
      mockCreate.mockResolvedValue(TEMPLATE);

      await repository.create({
        name: 'Test',
        createdBy: 'user-1',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100, displayOrder: 5 }],
      });

      const call = mockCreate.mock.calls[0][0];
      expect(call.data.items.create[0].displayOrder).toBe(5);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('uses $transaction to atomically replace items and update name', async () => {
      const updatedTemplate = { ...TEMPLATE, name: 'Pintura completa' };

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          quoteTemplateItem: {
            deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          quoteTemplate: {
            update: jest.fn().mockResolvedValue(updatedTemplate),
          },
        };
        return fn(tx);
      });

      const result = await repository.update('tpl-1', {
        name: 'Pintura completa',
        items: [ITEM],
      });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedTemplate);
    });

    it('skips item replacement when items not provided', async () => {
      const updatedTemplate = { ...TEMPLATE, name: 'Renamed' };
      const mockTxItem = { deleteMany: jest.fn(), createMany: jest.fn() };
      const mockTxTemplate = { update: jest.fn().mockResolvedValue(updatedTemplate) };

      mockTransaction.mockImplementation(async (fn) => {
        return fn({ quoteTemplateItem: mockTxItem, quoteTemplate: mockTxTemplate });
      });

      await repository.update('tpl-1', { name: 'Renamed' });

      expect(mockTxItem.deleteMany).not.toHaveBeenCalled();
      expect(mockTxItem.createMany).not.toHaveBeenCalled();
      expect(mockTxTemplate.update).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
        data: { name: 'Renamed' },
        include: { items: { orderBy: { displayOrder: 'asc' } } },
      });
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('performs hard-delete via prisma.quoteTemplate.delete (no soft-delete)', async () => {
      mockDelete.mockResolvedValue(TEMPLATE);

      await repository.delete('tpl-1');

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'tpl-1' } });
    });

    it('does not set deletedAt — this is an intentional hard-delete', async () => {
      mockDelete.mockResolvedValue(TEMPLATE);
      await repository.delete('tpl-1');

      const call = mockDelete.mock.calls[0][0];
      expect(call).not.toHaveProperty('data');
    });
  });
});
