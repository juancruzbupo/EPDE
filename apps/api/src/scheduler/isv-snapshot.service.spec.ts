import { Test, TestingModule } from '@nestjs/testing';

import { DashboardRepository } from '../dashboard/dashboard.repository';
import { ISVSnapshotRepository } from '../dashboard/isv-snapshot.repository';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { PropertiesRepository } from '../properties/properties.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { ISVSnapshotService } from './isv-snapshot.service';

const mockPropertiesRepository = {
  findWithActivePlans: jest.fn().mockResolvedValue([]),
};
const mockDashboardRepository = {
  getPropertyHealthIndex: jest.fn(),
};
const mockISVSnapshotRepository = {
  createSnapshot: jest.fn().mockResolvedValue({}),
  findPrevious: jest.fn().mockResolvedValue(null),
};
const mockLockService = {
  withLock: jest
    .fn()
    .mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: false });
      },
    ),
};
const mockMetricsService = {
  recordCronExecution: jest.fn(),
};
const mockNotificationsHandler = {
  handleISVAlert: jest.fn().mockResolvedValue(undefined),
};

const makeProperty = (id: string, planId: string | null = 'plan-1') => ({
  id,
  address: `${id} Test St`,
  userId: `user-${id}`,
  maintenancePlan: planId ? { id: planId } : null,
});

const makeHealthIndex = (score: number) => ({
  score,
  label: score >= 70 ? 'Bueno' : 'Regular',
  dimensions: { compliance: 80, condition: 75, coverage: 70, investment: 65, trend: 60 },
  sectorScores: [{ sector: 'Electricidad', score: 80 }],
});

describe('ISVSnapshotService', () => {
  let service: ISVSnapshotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ISVSnapshotService,
        { provide: PropertiesRepository, useValue: mockPropertiesRepository },
        { provide: DashboardRepository, useValue: mockDashboardRepository },
        { provide: ISVSnapshotRepository, useValue: mockISVSnapshotRepository },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: NotificationsHandlerService, useValue: mockNotificationsHandler },
      ],
    }).compile();

    service = module.get<ISVSnapshotService>(ISVSnapshotService);
    jest.clearAllMocks();
  });

  it('should acquire lock and process properties with active plans', async () => {
    const prop = makeProperty('prop-1');
    mockPropertiesRepository.findWithActivePlans.mockResolvedValue([prop]);
    mockDashboardRepository.getPropertyHealthIndex.mockResolvedValue(makeHealthIndex(85));
    mockLockService.withLock.mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: false });
      },
    );

    await service.captureMonthlySnapshots();

    expect(mockLockService.withLock).toHaveBeenCalledWith(
      'cron:isv-monthly-snapshot',
      600,
      expect.any(Function),
    );
    expect(mockDashboardRepository.getPropertyHealthIndex).toHaveBeenCalledWith(['plan-1']);
    expect(mockISVSnapshotRepository.createSnapshot).toHaveBeenCalledTimes(1);
  });

  it('should skip properties without maintenance plan', async () => {
    const propWithPlan = makeProperty('prop-1', 'plan-1');
    const propWithout = makeProperty('prop-2', null);
    mockPropertiesRepository.findWithActivePlans.mockResolvedValue([propWithPlan, propWithout]);
    mockDashboardRepository.getPropertyHealthIndex.mockResolvedValue(makeHealthIndex(80));
    mockLockService.withLock.mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: false });
      },
    );

    await service.captureMonthlySnapshots();

    expect(mockDashboardRepository.getPropertyHealthIndex).toHaveBeenCalledTimes(1);
    expect(mockISVSnapshotRepository.createSnapshot).toHaveBeenCalledTimes(1);
  });

  it('should create snapshot with correct dimensions', async () => {
    const prop = makeProperty('prop-1');
    const index = makeHealthIndex(72);
    mockPropertiesRepository.findWithActivePlans.mockResolvedValue([prop]);
    mockDashboardRepository.getPropertyHealthIndex.mockResolvedValue(index);
    mockLockService.withLock.mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: false });
      },
    );

    await service.captureMonthlySnapshots();

    expect(mockISVSnapshotRepository.createSnapshot).toHaveBeenCalledWith(
      'prop-1',
      expect.any(Date),
      {
        score: index.score,
        label: index.label,
        compliance: index.dimensions.compliance,
        condition: index.dimensions.condition,
        coverage: index.dimensions.coverage,
        investment: index.dimensions.investment,
        trend: index.dimensions.trend,
        sectorScores: index.sectorScores,
      },
    );
  });

  it('should trigger ISV alert when score drops ≥15 points', async () => {
    const prop = makeProperty('prop-1');
    mockPropertiesRepository.findWithActivePlans.mockResolvedValue([prop]);
    mockDashboardRepository.getPropertyHealthIndex.mockResolvedValue(makeHealthIndex(60));
    mockISVSnapshotRepository.findPrevious.mockResolvedValue({ score: 80 });
    mockLockService.withLock.mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: false });
      },
    );

    await service.captureMonthlySnapshots();

    expect(mockNotificationsHandler.handleISVAlert).toHaveBeenCalledWith({
      propertyId: 'prop-1',
      userId: 'user-prop-1',
      address: 'prop-1 Test St',
      previousScore: 80,
      currentScore: 60,
    });
  });

  it('should NOT trigger alert when drop < 15 points', async () => {
    const prop = makeProperty('prop-1');
    mockPropertiesRepository.findWithActivePlans.mockResolvedValue([prop]);
    mockDashboardRepository.getPropertyHealthIndex.mockResolvedValue(makeHealthIndex(70));
    mockISVSnapshotRepository.findPrevious.mockResolvedValue({ score: 80 });
    mockLockService.withLock.mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: false });
      },
    );

    await service.captureMonthlySnapshots();

    expect(mockNotificationsHandler.handleISVAlert).not.toHaveBeenCalled();
  });

  it('should abort when signal.lockLost is true', async () => {
    const prop = makeProperty('prop-1');
    mockPropertiesRepository.findWithActivePlans.mockResolvedValue([prop]);
    mockLockService.withLock.mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: true });
      },
    );

    await service.captureMonthlySnapshots();

    expect(mockDashboardRepository.getPropertyHealthIndex).not.toHaveBeenCalled();
    expect(mockISVSnapshotRepository.createSnapshot).not.toHaveBeenCalled();
  });

  it('should record cron execution metrics', async () => {
    mockPropertiesRepository.findWithActivePlans.mockResolvedValue([]);
    mockLockService.withLock.mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: false });
      },
    );

    await service.captureMonthlySnapshots();

    expect(mockMetricsService.recordCronExecution).toHaveBeenCalledWith(
      'isv-monthly-snapshot',
      expect.any(Number),
    );
  });

  it('should handle empty properties list gracefully', async () => {
    mockPropertiesRepository.findWithActivePlans.mockResolvedValue([]);
    mockLockService.withLock.mockImplementation(
      async (_key: string, _ttl: number, fn: (signal: { lockLost: boolean }) => Promise<void>) => {
        await fn({ lockLost: false });
      },
    );

    await service.captureMonthlySnapshots();

    expect(mockDashboardRepository.getPropertyHealthIndex).not.toHaveBeenCalled();
    expect(mockISVSnapshotRepository.createSnapshot).not.toHaveBeenCalled();
    expect(mockNotificationsHandler.handleISVAlert).not.toHaveBeenCalled();
    expect(mockMetricsService.recordCronExecution).toHaveBeenCalled();
  });
});
