import { Test, TestingModule } from '@nestjs/testing';

import { DashboardStatsRepository } from '../dashboard/dashboard-stats.repository';
import { HealthIndexRepository } from '../dashboard/health-index.repository';
import { EmailQueueService } from '../email/email-queue.service';
import { MetricsService } from '../metrics/metrics.service';
import { PushService } from '../notifications/push.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { UsersRepository } from '../users/users.repository';
import { WeeklySummaryService } from './weekly-summary.service';

jest.mock('@sentry/node', () => ({
  withMonitor: jest.fn((_name, fn) => fn()),
  captureException: jest.fn(),
}));

const mockStatsRepository = {
  getAllClientPlanIds: jest.fn(),
  getBatchTaskStats: jest.fn(),
  getBatchUpcomingTasks: jest.fn(),
};

const mockHealthIndexRepository = {
  getPropertyHealthIndexBatch: jest.fn(),
  getMaintenanceStreak: jest.fn(),
};

const mockUsersRepository = {
  findActiveClients: jest.fn(),
};

const mockPushService = {
  sendToUsers: jest.fn().mockResolvedValue(undefined),
};

const mockEmailQueueService = {
  enqueueWeeklySummary: jest.fn().mockResolvedValue(undefined),
};

const mockLockService = {
  withLock: jest.fn().mockImplementation(async (_key, _ttl, fn) => {
    await fn({ lockLost: false });
  }),
};

const mockMetricsService = {
  recordCronExecution: jest.fn(),
};

