import { Test, TestingModule } from '@nestjs/testing';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { EmailQueueService } from '../email/email-queue.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationsService } from './notifications.service';
import { NotificationsHandlerService } from './notifications-handler.service';

const mockNotificationQueue = {
  enqueue: jest.fn().mockResolvedValue(undefined),
  enqueueBatch: jest.fn().mockResolvedValue(undefined),
};

const mockUserLookup = {
  findAdminIds: jest.fn().mockResolvedValue(['admin-1', 'admin-2']),
  findEmailInfo: jest.fn().mockResolvedValue({ email: 'requester@test.com', name: 'Juan' }),
};

const mockEmailQueue = {
  enqueueBudgetQuoted: jest.fn().mockResolvedValue(undefined),
  enqueueBudgetStatus: jest.fn().mockResolvedValue(undefined),
  enqueueTaskReminder: jest.fn().mockResolvedValue(undefined),
};

const mockNotificationsService = {
  createNotifications: jest.fn().mockResolvedValue(0),
};

describe('NotificationsHandlerService', () => {
  let service: NotificationsHandlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsHandlerService,
        { provide: NotificationQueueService, useValue: mockNotificationQueue },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: UserLookupRepository, useValue: mockUserLookup },
        { provide: EmailQueueService, useValue: mockEmailQueue },
      ],
    }).compile();

    service = module.get<NotificationsHandlerService>(NotificationsHandlerService);
    jest.clearAllMocks();
    mockUserLookup.findAdminIds.mockResolvedValue(['admin-1', 'admin-2']);
    mockUserLookup.findEmailInfo.mockResolvedValue({ email: 'requester@test.com', name: 'Juan' });
  });

  describe('handleBudgetCreated', () => {
    it('should enqueue batch notifications for all admins', async () => {
      await service.handleBudgetCreated({
        budgetId: 'budget-1',
        title: 'Pintura',
        requesterId: 'user-1',
      });

      expect(mockNotificationQueue.enqueueBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'admin-1', type: 'BUDGET_UPDATE' }),
          expect.objectContaining({ userId: 'admin-2', type: 'BUDGET_UPDATE' }),
        ]),
      );
    });

    it('should not propagate errors (try-catch)', async () => {
      mockUserLookup.findAdminIds.mockRejectedValue(new Error('DB error'));

      await expect(
        service.handleBudgetCreated({
          budgetId: 'budget-1',
          title: 'Pintura',
          requesterId: 'user-1',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('handleBudgetQuoted', () => {
    it('should notify requester in-app and send email', async () => {
      await service.handleBudgetQuoted({
        budgetId: 'budget-1',
        title: 'Pintura',
        requesterId: 'user-1',
        totalAmount: 150000,
      });

      expect(mockNotificationQueue.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', type: 'BUDGET_UPDATE' }),
      );
      expect(mockEmailQueue.enqueueBudgetQuoted).toHaveBeenCalledWith(
        'requester@test.com',
        'Juan',
        'Pintura',
        150000,
        'budget-1',
      );
    });
  });

  describe('handleBudgetStatusChanged', () => {
    it('should notify admins when status is APPROVED', async () => {
      await service.handleBudgetStatusChanged({
        budgetId: 'budget-1',
        title: 'Pintura',
        oldStatus: 'PENDING',
        newStatus: 'APPROVED',
        requesterId: 'user-1',
      });

      expect(mockNotificationQueue.enqueueBatch).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ userId: 'admin-1' })]),
      );
    });

    it('should notify requester and send email when status is IN_PROGRESS', async () => {
      await service.handleBudgetStatusChanged({
        budgetId: 'budget-1',
        title: 'Pintura',
        oldStatus: 'APPROVED',
        newStatus: 'IN_PROGRESS',
        requesterId: 'user-1',
      });

      expect(mockNotificationQueue.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
      expect(mockEmailQueue.enqueueBudgetStatus).toHaveBeenCalled();
    });
  });

  describe('handleServiceCreated', () => {
    it('should enqueue batch notifications for all admins', async () => {
      await service.handleServiceCreated({
        serviceRequestId: 'sr-1',
        title: 'Goteras',
        requesterId: 'user-1',
        urgency: 'HIGH',
      });

      expect(mockNotificationQueue.enqueueBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'admin-1', type: 'SERVICE_UPDATE' }),
        ]),
      );
    });
  });

  describe('handleServiceStatusChanged', () => {
    it('should notify the requester in-app', async () => {
      await service.handleServiceStatusChanged({
        serviceRequestId: 'sr-1',
        title: 'Goteras',
        oldStatus: 'OPEN',
        newStatus: 'IN_REVIEW',
        requesterId: 'user-1',
      });

      expect(mockNotificationQueue.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', type: 'SERVICE_UPDATE' }),
      );
    });
  });
});
