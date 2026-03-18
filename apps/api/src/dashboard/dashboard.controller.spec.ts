import type { CurrentUser as CurrentUserPayload } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { Test, TestingModule } from '@nestjs/testing';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

const mockDashboardService = {
  getStats: jest.fn(),
  getRecentActivity: jest.fn(),
  getAdminAnalytics: jest.fn(),
  getClientStats: jest.fn(),
  getClientUpcomingTasks: jest.fn(),
  getClientAnalytics: jest.fn(),
};

const _adminUser: CurrentUserPayload = {
  id: 'admin-1',
  role: UserRole.ADMIN,
  email: 'admin@epde.ar',
  jti: 'jti-admin-1',
};

const clientUser: CurrentUserPayload = {
  id: 'client-1',
  role: UserRole.CLIENT,
  email: 'client@epde.ar',
  jti: 'jti-client-1',
};

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockDashboardService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should delegate to dashboardService.getStats and return { data }', async () => {
      const stats = { totalProperties: 5, totalTasks: 20, pendingBudgets: 3 };
      mockDashboardService.getStats.mockResolvedValue(stats);

      const result = await controller.getStats();

      expect(mockDashboardService.getStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: stats });
    });
  });

  describe('getRecentActivity', () => {
    it('should delegate to dashboardService.getRecentActivity and return { data }', async () => {
      const activity = [{ id: 'act-1', type: 'task_completed', timestamp: '2026-01-01' }];
      mockDashboardService.getRecentActivity.mockResolvedValue(activity);

      const result = await controller.getRecentActivity();

      expect(mockDashboardService.getRecentActivity).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: activity });
    });
  });

  describe('getAnalytics', () => {
    it('should delegate to dashboardService.getAdminAnalytics and return { data }', async () => {
      const analytics = { completionRate: 0.85, avgResolutionDays: 4 };
      mockDashboardService.getAdminAnalytics.mockResolvedValue(analytics);

      const result = await controller.getAnalytics({ months: 6 });

      expect(mockDashboardService.getAdminAnalytics).toHaveBeenCalledWith(6);
      expect(result).toEqual({ data: analytics });
    });
  });

  describe('getClientStats', () => {
    it('should delegate to dashboardService.getClientStats with user.id and return { data }', async () => {
      const stats = { activeProperties: 2, upcomingTasks: 5 };
      mockDashboardService.getClientStats.mockResolvedValue(stats);

      const result = await controller.getClientStats(clientUser);

      expect(mockDashboardService.getClientStats).toHaveBeenCalledWith('client-1');
      expect(result).toEqual({ data: stats });
    });

    it('should pass user.id (not the whole user object) to the service', async () => {
      mockDashboardService.getClientStats.mockResolvedValue({});

      await controller.getClientStats(clientUser);

      const [passedId] = mockDashboardService.getClientStats.mock.calls[0];
      expect(passedId).toBe('client-1');
    });
  });

  describe('getClientUpcoming', () => {
    it('should delegate to dashboardService.getClientUpcomingTasks with user.id and return { data }', async () => {
      const tasks = [{ id: 'task-1', name: 'Revisar canaletas' }];
      mockDashboardService.getClientUpcomingTasks.mockResolvedValue(tasks);

      const result = await controller.getClientUpcoming(clientUser);

      expect(mockDashboardService.getClientUpcomingTasks).toHaveBeenCalledWith('client-1');
      expect(result).toEqual({ data: tasks });
    });
  });

  describe('getClientAnalytics', () => {
    it('should delegate to dashboardService.getClientAnalytics with user.id and return { data }', async () => {
      const analytics = { tasksCompleted: 12, onTimeRate: 0.9 };
      mockDashboardService.getClientAnalytics.mockResolvedValue(analytics);

      const result = await controller.getClientAnalytics(clientUser, { months: 6 });

      expect(mockDashboardService.getClientAnalytics).toHaveBeenCalledWith('client-1', 6);
      expect(result).toEqual({ data: analytics });
    });

    it('should pass user.id (not the whole user object) to the service', async () => {
      mockDashboardService.getClientAnalytics.mockResolvedValue({});

      await controller.getClientAnalytics(clientUser, { months: 6 });

      const [passedId] = mockDashboardService.getClientAnalytics.mock.calls[0];
      expect(passedId).toBe('client-1');
    });
  });
});