describe('WeeklySummaryService', () => {
  let service: WeeklySummaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklySummaryService,
        { provide: DashboardStatsRepository, useValue: mockStatsRepository },
        { provide: HealthIndexRepository, useValue: mockHealthIndexRepository },
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: PushService, useValue: mockPushService },
        { provide: EmailQueueService, useValue: mockEmailQueueService },
        { provide: DistributedLockService, useValue: mockLockService },
        { provide: MetricsService, useValue: mockMetricsService },
      ],
    }).compile();

    service = module.get(WeeklySummaryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use distributed lock', async () => {
    mockUsersRepository.findActiveClients.mockResolvedValue([]);

    await service.sendWeeklySummaries();

    expect(mockLockService.withLock).toHaveBeenCalledWith(
      'cron:weekly-summary',
      600,
      expect.any(Function),
    );
  });

  it('should record cron execution time', async () => {
    mockUsersRepository.findActiveClients.mockResolvedValue([]);

    await service.sendWeeklySummaries();

    expect(mockMetricsService.recordCronExecution).toHaveBeenCalledWith(
      'weekly-summary',
      expect.any(Number),
    );
  });

  it('should skip processing if no active clients', async () => {
    mockUsersRepository.findActiveClients.mockResolvedValue([]);

    await service.sendWeeklySummaries();

    expect(mockStatsRepository.getAllClientPlanIds).not.toHaveBeenCalled();
  });

  it('should call batch methods with correct arguments', async () => {
    const clients = [
      { id: 'c1', name: 'María', email: 'maria@test.com' },
      { id: 'c2', name: 'Carlos', email: 'carlos@test.com' },
    ];
    mockUsersRepository.findActiveClients.mockResolvedValue(clients);
    mockStatsRepository.getAllClientPlanIds.mockResolvedValue(
      new Map([
        ['c1', ['plan-1']],
        ['c2', ['plan-2']],
      ]),
    );
    mockStatsRepository.getBatchTaskStats.mockResolvedValue(new Map());
    mockHealthIndexRepository.getPropertyHealthIndexBatch.mockResolvedValue(new Map());
    mockStatsRepository.getBatchUpcomingTasks.mockResolvedValue(new Map());
    mockHealthIndexRepository.getMaintenanceStreak.mockResolvedValue(0);

    await service.sendWeeklySummaries();

    expect(mockStatsRepository.getAllClientPlanIds).toHaveBeenCalledWith(['c1', 'c2']);
    expect(mockStatsRepository.getBatchTaskStats).toHaveBeenCalledWith(['plan-1', 'plan-2']);
    expect(mockHealthIndexRepository.getPropertyHealthIndexBatch).toHaveBeenCalledWith([
      'plan-1',
      'plan-2',
    ]);
    expect(mockStatsRepository.getBatchUpcomingTasks).toHaveBeenCalledWith(['c1', 'c2']);
  });

  it('should skip clients without plans', async () => {
    mockUsersRepository.findActiveClients.mockResolvedValue([
      { id: 'c1', name: 'María', email: 'maria@test.com' },
    ]);
    mockStatsRepository.getAllClientPlanIds.mockResolvedValue(new Map());
    mockStatsRepository.getBatchTaskStats.mockResolvedValue(new Map());
    mockHealthIndexRepository.getPropertyHealthIndexBatch.mockResolvedValue(new Map());
    mockStatsRepository.getBatchUpcomingTasks.mockResolvedValue(new Map());

    await service.sendWeeklySummaries();

    expect(mockPushService.sendToUsers).not.toHaveBeenCalled();
    expect(mockEmailQueueService.enqueueWeeklySummary).not.toHaveBeenCalled();
  });

  it('should send push and email for clients with plans', async () => {
    mockUsersRepository.findActiveClients.mockResolvedValue([
      { id: 'c1', name: 'María', email: 'maria@test.com' },
    ]);
    mockStatsRepository.getAllClientPlanIds.mockResolvedValue(new Map([['c1', ['plan-1']]]));
    mockStatsRepository.getBatchTaskStats.mockResolvedValue(
      new Map([
        ['plan-1', { pendingTasks: 5, overdueTasks: 0, upcomingThisWeek: 2, urgentTasks: 0 }],
      ]),
    );
    mockHealthIndexRepository.getPropertyHealthIndexBatch.mockResolvedValue(
      new Map([['plan-1', { score: 75 }]]),
    );
    mockStatsRepository.getBatchUpcomingTasks.mockResolvedValue(new Map());
    mockHealthIndexRepository.getMaintenanceStreak.mockResolvedValue(3);

    await service.sendWeeklySummaries();

    expect(mockPushService.sendToUsers).toHaveBeenCalledWith(
      ['c1'],
      expect.objectContaining({ title: 'Tu casa esta semana' }),
    );
    expect(mockEmailQueueService.enqueueWeeklySummary).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'maria@test.com',
        name: 'María',
        score: 75,
        streak: 3,
      }),
    );
  });

  it('should include streak in body when streak > 0', async () => {
    mockUsersRepository.findActiveClients.mockResolvedValue([
      { id: 'c1', name: 'Test', email: 'test@test.com' },
    ]);
    mockStatsRepository.getAllClientPlanIds.mockResolvedValue(new Map([['c1', ['p1']]]));
    mockStatsRepository.getBatchTaskStats.mockResolvedValue(new Map());
    mockHealthIndexRepository.getPropertyHealthIndexBatch.mockResolvedValue(new Map());
    mockStatsRepository.getBatchUpcomingTasks.mockResolvedValue(new Map());
    mockHealthIndexRepository.getMaintenanceStreak.mockResolvedValue(5);

    await service.sendWeeklySummaries();

    expect(mockPushService.sendToUsers).toHaveBeenCalledWith(
      ['c1'],
      expect.objectContaining({
        body: expect.stringContaining('5 meses al día'),
      }),
    );
  });

  it('should mention overdue tasks in body when present', async () => {
    mockUsersRepository.findActiveClients.mockResolvedValue([
      { id: 'c1', name: 'Test', email: 'test@test.com' },
    ]);
    mockStatsRepository.getAllClientPlanIds.mockResolvedValue(new Map([['c1', ['p1']]]));
    mockStatsRepository.getBatchTaskStats.mockResolvedValue(
      new Map([['p1', { pendingTasks: 3, overdueTasks: 2, upcomingThisWeek: 1, urgentTasks: 0 }]]),
    );
    mockHealthIndexRepository.getPropertyHealthIndexBatch.mockResolvedValue(
      new Map([['p1', { score: 50 }]]),
    );
    mockStatsRepository.getBatchUpcomingTasks.mockResolvedValue(new Map());
    mockHealthIndexRepository.getMaintenanceStreak.mockResolvedValue(0);

    await service.sendWeeklySummaries();

    expect(mockPushService.sendToUsers).toHaveBeenCalledWith(
      ['c1'],
      expect.objectContaining({
        body: expect.stringContaining('2 tareas vencidas'),
      }),
    );
  });
});
