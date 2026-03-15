import { Test, TestingModule } from '@nestjs/testing';

import { BudgetAuditLogRepository } from '../budgets/budget-audit-log.repository';
import { BudgetsRepository } from '../budgets/budgets.repository';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { BudgetExpirationService } from './budget-expiration.service';

const mockBudgetsRepository = {
  findExpiredQuotedBudgets: jest.fn().mockResolvedValue([]),
  expireBudgets: jest.fn().mockResolvedValue(0),
};

const mockAuditLogRepository = {
  createAuditLog: jest.fn().mockResolvedValue(undefined),
};

const mockLockService = {
  withLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => {
    await fn({ lockLost: false });
  }),
};

const mockMetricsService = {
  recordCronExecution: jest.fn(),
};

const mockNotificationsHandler = {
  handleBudgetStatusChanged: jest.fn().mockResolvedValue(undefined),
};

describe('BudgetExpirationService', () => {
  let service: BudgetExpirationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetExpirationService,
        { provide: BudgetsRepository, useValue: mockBudgetsRepository },
        { provide: BudgetAuditLogRepository, useValue: mockAuditLogRepository },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: NotificationsHandlerService, useValue: mockNotificationsHandler },
      ],
    }).compile();

    service = module.get<BudgetExpirationService>(BudgetExpirationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkBudgetExpiry', () => {
    it('should acquire lock and expire budgets', async () => {
      const expiredBudgets = [
        { id: 'b1', title: 'Budget 1', requestedBy: 'u1' },
        { id: 'b2', title: 'Budget 2', requestedBy: 'u2' },
      ];
      mockBudgetsRepository.findExpiredQuotedBudgets.mockResolvedValue(expiredBudgets);
      mockBudgetsRepository.expireBudgets.mockResolvedValue(2);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.checkBudgetExpiry();

      expect(mockLockService.withLock).toHaveBeenCalledWith(
        'cron:budget-expiration-check',
        300,
        expect.any(Function),
      );
      expect(mockBudgetsRepository.findExpiredQuotedBudgets).toHaveBeenCalled();
      expect(mockBudgetsRepository.expireBudgets).toHaveBeenCalledWith(['b1', 'b2']);
      expect(mockAuditLogRepository.createAuditLog).toHaveBeenCalledTimes(2);
      expect(mockNotificationsHandler.handleBudgetStatusChanged).toHaveBeenCalledTimes(2);
    });

    it('should skip processing if lock is lost after finding expired budgets', async () => {
      mockBudgetsRepository.findExpiredQuotedBudgets.mockResolvedValue([
        { id: 'b1', requestedBy: 'u1', title: 'Test' },
      ]);
      mockLockService.withLock.mockImplementationOnce(async (_key, _ttl, fn) => {
        const signal = { lockLost: false };
        // Simulate lock loss after fetch but before expire
        mockBudgetsRepository.findExpiredQuotedBudgets.mockImplementation(async () => {
          signal.lockLost = true;
          return [{ id: 'b1', requestedBy: 'u1', title: 'Test' }];
        });
        await fn(signal);
      });

      await service.checkBudgetExpiry();
      expect(mockBudgetsRepository.findExpiredQuotedBudgets).toHaveBeenCalled();
      expect(mockBudgetsRepository.expireBudgets).not.toHaveBeenCalled();
    });

    it('should do nothing when no expired budgets are found', async () => {
      mockBudgetsRepository.findExpiredQuotedBudgets.mockResolvedValue([]);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.checkBudgetExpiry();

      expect(mockBudgetsRepository.findExpiredQuotedBudgets).toHaveBeenCalled();
      expect(mockBudgetsRepository.expireBudgets).not.toHaveBeenCalled();
      expect(mockAuditLogRepository.createAuditLog).not.toHaveBeenCalled();
    });

    it('should record cron execution metrics', async () => {
      mockBudgetsRepository.findExpiredQuotedBudgets.mockResolvedValue([]);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.checkBudgetExpiry();

      expect(mockMetricsService.recordCronExecution).toHaveBeenCalledWith(
        'budget-expiration-check',
        expect.any(Number),
      );
    });

    it('should log audit entries and send notifications for each expired budget', async () => {
      const expiredBudgets = [{ id: 'b1', title: 'Reparación techo', requestedBy: 'u1' }];
      mockBudgetsRepository.findExpiredQuotedBudgets.mockResolvedValue(expiredBudgets);
      mockBudgetsRepository.expireBudgets.mockResolvedValue(1);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.checkBudgetExpiry();

      expect(mockAuditLogRepository.createAuditLog).toHaveBeenCalledWith(
        'b1',
        'u1',
        'expired',
        { status: 'QUOTED' },
        { status: 'EXPIRED' },
      );
      expect(mockNotificationsHandler.handleBudgetStatusChanged).toHaveBeenCalledWith({
        budgetId: 'b1',
        title: 'Reparación techo',
        oldStatus: 'QUOTED',
        newStatus: 'EXPIRED',
        requesterId: 'u1',
      });
    });
  });
});
