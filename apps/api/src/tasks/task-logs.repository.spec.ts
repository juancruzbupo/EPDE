import { PrismaService } from '../prisma/prisma.service';
import { TaskLogsRepository } from './task-logs.repository';

describe('TaskLogsRepository', () => {
  let repository: TaskLogsRepository;
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
      taskLog: mockModel,
    } as unknown as PrismaService;

    repository = new TaskLogsRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByTaskId', () => {
    it('should filter by taskId', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findByTaskId('clx1tsk00000001');

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taskId: 'clx1tsk00000001' },
        }),
      );
    });

    it('should order by completedAt desc', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findByTaskId('clx1tsk00000001');

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { completedAt: 'desc' },
        }),
      );
    });

    it('should include user with id and name', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findByTaskId('clx1tsk00000001');

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: { select: { id: true, name: true } },
          },
        }),
      );
    });

    it('should return empty array when no logs exist', async () => {
      mockModel.findMany.mockResolvedValue([]);

      const result = await repository.findByTaskId('clx1tsk00000001');

      expect(result).toEqual([]);
    });
  });
});
