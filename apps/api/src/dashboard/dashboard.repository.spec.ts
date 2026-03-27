import { BudgetStatus, ServiceStatus, TaskStatus, UserRole } from '@epde/shared';

import { PrismaService } from '../prisma/prisma.service';
import { DashboardRepository } from './dashboard.repository';

describe('DashboardRepository', () => {
  let repository: DashboardRepository;

  const mockUserModel = { count: jest.fn(), findMany: jest.fn() };
  const mockPropertyModel = { count: jest.fn(), findMany: jest.fn() };
  const mockTaskModel = { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() };
  const mockBudgetModel = { count: jest.fn(), findMany: jest.fn() };
  const mockServiceModel = { count: jest.fn(), findMany: jest.fn() };
  const mockTaskLogModel = {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  };

  beforeEach(() => {
    const prisma = {
      softDelete: {
        user: mockUserModel,
        property: mockPropertyModel,
        task: mockTaskModel,
        budgetRequest: mockBudgetModel,
        serviceRequest: mockServiceModel,
      },
      taskLog: mockTaskLogModel,
    } as unknown as PrismaService;

    repository = new DashboardRepository(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getAdminStats', () => {
    it('should return all 5 stat counts', async () => {
      mockUserModel.count.mockResolvedValue(10);
      mockPropertyModel.count.mockResolvedValue(15);
      mockTaskModel.count.mockResolvedValue(3);
      mockBudgetModel.count.mockResolvedValue(2);
      mockServiceModel.count.mockResolvedValue(1);

      const result = await repository.getAdminStats();

      expect(result).toEqual({
        totalClients: 10,
        totalProperties: 15,
        overdueTasks: 3,
        pendingBudgets: 2,
        pendingServices: 1,
      });
    });

    it('should count clients with CLIENT role', async () => {
      mockUserModel.count.mockResolvedValue(0);
      mockPropertyModel.count.mockResolvedValue(0);
      mockTaskModel.count.mockResolvedValue(0);
      mockBudgetModel.count.mockResolvedValue(0);
      mockServiceModel.count.mockResolvedValue(0);

      await repository.getAdminStats();

      expect(mockUserModel.count).toHaveBeenCalledWith({ where: { role: UserRole.CLIENT } });
    });

    it('should count overdue tasks that are not COMPLETED', async () => {
      mockUserModel.count.mockResolvedValue(0);
      mockPropertyModel.count.mockResolvedValue(0);
      mockTaskModel.count.mockResolvedValue(0);
      mockBudgetModel.count.mockResolvedValue(0);
      mockServiceModel.count.mockResolvedValue(0);

      await repository.getAdminStats();

      expect(mockTaskModel.count).toHaveBeenCalledWith({
        where: {
          nextDueDate: { lt: expect.any(Date) },
          status: { not: TaskStatus.COMPLETED },
        },
      });
    });
  });

  describe('getRecentActivity', () => {
    it('should return 5 recent lists with take 5 each', async () => {
      mockUserModel.findMany.mockResolvedValue([]);
      mockPropertyModel.findMany.mockResolvedValue([]);
      mockTaskLogModel.findMany.mockResolvedValue([]);
      mockBudgetModel.findMany.mockResolvedValue([]);
      mockServiceModel.findMany.mockResolvedValue([]);

      const result = await repository.getRecentActivity();

      expect(result).toHaveProperty('recentClients');
      expect(result).toHaveProperty('recentProperties');
      expect(result).toHaveProperty('recentTasks');
      expect(result).toHaveProperty('recentBudgets');
      expect(result).toHaveProperty('recentServices');
    });

    it('should query recent task logs ordered by completedAt', async () => {
      mockUserModel.findMany.mockResolvedValue([]);
      mockPropertyModel.findMany.mockResolvedValue([]);
      mockTaskLogModel.findMany.mockResolvedValue([]);
      mockBudgetModel.findMany.mockResolvedValue([]);
      mockServiceModel.findMany.mockResolvedValue([]);

      await repository.getRecentActivity();

      expect(mockTaskLogModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { completedAt: 'desc' },
          take: 5,
        }),
      );
    });
  });

  describe('getClientPropertyAndPlanIds', () => {
    it('should filter properties by userId', async () => {
      mockPropertyModel.findMany.mockResolvedValue([]);

      await repository.getClientPropertyAndPlanIds('user-1');

      expect(mockPropertyModel.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { id: true, maintenancePlan: { select: { id: true } } },
      });
    });

    it('should extract planIds and handle null maintenancePlan', async () => {
      mockPropertyModel.findMany.mockResolvedValue([
        { id: 'p1', maintenancePlan: { id: 'plan-1' } },
        { id: 'p2', maintenancePlan: null },
        { id: 'p3', maintenancePlan: { id: 'plan-3' } },
      ]);

      const result = await repository.getClientPropertyAndPlanIds('user-1');

      expect(result.propertyIds).toEqual(['p1', 'p2', 'p3']);
      expect(result.planIds).toEqual(['plan-1', 'plan-3']);
    });
  });

  describe('getClientTaskStats', () => {
    beforeEach(() => {
      mockTaskModel.count.mockResolvedValue(0);
      mockTaskLogModel.count.mockResolvedValue(0);
    });

    it('should use planIds in where clause', async () => {
      await repository.getClientTaskStats(['plan-1', 'plan-2'], 'user-1');

      expect(mockTaskModel.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            maintenancePlanId: { in: ['plan-1', 'plan-2'] },
          }),
        }),
      );
    });

    it('should count completedThisMonth via taskLog (not softDelete.task)', async () => {
      await repository.getClientTaskStats(['plan-1'], 'user-1');

      expect(mockTaskLogModel.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          task: { maintenancePlanId: { in: ['plan-1'] } },
          completedAt: { gte: expect.any(Date) },
        }),
      });
    });
  });

  describe('getClientBudgetAndServiceCounts', () => {
    it('should filter by propertyIds and status', async () => {
      mockBudgetModel.count.mockResolvedValue(2);
      mockServiceModel.count.mockResolvedValue(1);

      const result = await repository.getClientBudgetAndServiceCounts(['p1', 'p2']);

      expect(result).toEqual({ pendingBudgets: 2, openServices: 1 });
      expect(mockBudgetModel.count).toHaveBeenCalledWith({
        where: {
          propertyId: { in: ['p1', 'p2'] },
          status: { in: [BudgetStatus.PENDING, BudgetStatus.QUOTED] },
        },
      });
      expect(mockServiceModel.count).toHaveBeenCalledWith({
        where: {
          propertyId: { in: ['p1', 'p2'] },
          status: { in: [ServiceStatus.OPEN, ServiceStatus.IN_REVIEW, ServiceStatus.IN_PROGRESS] },
        },
      });
    });
  });

  describe('getClientUpcomingTasks', () => {
    it('should use OR clause for overdue and upcoming tasks', async () => {
      mockTaskModel.findMany.mockResolvedValue([]);

      await repository.getClientUpcomingTasks('user-1');

      expect(mockTaskModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            maintenancePlan: {
              property: { userId: 'user-1', deletedAt: null },
            },
            OR: expect.arrayContaining([
              expect.objectContaining({ status: { not: TaskStatus.COMPLETED } }),
            ]),
          }),
          take: 50,
          orderBy: { nextDueDate: 'asc' },
        }),
      );
    });
  });

  describe('getConditionDistribution', () => {
    it('should group by conditionFound and return labels', async () => {
      mockTaskLogModel.groupBy = jest
        .fn()
        .mockResolvedValue([{ conditionFound: 'GOOD', _count: 5 }]);

      const result = await repository.getConditionDistribution();

      expect(mockTaskLogModel.groupBy).toHaveBeenCalledWith({
        by: ['conditionFound'],
        _count: true,
      });
      expect(result).toEqual([{ condition: 'GOOD', count: 5, label: expect.any(String) }]);
    });
  });

  describe('getProblematicSectors', () => {
    it('should return sectors with overdue tasks', async () => {
      // getProblematicSectors uses this.prisma.task (not softDelete.task)
      const mockDirectTask = {
        groupBy: jest.fn().mockResolvedValue([{ sector: 'ROOF', _count: { _all: 3 } }]),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (repository as any).prisma.task = mockDirectTask;

      const result = await repository.getProblematicSectors();

      expect(result).toEqual([{ sector: 'ROOF', overdueCount: 3 }]);
    });
  });

  describe('getTotalMaintenanceCost', () => {
    it('should return aggregate sum of costs', async () => {
      mockTaskLogModel.aggregate = jest.fn().mockResolvedValue({ _sum: { cost: 50000 } });

      const result = await repository.getTotalMaintenanceCost();

      expect(result).toBe(50000);
    });

    it('should return 0 when no costs', async () => {
      mockTaskLogModel.aggregate = jest.fn().mockResolvedValue({ _sum: { cost: null } });

      const result = await repository.getTotalMaintenanceCost();

      expect(result).toBe(0);
    });
  });

  describe('getCompletionRate', () => {
    it('should return percentage of tasks with logs', async () => {
      mockTaskModel.count.mockResolvedValueOnce(10).mockResolvedValueOnce(7);

      const result = await repository.getCompletionRate();

      expect(result).toBe(70);
    });

    it('should return 0 when no tasks exist', async () => {
      mockTaskModel.count.mockResolvedValue(0);

      const result = await repository.getCompletionRate();

      expect(result).toBe(0);
    });
  });

  describe('getClientConditionDistribution', () => {
    it('should return empty array for empty planIds', async () => {
      const result = await repository.getClientConditionDistribution([]);

      expect(result).toEqual([]);
    });

    it('should group by conditionFound for client planIds', async () => {
      mockTaskLogModel.groupBy = jest
        .fn()
        .mockResolvedValue([{ conditionFound: 'EXCELLENT', _count: 3 }]);

      const result = await repository.getClientConditionDistribution(['plan-1']);

      expect(result).toEqual([{ condition: 'EXCELLENT', count: 3, label: expect.any(String) }]);
    });
  });

  describe('getClientConditionTrend', () => {
    it('should return empty array for empty planIds', async () => {
      const result = await repository.getClientConditionTrend([], 6);

      expect(result).toEqual([]);
    });
  });

  describe('getClientCostHistory', () => {
    it('should return empty array for empty planIds', async () => {
      const result = await repository.getClientCostHistory([], 6);

      expect(result).toEqual([]);
    });
  });

  describe('getClientSectorBreakdown', () => {
    it('should return empty array for empty planIds', async () => {
      const result = await repository.getClientSectorBreakdown([]);

      expect(result).toEqual([]);
    });
  });

  describe('getClientCategoryBreakdown', () => {
    it('should return empty array for empty planIds', async () => {
      const result = await repository.getClientCategoryBreakdown([]);

      expect(result).toEqual([]);
    });
  });
});
