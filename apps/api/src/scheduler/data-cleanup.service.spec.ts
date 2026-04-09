import { Test, TestingModule } from '@nestjs/testing';

import { MetricsService } from '../metrics/metrics.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { DataCleanupRepository } from './data-cleanup.repository';
import { DataCleanupService } from './data-cleanup.service';

const mockDataCleanupRepository = {
  hardDeleteSoftDeletedBefore: jest.fn().mockResolvedValue({ users: 0, properties: 0, tasks: 0 }),
  deleteOldSnapshots: jest.fn().mockResolvedValue(0),
};

const mockLockService = {
  withLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => {
    await fn({ lockLost: false });
  }),
};

const mockMetricsService = {
  recordCronExecution: jest.fn(),
};

describe('DataCleanupService', () => {
  let service: DataCleanupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataCleanupService,
        { provide: DataCleanupRepository, useValue: mockDataCleanupRepository },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get(DataCleanupService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use distributed lock', async () => {
    await service.runCleanup();

    expect(mockLockService.withLock).toHaveBeenCalledWith(
      'cron:data-cleanup',
      600,
      expect.any(Function),
    );
  });

  it('should hard-delete soft-deleted records older than 90 days', async () => {
    await service.runCleanup();

    expect(mockDataCleanupRepository.hardDeleteSoftDeletedBefore).toHaveBeenCalledWith(
      expect.any(Date),
    );
  });

  it('should trim ISV snapshots older than 24 months', async () => {
    await service.runCleanup();

    expect(mockDataCleanupRepository.deleteOldSnapshots).toHaveBeenCalledWith(expect.any(Date));
  });

  it('should record metrics after completion', async () => {
    await service.runCleanup();

    expect(mockMetricsService.recordCronExecution).toHaveBeenCalledWith(
      'data-cleanup',
      expect.any(Number),
    );
  });
});
