import { ActivityType, ConditionFound, TaskStatus } from '@epde/shared';
import { Test, TestingModule } from '@nestjs/testing';

import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';

const mockDashboardRepository = {
  getAdminStats: jest.fn(),
  getRecentActivity: jest.fn(),
  getClientPropertyAndPlanIds: jest.fn(),
  getClientTaskStats: jest.fn(),
  getClientBudgetAndServiceCounts: jest.fn(),
  getClientUpcomingTasks: jest.fn(),
  // Analytics methods
  getCompletionTrend: jest.fn(),
  getConditionDistribution: jest.fn(),
  getProblematicCategories: jest.fn(),
  getBudgetPipeline: jest.fn(),
  getCategoryCosts: jest.fn(),
  getAvgBudgetResponseDays: jest.fn(),
  getTotalMaintenanceCost: jest.fn(),
  getCompletionRate: jest.fn(),
  getClientConditionTrend: jest.fn(),
  getClientCostHistory: jest.fn(),
  getClientHealthScore: jest.fn(),
  getClientConditionDistribution: jest.fn(),
  getClientCategoryBreakdown: jest.fn(),
};

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: typeof mockDashboardRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DashboardRepository, useValue: mockDashboardRepository },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    repository = module.get(DashboardRepository);

    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should delegate to dashboardRepository.getAdminStats', async () => {
      const stats = {
        totalClients: 10,
        totalProperties: 25,
        overdueTasks: 3,
        pendingBudgets: 5,
        pendingServices: 2,
      };
      repository.getAdminStats.mockResolvedValue(stats);

      const result = await service.getStats();

      expect(repository.getAdminStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(stats);
    });
  });

  describe('getRecentActivity', () => {
    it('should merge, sort by timestamp descending, and limit to 10 activities', async () => {
      const now = new Date();
      const makeDate = (offset: number) => new Date(now.getTime() - offset * 1000);

      repository.getRecentActivity.mockResolvedValue({
        recentClients: [
          { id: 'c1', name: 'Cliente A', createdAt: makeDate(1) },
          { id: 'c2', name: 'Cliente B', createdAt: makeDate(10) },
        ],
        recentProperties: [
          { id: 'p1', address: 'Calle 1', city: 'Buenos Aires', createdAt: makeDate(2) },
          { id: 'p2', address: 'Calle 2', city: 'Córdoba', createdAt: makeDate(8) },
        ],
        recentTasks: [
          { id: 't1', name: 'Tarea 1', updatedAt: makeDate(3) },
          { id: 't2', name: 'Tarea 2', updatedAt: makeDate(7) },
        ],
        recentBudgets: [
          { id: 'b1', title: 'Presupuesto 1', createdAt: makeDate(4) },
          { id: 'b2', title: 'Presupuesto 2', createdAt: makeDate(9) },
        ],
        recentServices: [
          { id: 's1', title: 'Servicio 1', createdAt: makeDate(5) },
          { id: 's2', title: 'Servicio 2', createdAt: makeDate(6) },
        ],
      });

      const result = await service.getRecentActivity();

      expect(result).toHaveLength(10);

      // Verify sorted descending by timestamp
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i]!.timestamp.getTime()).toBeGreaterThanOrEqual(
          result[i + 1]!.timestamp.getTime(),
        );
      }

      // The first item should be the most recent (offset=1)
      expect(result[0]!.id).toBe('c1');
      expect(result[0]!.type).toBe(ActivityType.CLIENT_CREATED);
      expect(result[0]!.description).toBe('Nuevo cliente: Cliente A');

      // Check specific description formats
      const propertyActivity = result.find((a) => a.id === 'p1');
      expect(propertyActivity?.description).toBe('Nueva propiedad: Calle 1, Buenos Aires');

      const taskActivity = result.find((a) => a.id === 't1');
      expect(taskActivity?.description).toBe('Tarea completada: Tarea 1');

      const budgetActivity = result.find((a) => a.id === 'b1');
      expect(budgetActivity?.description).toBe('Presupuesto solicitado: Presupuesto 1');

      const serviceActivity = result.find((a) => a.id === 's1');
      expect(serviceActivity?.description).toBe('Solicitud de servicio: Servicio 1');
    });

    it('should truncate to 10 when more than 10 activities exist', async () => {
      const now = new Date();
      const makeClients = (count: number) =>
        Array.from({ length: count }, (_, i) => ({
          id: `c${i}`,
          name: `Cliente ${i}`,
          createdAt: new Date(now.getTime() - i * 1000),
        }));

      repository.getRecentActivity.mockResolvedValue({
        recentClients: makeClients(5),
        recentProperties: Array.from({ length: 5 }, (_, i) => ({
          id: `p${i}`,
          address: `Calle ${i}`,
          city: `Ciudad ${i}`,
          createdAt: new Date(now.getTime() - (i + 5) * 1000),
        })),
        recentTasks: [
          { id: 't1', name: 'Tarea extra', updatedAt: new Date(now.getTime() - 20000) },
        ],
        recentBudgets: [],
        recentServices: [],
      });

      const result = await service.getRecentActivity();

      expect(result).toHaveLength(10);
    });

    it('should return empty array when all activity lists are empty', async () => {
      repository.getRecentActivity.mockResolvedValue({
        recentClients: [],
        recentProperties: [],
        recentTasks: [],
        recentBudgets: [],
        recentServices: [],
      });

      const result = await service.getRecentActivity();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getClientStats', () => {
    it('should aggregate property, task, and budget/service stats correctly', async () => {
      const userId = 'user-1';
      const propertyIds = ['prop-1', 'prop-2'];
      const planIds = ['plan-1', 'plan-2'];
      const taskStats = {
        pendingTasks: 3,
        overdueTasks: 1,
        upcomingTasks: 2,
        completedThisMonth: 5,
      };
      const budgetServiceStats = { pendingBudgets: 2, openServices: 1 };

      repository.getClientPropertyAndPlanIds.mockResolvedValue({ propertyIds, planIds });
      repository.getClientTaskStats.mockResolvedValue(taskStats);
      repository.getClientBudgetAndServiceCounts.mockResolvedValue(budgetServiceStats);

      const result = await service.getClientStats(userId);

      expect(repository.getClientPropertyAndPlanIds).toHaveBeenCalledWith(userId);
      expect(repository.getClientTaskStats).toHaveBeenCalledWith(planIds, userId);
      expect(repository.getClientBudgetAndServiceCounts).toHaveBeenCalledWith(propertyIds);

      expect(result).toEqual({
        totalProperties: 2,
        pendingTasks: 3,
        overdueTasks: 1,
        upcomingTasks: 2,
        completedThisMonth: 5,
        pendingBudgets: 2,
        openServices: 1,
      });
    });

    it('should return totalProperties 0 when client has no properties', async () => {
      repository.getClientPropertyAndPlanIds.mockResolvedValue({ propertyIds: [], planIds: [] });
      repository.getClientTaskStats.mockResolvedValue({
        pendingTasks: 0,
        overdueTasks: 0,
        upcomingTasks: 0,
        completedThisMonth: 0,
      });
      repository.getClientBudgetAndServiceCounts.mockResolvedValue({
        pendingBudgets: 0,
        openServices: 0,
      });

      const result = await service.getClientStats('user-empty');

      expect(result.totalProperties).toBe(0);
    });
  });

  describe('getClientUpcomingTasks', () => {
    it('should map task fields to the expected output format', async () => {
      const userId = 'user-1';
      const dueDate = new Date('2025-06-15T10:00:00.000Z');

      repository.getClientUpcomingTasks.mockResolvedValue([
        {
          id: 'task-1',
          name: 'Revisar techos',
          nextDueDate: dueDate,
          priority: 'HIGH',
          status: TaskStatus.PENDING,
          maintenancePlan: {
            id: 'plan-1',
            property: { address: 'Av. Corrientes 1234' },
          },
          category: { name: 'Techos' },
        },
        {
          id: 'task-2',
          name: 'Limpiar canaletas',
          nextDueDate: new Date('2025-07-01T10:00:00.000Z'),
          priority: 'MEDIUM',
          status: TaskStatus.UPCOMING,
          maintenancePlan: {
            id: 'plan-2',
            property: { address: 'Calle San Martín 567' },
          },
          category: { name: 'Plomería' },
        },
      ]);

      const result = await service.getClientUpcomingTasks(userId);

      expect(repository.getClientUpcomingTasks).toHaveBeenCalledWith(userId);
      expect(result).toHaveLength(2);

      expect(result[0]!).toEqual({
        id: 'task-1',
        name: 'Revisar techos',
        nextDueDate: '2025-06-15T10:00:00.000Z',
        priority: 'HIGH',
        status: TaskStatus.PENDING,
        propertyAddress: 'Av. Corrientes 1234',
        categoryName: 'Techos',
        maintenancePlanId: 'plan-1',
      });

      expect(result[1]!).toEqual({
        id: 'task-2',
        name: 'Limpiar canaletas',
        nextDueDate: '2025-07-01T10:00:00.000Z',
        priority: 'MEDIUM',
        status: TaskStatus.UPCOMING,
        propertyAddress: 'Calle San Martín 567',
        categoryName: 'Plomería',
        maintenancePlanId: 'plan-2',
      });
    });

    it('should return empty array when no upcoming tasks', async () => {
      repository.getClientUpcomingTasks.mockResolvedValue([]);

      const result = await service.getClientUpcomingTasks('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAdminAnalytics', () => {
    it('should return all analytics fields from parallel queries', async () => {
      const mockTrend = [{ month: '2026-01', label: 'Ene', value: 5 }];
      const mockCondition = [{ condition: ConditionFound.GOOD, count: 3, label: 'Bueno' }];
      const mockCategories = [
        { categoryName: 'Electricidad', issueCount: 2, totalInspections: 10 },
      ];
      const mockPipeline = [{ status: 'PENDING', count: 4, label: 'Pendiente', totalAmount: 1000 }];
      const mockCosts = [{ month: '2026-01', label: 'Ene', categories: { Electricidad: 500 } }];

      repository.getCompletionTrend.mockResolvedValue(mockTrend);
      repository.getConditionDistribution.mockResolvedValue(mockCondition);
      repository.getProblematicCategories.mockResolvedValue(mockCategories);
      repository.getBudgetPipeline.mockResolvedValue(mockPipeline);
      repository.getCategoryCosts.mockResolvedValue(mockCosts);
      repository.getAvgBudgetResponseDays.mockResolvedValue(3.5);
      repository.getTotalMaintenanceCost.mockResolvedValue(15000);
      repository.getCompletionRate.mockResolvedValue(72);

      const result = await service.getAdminAnalytics();

      expect(result.completionTrend).toEqual(mockTrend);
      expect(result.conditionDistribution).toEqual(mockCondition);
      expect(result.problematicCategories).toEqual(mockCategories);
      expect(result.budgetPipeline).toEqual(mockPipeline);
      expect(result.categoryCosts).toEqual(mockCosts);
      expect(result.avgBudgetResponseDays).toBe(3.5);
      expect(result.totalMaintenanceCost).toBe(15000);
      expect(result.completionRate).toBe(72);
      expect(repository.getCompletionTrend).toHaveBeenCalledWith(6);
      expect(repository.getCategoryCosts).toHaveBeenCalledWith(6);
    });
  });

  describe('getClientAnalytics', () => {
    it('should resolve planIds then query analytics in parallel', async () => {
      const planIds = ['plan-1', 'plan-2'];
      repository.getClientPropertyAndPlanIds.mockResolvedValue({
        propertyIds: ['prop-1'],
        planIds,
      });

      const mockTrend = [{ month: '2026-01', label: 'Ene', categories: { Electricidad: 4.2 } }];
      const mockCost = [{ month: '2026-01', label: 'Ene', value: 300 }];
      const mockHealth = { healthScore: 75, healthLabel: 'Bueno' };
      const mockCondDist = [{ condition: ConditionFound.EXCELLENT, count: 5, label: 'Excelente' }];
      const mockBreakdown = [
        {
          categoryName: 'Plomería',
          totalTasks: 4,
          completedTasks: 3,
          overdueTasks: 0,
          avgCondition: 4.5,
        },
      ];

      repository.getClientConditionTrend.mockResolvedValue(mockTrend);
      repository.getClientCostHistory.mockResolvedValue(mockCost);
      repository.getClientHealthScore.mockResolvedValue(mockHealth);
      repository.getClientConditionDistribution.mockResolvedValue(mockCondDist);
      repository.getClientCategoryBreakdown.mockResolvedValue(mockBreakdown);

      const result = await service.getClientAnalytics('user-1');

      expect(repository.getClientPropertyAndPlanIds).toHaveBeenCalledWith('user-1');
      expect(repository.getClientConditionTrend).toHaveBeenCalledWith(planIds, 6);
      expect(repository.getClientCostHistory).toHaveBeenCalledWith(planIds, 12);
      expect(result.conditionTrend).toEqual(mockTrend);
      expect(result.costHistory).toEqual(mockCost);
      expect(result.healthScore).toBe(75);
      expect(result.healthLabel).toBe('Bueno');
      expect(result.conditionDistribution).toEqual(mockCondDist);
      expect(result.categoryBreakdown).toEqual(mockBreakdown);
    });

    it('should handle user with no properties', async () => {
      repository.getClientPropertyAndPlanIds.mockResolvedValue({
        propertyIds: [],
        planIds: [],
      });
      repository.getClientConditionTrend.mockResolvedValue([]);
      repository.getClientCostHistory.mockResolvedValue([]);
      repository.getClientHealthScore.mockResolvedValue({
        healthScore: 0,
        healthLabel: 'Sin datos',
      });
      repository.getClientConditionDistribution.mockResolvedValue([]);
      repository.getClientCategoryBreakdown.mockResolvedValue([]);

      const result = await service.getClientAnalytics('user-no-props');

      expect(result.healthScore).toBe(0);
      expect(result.categoryBreakdown).toEqual([]);
    });
  });
});
