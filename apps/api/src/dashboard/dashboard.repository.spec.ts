import { AnalyticsRepository } from './analytics.repository';
import { DashboardRepository } from './dashboard.repository';
import { DashboardStatsRepository } from './dashboard-stats.repository';
import { HealthIndexRepository } from './health-index.repository';

describe('DashboardRepository (facade)', () => {
  let repository: DashboardRepository;
  let stats: jest.Mocked<DashboardStatsRepository>;
  let healthIndex: jest.Mocked<HealthIndexRepository>;
  let analytics: jest.Mocked<AnalyticsRepository>;

  beforeEach(() => {
    stats = {
      getAdminStats: jest.fn(),
      getRecentActivity: jest.fn(),
      getClientPropertyAndPlanIds: jest.fn(),
      getClientTaskStats: jest.fn(),
      getClientBudgetAndServiceCounts: jest.fn(),
      getClientUpcomingTasks: jest.fn(),
    } as unknown as jest.Mocked<DashboardStatsRepository>;

    healthIndex = {
      getPropertyHealthIndex: jest.fn(),
      getPropertyHealthIndexBatch: jest.fn(),
      getClientSectorBreakdown: jest.fn(),
      getIsvDelta: jest.fn(),
      getMaintenanceStreak: jest.fn(),
      getAnnualSummary: jest.fn(),
      getPerfectWeek: jest.fn(),
    } as unknown as jest.Mocked<HealthIndexRepository>;

    analytics = {
      getCompletionTrend: jest.fn(),
      getConditionDistribution: jest.fn(),
      getProblematicCategories: jest.fn(),
      getBudgetPipeline: jest.fn(),
      getProblematicSectors: jest.fn(),
      getCategoryCosts: jest.fn(),
      getAvgBudgetResponseDays: jest.fn(),
      getTotalMaintenanceCost: jest.fn(),
      getCompletionRate: jest.fn(),
      getSlaMetrics: jest.fn(),
      getClientConditionTrend: jest.fn(),
      getClientCostHistory: jest.fn(),
      getClientConditionDistribution: jest.fn(),
      getClientCategoryBreakdown: jest.fn(),
    } as unknown as jest.Mocked<AnalyticsRepository>;

    repository = new DashboardRepository(stats, healthIndex, analytics);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getAdminStats', () => {
    it('should delegate to stats repository', async () => {
      const expected = {
        totalClients: 10,
        totalProperties: 15,
        overdueTasks: 3,
        pendingBudgets: 2,
        pendingServices: 1,
      };
      stats.getAdminStats.mockResolvedValue(expected);

      const result = await repository.getAdminStats();

      expect(result).toEqual(expected);
      expect(stats.getAdminStats).toHaveBeenCalled();
    });
  });

  describe('getRecentActivity', () => {
    it('should delegate to stats repository', async () => {
      const expected = {
        recentClients: [],
        recentProperties: [],
        recentTasks: [],
        recentBudgets: [],
        recentServices: [],
      };
      stats.getRecentActivity.mockResolvedValue(expected);

      const result = await repository.getRecentActivity();

      expect(result).toEqual(expected);
    });
  });

  describe('getClientPropertyAndPlanIds', () => {
    it('should delegate with userId', async () => {
      const expected = { propertyIds: ['p1', 'p2'], planIds: ['plan-1'] };
      stats.getClientPropertyAndPlanIds.mockResolvedValue(expected);

      const result = await repository.getClientPropertyAndPlanIds('user-1');

      expect(result).toEqual(expected);
      expect(stats.getClientPropertyAndPlanIds).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getClientTaskStats', () => {
    it('should delegate with planIds and userId', async () => {
      const expected = {
        pendingTasks: 5,
        overdueTasks: 2,
        upcomingTasks: 3,
        upcomingThisWeek: 1,
        urgentTasks: 0,
        completedThisMonth: 4,
      };
      stats.getClientTaskStats.mockResolvedValue(expected);

      const result = await repository.getClientTaskStats(['plan-1', 'plan-2'], 'user-1');

      expect(result).toEqual(expected);
      expect(stats.getClientTaskStats).toHaveBeenCalledWith(['plan-1', 'plan-2'], 'user-1');
    });
  });

  describe('getClientBudgetAndServiceCounts', () => {
    it('should delegate with propertyIds', async () => {
      stats.getClientBudgetAndServiceCounts.mockResolvedValue({
        pendingBudgets: 2,
        openServices: 1,
      });

      const result = await repository.getClientBudgetAndServiceCounts(['p1', 'p2']);

      expect(result).toEqual({ pendingBudgets: 2, openServices: 1 });
    });
  });

  describe('getClientUpcomingTasks', () => {
    it('should delegate with userId', async () => {
      stats.getClientUpcomingTasks.mockResolvedValue([]);

      const result = await repository.getClientUpcomingTasks('user-1');

      expect(result).toEqual([]);
      expect(stats.getClientUpcomingTasks).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getPropertyHealthIndex', () => {
    it('should delegate to healthIndex repository', async () => {
      healthIndex.getPropertyHealthIndex.mockResolvedValue({
        score: 75,
        label: 'Bueno',
        dimensions: { compliance: 80, condition: 70, coverage: 75, investment: 65, trend: 85 },
        sectorScores: [],
      });

      const result = await repository.getPropertyHealthIndex(['plan-1']);

      expect(result.score).toBe(75);
      expect(healthIndex.getPropertyHealthIndex).toHaveBeenCalledWith(['plan-1']);
    });
  });

  describe('getConditionDistribution', () => {
    it('should delegate to analytics repository', async () => {
      analytics.getConditionDistribution.mockResolvedValue([
        { condition: 'GOOD' as const, count: 5, label: 'Bueno' },
      ]);

      const result = await repository.getConditionDistribution();

      expect(result).toEqual([{ condition: 'GOOD', count: 5, label: 'Bueno' }]);
    });
  });

  describe('getTotalMaintenanceCost', () => {
    it('should delegate to analytics repository', async () => {
      analytics.getTotalMaintenanceCost.mockResolvedValue(50000);

      const result = await repository.getTotalMaintenanceCost();

      expect(result).toBe(50000);
    });
  });

  describe('getCompletionRate', () => {
    it('should delegate to analytics repository', async () => {
      analytics.getCompletionRate.mockResolvedValue(70);

      const result = await repository.getCompletionRate();

      expect(result).toBe(70);
    });
  });

  describe('getClientConditionDistribution', () => {
    it('should delegate to analytics repository', async () => {
      analytics.getClientConditionDistribution.mockResolvedValue([]);

      const result = await repository.getClientConditionDistribution([]);

      expect(result).toEqual([]);
    });
  });

  describe('getClientConditionTrend', () => {
    it('should delegate to analytics repository', async () => {
      analytics.getClientConditionTrend.mockResolvedValue([]);

      const result = await repository.getClientConditionTrend([], 6);

      expect(result).toEqual([]);
    });
  });

  describe('getClientCostHistory', () => {
    it('should delegate to analytics repository', async () => {
      analytics.getClientCostHistory.mockResolvedValue([]);

      const result = await repository.getClientCostHistory([], 6);

      expect(result).toEqual([]);
    });
  });

  describe('getClientSectorBreakdown', () => {
    it('should delegate to healthIndex repository', async () => {
      healthIndex.getClientSectorBreakdown.mockResolvedValue([]);

      const result = await repository.getClientSectorBreakdown([]);

      expect(result).toEqual([]);
    });
  });

  describe('getClientCategoryBreakdown', () => {
    it('should delegate to analytics repository', async () => {
      analytics.getClientCategoryBreakdown.mockResolvedValue([]);

      const result = await repository.getClientCategoryBreakdown([]);

      expect(result).toEqual([]);
    });
  });
});
