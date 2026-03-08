import { CategoryTemplatesRepository } from './category-templates.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoryTemplatesRepository', () => {
  let repository: CategoryTemplatesRepository;
  let prisma: PrismaService;

  const mockModel = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn((callbacks: Promise<unknown>[]) => Promise.all(callbacks)),
      categoryTemplate: mockModel,
    } as unknown as PrismaService;

    repository = new CategoryTemplatesRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByIdWithTasks', () => {
    it('should include tasks ordered by displayOrder asc', async () => {
      const template = {
        id: 'clx1cat00000001',
        name: 'Mantenimiento General',
        tasks: [{ id: 'clx1tsk00000001', displayOrder: 0 }],
      };
      mockModel.findUnique.mockResolvedValue(template);

      const result = await repository.findByIdWithTasks('clx1cat00000001');

      expect(mockModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'clx1cat00000001' },
        include: { tasks: { orderBy: { displayOrder: 'asc' } } },
      });
      expect(result).toEqual(template);
    });
  });

  describe('findByName', () => {
    it('should find template by exact name', async () => {
      const template = { id: 'clx1cat00000001', name: 'Electricidad' };
      mockModel.findFirst.mockResolvedValue(template);

      const result = await repository.findByName('Electricidad');

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { name: 'Electricidad' },
      });
      expect(result).toEqual(template);
    });
  });

  describe('reorder', () => {
    it('should run updates inside a $transaction', async () => {
      const ids = ['clx1cat00000001', 'clx1cat00000002', 'clx1cat00000003'];
      mockModel.update.mockResolvedValue({});

      await repository.reorder(ids);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should assign correct displayOrder indices', async () => {
      const ids = ['clx1cat00000003', 'clx1cat00000001', 'clx1cat00000002'];
      mockModel.update.mockResolvedValue({});

      await repository.reorder(ids);

      const transactionArg = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      expect(transactionArg).toHaveLength(3);

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'clx1cat00000003' },
        data: { displayOrder: 0 },
      });
      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'clx1cat00000001' },
        data: { displayOrder: 1 },
      });
      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'clx1cat00000002' },
        data: { displayOrder: 2 },
      });
    });
  });

  describe('findMany', () => {
    it('should return paginated results via base findMany', async () => {
      mockModel.findMany.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(0);

      const result = await repository.findMany({});

      expect(result).toEqual(
        expect.objectContaining({
          data: [],
          hasMore: false,
          total: 0,
        }),
      );
    });
  });

  describe('create', () => {
    it('should create a category template', async () => {
      const data = { name: 'Techos', displayOrder: 0 };
      mockModel.create.mockResolvedValue({ id: 'clx1cat00000004', ...data });

      const result = await repository.create(data);

      expect(mockModel.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(expect.objectContaining({ name: 'Techos' }));
    });
  });

  describe('update', () => {
    it('should update a category template by id', async () => {
      const updated = { id: 'clx1cat00000001', name: 'Techos y Cubiertas' };
      mockModel.update.mockResolvedValue(updated);

      const result = await repository.update('clx1cat00000001', { name: 'Techos y Cubiertas' });

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'clx1cat00000001' },
        data: { name: 'Techos y Cubiertas' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('hardDelete', () => {
    it('should delete a category template by id', async () => {
      mockModel.delete.mockResolvedValue({ id: 'clx1cat00000001' });

      await repository.hardDelete('clx1cat00000001');

      expect(mockModel.delete).toHaveBeenCalledWith({
        where: { id: 'clx1cat00000001' },
      });
    });
  });
});
