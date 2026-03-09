import { PrismaService } from '../prisma/prisma.service';
import { CategoriesRepository } from './categories.repository';

describe('CategoriesRepository', () => {
  let repository: CategoriesRepository;
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

  const mockTaskModel = {
    count: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      softDelete: { category: mockModel, task: mockTaskModel },
      category: mockModel,
    } as unknown as PrismaService;

    repository = new CategoriesRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should order by order asc', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findAll();

      expect(mockModel.findMany).toHaveBeenCalledWith({
        orderBy: { order: 'asc' },
        take: 100,
      });
    });

    it('should limit to 100 results', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findAll();

      const call = mockModel.findMany.mock.calls[0][0];
      expect(call.take).toBe(100);
    });
  });

  describe('findByName', () => {
    it('should find category by exact name', async () => {
      const category = { id: 'clx1abc00000001', name: 'Electricidad' };
      mockModel.findFirst.mockResolvedValue(category);

      const result = await repository.findByName('Electricidad');

      expect(mockModel.findFirst).toHaveBeenCalledWith({
        where: { name: 'Electricidad' },
      });
      expect(result).toEqual(category);
    });
  });

  describe('hasReferencingTasks', () => {
    it('should return true when tasks reference the category', async () => {
      mockTaskModel.count.mockResolvedValue(3);

      const result = await repository.hasReferencingTasks('clx1abc00000001');

      expect(mockTaskModel.count).toHaveBeenCalledWith({
        where: { categoryId: 'clx1abc00000001' },
      });
      expect(result).toBe(true);
    });

    it('should return false when no tasks reference the category', async () => {
      mockTaskModel.count.mockResolvedValue(0);

      const result = await repository.hasReferencingTasks('clx1abc00000001');

      expect(mockTaskModel.count).toHaveBeenCalledWith({
        where: { categoryId: 'clx1abc00000001' },
      });
      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('should create a category via writeModel', async () => {
      const data = { name: 'Plomería', order: 2 };
      mockModel.create.mockResolvedValue({ id: 'clx1abc00000002', ...data });

      const result = await repository.create(data);

      expect(mockModel.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(expect.objectContaining({ name: 'Plomería' }));
    });
  });

  describe('update', () => {
    it('should update a category by id', async () => {
      const updated = { id: 'clx1abc00000001', name: 'Electricidad General', order: 1 };
      mockModel.update.mockResolvedValue(updated);

      const result = await repository.update('clx1abc00000001', { name: 'Electricidad General' });

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'clx1abc00000001' },
        data: { name: 'Electricidad General' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('hardDelete', () => {
    it('should delete a category by id', async () => {
      mockModel.delete.mockResolvedValue({ id: 'clx1abc00000001' });

      await repository.hardDelete('clx1abc00000001');

      expect(mockModel.delete).toHaveBeenCalledWith({
        where: { id: 'clx1abc00000001' },
      });
    });
  });

  describe('findById', () => {
    it('should find category by id', async () => {
      const category = { id: 'clx1abc00000001', name: 'Electricidad', order: 1 };
      mockModel.findUnique.mockResolvedValue(category);

      const result = await repository.findById('clx1abc00000001');

      expect(mockModel.findUnique).toHaveBeenCalledWith({
        where: { id: 'clx1abc00000001' },
      });
      expect(result).toEqual(category);
    });
  });
});
