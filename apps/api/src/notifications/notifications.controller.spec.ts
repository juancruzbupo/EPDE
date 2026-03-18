import type { CurrentUser as CurrentUserPayload } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

const mockNotificationsService = {
  getNotifications: jest.fn(),
  getUnreadCount: jest.fn(),
  markAllAsRead: jest.fn(),
  markAsRead: jest.fn(),
};

const mockPushService = {
  registerToken: jest.fn().mockResolvedValue(undefined),
  removeToken: jest.fn().mockResolvedValue(undefined),
  removeAllForUser: jest.fn().mockResolvedValue(undefined),
  sendToUsers: jest.fn().mockResolvedValue(undefined),
};

const clientUser: CurrentUserPayload = {
  id: 'client-1',
  role: UserRole.CLIENT,
  email: 'client@epde.ar',
  jti: 'jti-client-1',
};

const adminUser: CurrentUserPayload = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  email: 'admin@epde.ar',
  jti: 'jti-admin-1',
};

const notificationId = 'notif-uuid-1';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: PushService, useValue: mockPushService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should delegate to notificationsService.getNotifications with user.id, cursor and take', async () => {
      const query = { cursor: undefined, take: 10 };
      const paginatedResult = { data: [], nextCursor: null };
      mockNotificationsService.getNotifications.mockResolvedValue(paginatedResult);

      const result = await controller.getNotifications(clientUser, query as any);

      expect(mockNotificationsService.getNotifications).toHaveBeenCalledWith(
        'client-1',
        undefined,
        10,
      );
      expect(result).toEqual(paginatedResult);
    });

    it('should pass user.id (not the full user object) to the service', async () => {
      const query = { cursor: 'cursor-abc', take: 20 };
      mockNotificationsService.getNotifications.mockResolvedValue({ data: [], nextCursor: null });

      await controller.getNotifications(adminUser, query as any);

      const [passedUserId] = mockNotificationsService.getNotifications.mock.calls[0];
      expect(passedUserId).toBe('admin-1');
    });
  });

  describe('getUnreadCount', () => {
    it('should delegate to notificationsService.getUnreadCount and return wrapped count', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnreadCount(clientUser);

      expect(mockNotificationsService.getUnreadCount).toHaveBeenCalledWith('client-1');
      expect(result).toEqual({ data: { count: 5 } });
    });

    it('should return zero count when no unread notifications', async () => {
      mockNotificationsService.getUnreadCount.mockResolvedValue(0);

      const result = await controller.getUnreadCount(adminUser);

      expect(result).toEqual({ data: { count: 0 } });
    });
  });

  describe('markAllAsRead', () => {
    it('should delegate to notificationsService.markAllAsRead and return count with message', async () => {
      mockNotificationsService.markAllAsRead.mockResolvedValue(3);

      const result = await controller.markAllAsRead(clientUser);

      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith('client-1');
      expect(result).toEqual({
        data: { count: 3 },
        message: 'Notificaciones marcadas como leídas',
      });
    });
  });

  describe('markAsRead', () => {
    it('should delegate to notificationsService.markAsRead with id and user.id and return wrapped data with message', async () => {
      const notification = { id: notificationId, read: true };
      mockNotificationsService.markAsRead.mockResolvedValue(notification);

      const result = await controller.markAsRead(notificationId, clientUser);

      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(notificationId, 'client-1');
      expect(result).toEqual({ data: notification, message: 'Notificación marcada como leída' });
    });

    it('should propagate service errors when notification not found', async () => {
      mockNotificationsService.markAsRead.mockRejectedValue(new Error('Not found'));

      await expect(controller.markAsRead(notificationId, clientUser)).rejects.toThrow('Not found');
    });
  });
});
