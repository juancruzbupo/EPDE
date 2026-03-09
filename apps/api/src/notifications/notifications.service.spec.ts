import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationsRepository: {
    findByUser: jest.Mock;
    countUnread: jest.Mock;
    markAsRead: jest.Mock;
    markAllAsRead: jest.Mock;
    createMany: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    notificationsRepository = {
      findByUser: jest.fn(),
      countUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: notificationsRepository },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('getNotifications', () => {
    it('should return paginated notifications for user', async () => {
      const paginatedResult = {
        data: [
          { id: 'notif-1', userId: 'user-1', title: 'Tarea pendiente', read: false },
          { id: 'notif-2', userId: 'user-1', title: 'Presupuesto aprobado', read: true },
        ],
        nextCursor: null,
        hasMore: false,
        total: 2,
      };
      notificationsRepository.findByUser.mockResolvedValue(paginatedResult);

      const result = await service.getNotifications('user-1');

      expect(result).toEqual(paginatedResult);
      expect(notificationsRepository.findByUser).toHaveBeenCalledWith(
        'user-1',
        undefined,
        undefined,
      );
    });

    it('should pass cursor and take parameters', async () => {
      notificationsRepository.findByUser.mockResolvedValue({
        data: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      });

      await service.getNotifications('user-1', 'cursor-abc', 5);

      expect(notificationsRepository.findByUser).toHaveBeenCalledWith('user-1', 'cursor-abc', 5);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      notificationsRepository.countUnread.mockResolvedValue(7);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(7);
      expect(notificationsRepository.countUnread).toHaveBeenCalledWith('user-1');
    });

    it('should return 0 when no unread notifications', async () => {
      notificationsRepository.countUnread.mockResolvedValue(0);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark a single notification as read', async () => {
      const updatedNotif = { id: 'notif-1', userId: 'user-1', read: true };
      notificationsRepository.markAsRead.mockResolvedValue(updatedNotif);

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result).toEqual(updatedNotif);
      expect(notificationsRepository.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      notificationsRepository.markAllAsRead.mockResolvedValue(5);

      const result = await service.markAllAsRead('user-1');

      expect(result).toBe(5);
      expect(notificationsRepository.markAllAsRead).toHaveBeenCalledWith('user-1');
    });

    it('should return 0 when no unread notifications exist', async () => {
      notificationsRepository.markAllAsRead.mockResolvedValue(0);

      const result = await service.markAllAsRead('user-1');

      expect(result).toBe(0);
    });
  });

  describe('createNotifications', () => {
    it('should create multiple notifications', async () => {
      const notifications = [
        {
          userId: 'user-1',
          type: 'TASK_REMINDER' as const,
          title: 'Tarea pendiente',
          message: 'La tarea X vence pronto',
        },
        {
          userId: 'user-2',
          type: 'BUDGET_UPDATE' as const,
          title: 'Presupuesto actualizado',
          message: 'Tu presupuesto fue cotizado',
        },
      ];
      notificationsRepository.createMany.mockResolvedValue(2);

      const result = await service.createNotifications(notifications);

      expect(result).toBe(2);
      expect(notificationsRepository.createMany).toHaveBeenCalledWith(notifications);
    });

    it('should return 0 for empty array without calling repository', async () => {
      const result = await service.createNotifications([]);

      expect(result).toBe(0);
      expect(notificationsRepository.createMany).not.toHaveBeenCalled();
    });
  });

  describe('createNotification', () => {
    it('should create a single notification', async () => {
      const notifData = {
        userId: 'user-1',
        type: 'SYSTEM' as const,
        title: 'Bienvenido',
        message: 'Bienvenido a EPDE',
        data: { action: 'welcome' },
      };
      const createdNotif = {
        id: 'notif-new',
        ...notifData,
        read: false,
        createdAt: new Date(),
      };
      notificationsRepository.create.mockResolvedValue(createdNotif);

      const result = await service.createNotification(notifData);

      expect(result).toEqual(createdNotif);
      expect(notificationsRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'SYSTEM',
        title: 'Bienvenido',
        message: 'Bienvenido a EPDE',
        data: { action: 'welcome' },
      });
    });

    it('should pass null data when not provided', async () => {
      const notifData = {
        userId: 'user-1',
        type: 'TASK_REMINDER' as const,
        title: 'Recordatorio',
        message: 'Tarea vencida',
      };
      notificationsRepository.create.mockResolvedValue({ id: 'notif-new', ...notifData });

      await service.createNotification(notifData);

      expect(notificationsRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'TASK_REMINDER',
        title: 'Recordatorio',
        message: 'Tarea vencida',
        data: null,
      });
    });
  });
});
