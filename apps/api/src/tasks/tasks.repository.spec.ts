import { TASKS_MAX_TAKE, TaskStatus } from '@epde/shared';

import { PrismaService } from '../prisma/prisma.service';
import { TasksRepository } from './tasks.repository';

describe('TasksRepository', () => {
  let repository: TasksRepository;
  let mockModel: Record<string, jest.Mock>;

  beforeEach(() => {
    mockModel = {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const prisma = {
      softDelete: { task: mockModel },
      task: mockModel,
    } as unknown as PrismaService;

    repository = new TasksRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('markOverdue', () => {
    it('should update tasks with correct where clause', async () => {
      mockModel.updateMany!.mockResolvedValue({ count: 5 });

      const result = await repository.markOverdue();

      expect(result).toBe(5);
      expect(mockModel.updateMany).toHaveBeenCalledWith({
        where: {
          nextDueDate: { lt: expect.any(Date) },
          status: { notIn: [TaskStatus.COMPLETED, TaskStatus.OVERDUE] },
          recurrenceType: { not: 'ON_DETECTION' },
        },
        data: { status: TaskStatus.OVERDUE },
      });
    });
  });

  describe('findUpcomingWithOwners', () => {
    it('should query correct date range', async () => {
      await repository.findUpcomingWithOwners(7);

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            nextDueDate: { gte: expect.any(Date), lte: expect.any(Date) },
            status: { not: TaskStatus.COMPLETED },
            recurrenceType: { not: 'ON_DETECTION' },
          },
        }),
      );

      const call = mockModel.findMany!.mock.calls[0][0];
      const gte = call.where.nextDueDate.gte as Date;
      const lte = call.where.nextDueDate.lte as Date;
      const diffDays = (lte.getTime() - gte.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(7, 0);
    });
  });

  describe('findOverdueWithOwners', () => {
    it('should filter by OVERDUE status', async () => {
      await repository.findOverdueWithOwners();

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            nextDueDate: { lt: expect.any(Date) },
            status: TaskStatus.OVERDUE,
            recurrenceType: { not: 'ON_DETECTION' },
          },
        }),
      );
    });
  });

  describe('findAllForList', () => {
    it('should cap take at TASKS_MAX_TAKE', async () => {
      await repository.findAllForList(undefined, undefined, 1000);

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: TASKS_MAX_TAKE }),
      );
    });

    it('should filter by userId when provided', async () => {
      await repository.findAllForList('user-1');

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            maintenancePlan: { property: { userId: 'user-1' } },
          }),
        }),
      );
    });
  });
});
