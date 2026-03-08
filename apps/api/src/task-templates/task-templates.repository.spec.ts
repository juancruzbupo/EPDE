import { TaskTemplatesRepository } from './task-templates.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('TaskTemplatesRepository', () => {
  let repository: TaskTemplatesRepository;
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
      taskTemplate: mockModel,
    } as unknown as PrismaService;

    repository = new TaskTemplatesRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByCategoryId', () => {
    it('should filter by categoryId and order by displayOrder asc', async () => {
      const tasks = [
        { id: 'clx1tsk00000001', categoryId: 'clx1cat00000001', displayOrder: 0 },
        { id: 'clx1tsk00000002', categoryId: 'clx1cat00000001', displayOrder: 1 },
      ];
      mockModel.findMany.mockResolvedValue(tasks);

      const result = await repository.findByCategoryId('clx1cat00000001');

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'clx1cat00000001' },
        orderBy: { displayOrder: 'asc' },
      });
      expect(result).toEqual(tasks);
    });
  });

  describe('reorder', () => {
    it('should run updates inside a $transaction', async () => {
      const ids = ['clx1tsk00000001', 'clx1tsk00000002'];
      mockModel.update.mockResolvedValue({});

      await repository.reorder('clx1cat00000001', ids);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should scope updates within categoryId and assign correct indices', async () => {
      const ids = ['clx1tsk00000002', 'clx1tsk00000001'];
      mockModel.update.mockResolvedValue({});

      await repository.reorder('clx1cat00000001', ids);

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'clx1tsk00000002' },
        data: { displayOrder: 0 },
      });
      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'clx1tsk00000001' },
        data: { displayOrder: 1 },
      });
    });
  });

  describe('create', () => {
    it('should create a task template', async () => {
      const data = {
        name: 'Revisar tablero eléctrico',
        categoryId: 'clx1cat00000001',
        displayOrder: 0,
      };
      mockModel.create.mockResolvedValue({ id: 'clx1tsk00000003', ...data });

      const result = await repository.create(data);

      expect(mockModel.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(expect.objectContaining({ name: 'Revisar tablero eléctrico' }));
    });
  });

  describe('update', () => {
    it('should update a task template by id', async () => {
      const updated = { id: 'clx1tsk00000001', name: 'Verificar térmicas' };
      mockModel.update.mockResolvedValue(updated);

      const result = await repository.update('clx1tsk00000001', { name: 'Verificar térmicas' });

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'clx1tsk00000001' },
        data: { name: 'Verificar térmicas' },
      });
      expect(result).toEqual(updated);
    });
  });

  describe('hardDelete', () => {
    it('should delete a task template by id', async () => {
      mockModel.delete.mockResolvedValue({ id: 'clx1tsk00000001' });

      await repository.hardDelete('clx1tsk00000001');

      expect(mockModel.delete).toHaveBeenCalledWith({
        where: { id: 'clx1tsk00000001' },
      });
    });
  });
});
