import { Test, TestingModule } from '@nestjs/testing';

import { MetricsService } from '../metrics/metrics.service';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { ServiceRequestAuditLogRepository } from '../service-requests/service-request-audit-log.repository';
import { ServiceRequestsRepository } from '../service-requests/service-requests.repository';
import { ServiceRequestAutoCloseService } from './service-request-auto-close.service';

const mockServiceRequestsRepository = {
  findStaleResolvedRequests: jest.fn().mockResolvedValue([]),
  closeRequests: jest.fn().mockResolvedValue({ count: 0 }),
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
  handleServiceStatusChanged: jest.fn().mockResolvedValue(undefined),
};

describe('ServiceRequestAutoCloseService', () => {
  let service: ServiceRequestAutoCloseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRequestAutoCloseService,
        { provide: ServiceRequestsRepository, useValue: mockServiceRequestsRepository },
        { provide: ServiceRequestAuditLogRepository, useValue: mockAuditLogRepository },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: NotificationsHandlerService, useValue: mockNotificationsHandler },
      ],
    }).compile();

    service = module.get<ServiceRequestAutoCloseService>(ServiceRequestAutoCloseService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAutoClose', () => {
    it('should acquire lock and close stale resolved requests', async () => {
      const staleRequests = [
        { id: 'sr1', title: 'Request 1', requestedBy: 'u1' },
        { id: 'sr2', title: 'Request 2', requestedBy: 'u2' },
      ];
      mockServiceRequestsRepository.findStaleResolvedRequests.mockResolvedValue(staleRequests);
      mockServiceRequestsRepository.closeRequests.mockResolvedValue({ count: 2 });
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.checkAutoClose();

      expect(mockLockService.withLock).toHaveBeenCalledWith(
        'cron:service-request-auto-close',
        300,
        expect.any(Function),
      );
      expect(mockServiceRequestsRepository.findStaleResolvedRequests).toHaveBeenCalledWith(
        expect.any(Date),
      );
      expect(mockServiceRequestsRepository.closeRequests).toHaveBeenCalledWith(['sr1', 'sr2']);
      expect(mockAuditLogRepository.createAuditLog).toHaveBeenCalledTimes(2);
      expect(mockNotificationsHandler.handleServiceStatusChanged).toHaveBeenCalledTimes(2);
    });

    it('should skip processing if lock is lost after finding stale requests', async () => {
      mockServiceRequestsRepository.findStaleResolvedRequests.mockResolvedValue([
        { id: 'sr-1', title: 'Test', requestedBy: 'u-1' },
      ]);
      mockLockService.withLock.mockImplementationOnce(async (_key, _ttl, fn) => {
        const signal = { lockLost: false };
        mockServiceRequestsRepository.findStaleResolvedRequests.mockImplementation(async () => {
          signal.lockLost = true;
          return [{ id: 'sr-1', title: 'Test', requestedBy: 'u-1' }];
        });
        await fn(signal);
      });

      await service.checkAutoClose();
      expect(mockServiceRequestsRepository.findStaleResolvedRequests).toHaveBeenCalled();
      expect(mockServiceRequestsRepository.closeRequests).not.toHaveBeenCalled();
    });

    it('should do nothing when no stale requests are found', async () => {
      mockServiceRequestsRepository.findStaleResolvedRequests.mockResolvedValue([]);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.checkAutoClose();

      expect(mockServiceRequestsRepository.findStaleResolvedRequests).toHaveBeenCalled();
      expect(mockServiceRequestsRepository.closeRequests).not.toHaveBeenCalled();
      expect(mockAuditLogRepository.createAuditLog).not.toHaveBeenCalled();
    });

    it('should record cron execution metrics', async () => {
      mockServiceRequestsRepository.findStaleResolvedRequests.mockResolvedValue([]);
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.checkAutoClose();

      expect(mockMetricsService.recordCronExecution).toHaveBeenCalledWith(
        'service-request-auto-close',
        expect.any(Number),
      );
    });

    it('should log audit entries and send notifications for each closed request', async () => {
      const staleRequests = [{ id: 'sr1', title: 'Humedad en pared', requestedBy: 'u1' }];
      mockServiceRequestsRepository.findStaleResolvedRequests.mockResolvedValue(staleRequests);
      mockServiceRequestsRepository.closeRequests.mockResolvedValue({ count: 1 });
      mockLockService.withLock.mockImplementation(async (_key, _ttl, fn) => {
        await fn({ lockLost: false });
      });

      await service.checkAutoClose();

      expect(mockAuditLogRepository.createAuditLog).toHaveBeenCalledWith(
        'sr1',
        'u1',
        'closed',
        { status: 'RESOLVED' },
        { status: 'CLOSED', reason: 'auto-close after 7 days' },
      );
      expect(mockNotificationsHandler.handleServiceStatusChanged).toHaveBeenCalledWith({
        serviceRequestId: 'sr1',
        title: 'Humedad en pared',
        oldStatus: 'RESOLVED',
        newStatus: 'CLOSED',
        requesterId: 'u1',
      });
    });
  });
});
