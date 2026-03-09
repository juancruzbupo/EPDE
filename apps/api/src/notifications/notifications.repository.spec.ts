import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsRepository } from './notifications.repository';

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;
  let prisma: PrismaService;

  const mockModel = {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(() => {
    prisma = {
      notification: mockModel,
    } as unknown as PrismaService;

    repository = new NotificationsRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createMany', () => {
    it('should return 0 for empty array without calling createMany', async () => {
      const result = await repository.createMany([]);

      expect(result).toBe(0);
      expect(mockModel.createMany).not.toHaveBeenCalled();
    });

    it('should serialize data as Prisma.InputJsonValue', async () => {
      mockModel.createMany.mockResolvedValue({ count: 1 });

      await repository.createMany([
        {
          userId: 'user-1',
          type: 'TASK_REMINDER',
          title: 'Recordatorio',
          message: 'Tarea pendiente',
          data: { taskId: 'task-1' },
        },
      ]);

      expect(mockModel.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: 'user-1',
            type: 'TASK_REMINDER',
            data: { taskId: 'task-1' },
          }),
        ],
      });
    });

    it('should use Prisma.JsonNull when data is null', async () => {
      mockModel.createMany.mockResolvedValue({ count: 1 });

      await repository.createMany([
        {
          userId: 'user-1',
          type: 'SYSTEM',
          title: 'Sistema',
          message: 'Mensaje',
          data: null,
        },
      ]);

      expect(mockModel.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            data: Prisma.JsonNull,
          }),
        ],
      });
    });
  });

  describe('findTodayReminderTaskIds', () => {
    it('should query by TASK_REMINDER type and today', async () => {
      mockModel.findMany.mockResolvedValue([]);

      await repository.findTodayReminderTaskIds();

      expect(mockModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'TASK_REMINDER',
            createdAt: { gte: expect.any(Date) },
          }),
          select: { data: true },
        }),
      );
    });

    it('should return Set of taskIds from valid data', async () => {
      mockModel.findMany.mockResolvedValue([
        { data: { taskId: 'task-1' } },
        { data: { taskId: 'task-2' } },
      ]);

      const result = await repository.findTodayReminderTaskIds();

      expect(result).toBeInstanceOf(Set);
      expect(result.has('task-1')).toBe(true);
      expect(result.has('task-2')).toBe(true);
      expect(result.size).toBe(2);
    });

    it('should filter out notifications without taskId field', async () => {
      mockModel.findMany.mockResolvedValue([
        { data: { taskId: 'task-1' } },
        { data: { other: 'value' } },
        { data: null },
      ]);

      const result = await repository.findTodayReminderTaskIds();

      expect(result.size).toBe(1);
      expect(result.has('task-1')).toBe(true);
    });

    it('should return empty Set when no reminders exist', async () => {
      mockModel.findMany.mockResolvedValue([]);

      const result = await repository.findTodayReminderTaskIds();

      expect(result.size).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread notifications for user and return count', async () => {
      mockModel.updateMany.mockResolvedValue({ count: 5 });

      const result = await repository.markAllAsRead('user-1');

      expect(result).toBe(5);
      expect(mockModel.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true },
      });
    });
  });

  describe('markAsRead', () => {
    it('should update by id and userId', async () => {
      mockModel.update.mockResolvedValue({ id: 'n-1', read: true });

      await repository.markAsRead('n-1', 'user-1');

      expect(mockModel.update).toHaveBeenCalledWith({
        where: { id: 'n-1', userId: 'user-1' },
        data: { read: true },
      });
    });
  });

  describe('countUnread', () => {
    it('should count with userId and read: false', async () => {
      mockModel.count.mockResolvedValue(3);

      const result = await repository.countUnread('user-1');

      expect(result).toBe(3);
    });
  });
});
