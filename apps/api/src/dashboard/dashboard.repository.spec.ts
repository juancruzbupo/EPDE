import { DashboardRepository } from './dashboard.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardRepository', () => {
  let repository: DashboardRepository;

  const mockUserModel = { count: jest.fn(), findMany: jest.fn() };
  const mockPropertyModel = { count: jest.fn(), findMany: jest.fn() };
  const mockTaskModel = { count: jest.fn(), findMany: jest.fn() };
  const mockBudgetModel = { count: jest.fn(), findMany: jest.fn() };
  const mockServiceModel = { count: jest.fn(), findMany: jest.fn() };
  const mockTaskLogModel = { count: jest.fn() };

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

      expect(mockUserModel.count).toHaveBeenCalledWith({ where: { role: 'CLIENT' } });
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
          status: { not: 'COMPLETED' },
        },
      });
    });
  });

  describe('getRecentActivity', () => {
    it('should return 5 recent lists with take 5 each', async () => {
      mockUserModel.findMany.mockResolvedValue([]);
      mockPropertyModel.findMany.mockResolvedValue([]);
      mockTaskModel.findMany.mockResolvedValue([]);
      mockBudgetModel.findMany.mockResolvedValue([]);
      mockServiceModel.findMany.mockResolvedValue([]);

      const result = await repository.getRecentActivity();

      expect(result).toHaveProperty('recentClients');
      expect(result).toHaveProperty('recentProperties');
      expect(result).toHaveProperty('recentTasks');
      expect(result).toHaveProperty('recentBudgets');
      expect(result).toHaveProperty('recentServices');
    });

    it('should filter completed tasks by status', async () => {
      mockUserModel.findMany.mockResolvedValue([]);
      mockPropertyModel.findMany.mockResolvedValue([]);
      mockTaskModel.findMany.mockResolvedValue([]);
      mockBudgetModel.findMany.mockResolvedValue([]);
      mockServiceModel.findMany.mockResolvedValue([]);

      await repository.getRecentActivity();

      expect(mockTaskModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'COMPLETED' },
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
          completedBy: 'user-1',
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
          status: { in: ['PENDING', 'QUOTED'] },
        },
      });
      expect(mockServiceModel.count).toHaveBeenCalledWith({
        where: {
          propertyId: { in: ['p1', 'p2'] },
          status: { in: ['OPEN', 'IN_REVIEW', 'IN_PROGRESS'] },
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
            OR: expect.arrayContaining([expect.objectContaining({ status: { not: 'COMPLETED' } })]),
          }),
          take: 10,
          orderBy: { nextDueDate: 'asc' },
        }),
      );
    });
  });
});
