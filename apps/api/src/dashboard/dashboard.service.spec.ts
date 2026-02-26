import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';

const mockDashboardRepository = {
  getAdminStats: jest.fn(),
  getRecentActivity: jest.fn(),
  getClientPropertyIds: jest.fn(),
  getPlanIdsByPropertyIds: jest.fn(),
  getClientTaskStats: jest.fn(),
  getClientBudgetAndServiceCounts: jest.fn(),
  getClientUpcomingTasks: jest.fn(),
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
      expect(result[0]!.type).toBe('client_created');
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

      repository.getClientPropertyIds.mockResolvedValue(propertyIds);
      repository.getPlanIdsByPropertyIds.mockResolvedValue(planIds);
      repository.getClientTaskStats.mockResolvedValue(taskStats);
      repository.getClientBudgetAndServiceCounts.mockResolvedValue(budgetServiceStats);

      const result = await service.getClientStats(userId);

      expect(repository.getClientPropertyIds).toHaveBeenCalledWith(userId);
      expect(repository.getPlanIdsByPropertyIds).toHaveBeenCalledWith(propertyIds);
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
      repository.getClientPropertyIds.mockResolvedValue([]);
      repository.getPlanIdsByPropertyIds.mockResolvedValue([]);
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
          status: 'PENDING',
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
          status: 'UPCOMING',
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
        status: 'PENDING',
        propertyAddress: 'Av. Corrientes 1234',
        categoryName: 'Techos',
        maintenancePlanId: 'plan-1',
      });

      expect(result[1]!).toEqual({
        id: 'task-2',
        name: 'Limpiar canaletas',
        nextDueDate: '2025-07-01T10:00:00.000Z',
        priority: 'MEDIUM',
        status: 'UPCOMING',
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
});
