import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsRepository } from './dashboard-stats.repository';

describe('DashboardStatsRepository', () => {
  let repo: DashboardStatsRepository;
  let mockPrisma: {
    maintenancePlan: { findMany: jest.Mock };
    $queryRaw: jest.Mock;
    softDelete: { task: { findMany: jest.Mock } };
  };

  beforeEach(() => {
    mockPrisma = {
      maintenancePlan: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([]),
      softDelete: { task: { findMany: jest.fn().mockResolvedValue([]) } },
    };
    repo = new DashboardStatsRepository(mockPrisma as unknown as PrismaService);
  });

  describe('getAllClientPlanIds', () => {
    it('returns empty map for empty clientIds', async () => {
      const result = await repo.getAllClientPlanIds([]);
      expect(result.size).toBe(0);
    });

    it('groups plans by userId', async () => {
      mockPrisma.maintenancePlan.findMany.mockResolvedValue([
        { id: 'plan-1', property: { userId: 'user-1' } },
        { id: 'plan-2', property: { userId: 'user-1' } },
        { id: 'plan-3', property: { userId: 'user-2' } },
      ]);
      const result = await repo.getAllClientPlanIds(['user-1', 'user-2']);
      expect(result.get('user-1')).toEqual(['plan-1', 'plan-2']);
      expect(result.get('user-2')).toEqual(['plan-3']);
    });
  });

  describe('getBatchTaskStats', () => {
    it('returns empty map for empty planIds', async () => {
      const result = await repo.getBatchTaskStats([]);
      expect(result.size).toBe(0);
    });

    it('aggregates stats per planId from raw query', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          maintenancePlanId: 'plan-1',
          pending: BigInt(5),
          overdue: BigInt(2),
          upcoming_week: BigInt(3),
          urgent: BigInt(1),
        },
      ]);
      const result = await repo.getBatchTaskStats(['plan-1']);
      expect(result.get('plan-1')).toEqual({
        pendingTasks: 5,
        overdueTasks: 2,
        upcomingThisWeek: 3,
        urgentTasks: 1,
      });
    });
  });

  describe('getBatchUpcomingTasks', () => {
    it('returns map of userId to next upcoming task', async () => {
      mockPrisma.softDelete.task.findMany.mockResolvedValue([
        {
          id: 'task-1',
          name: 'Limpiar canaletas',
          nextDueDate: new Date('2026-05-01'),
          maintenancePlan: { property: { userId: 'user-1' } },
        },
      ]);
      const result = await repo.getBatchUpcomingTasks(['user-1']);
      expect(result.get('user-1')).toMatchObject({ name: 'Limpiar canaletas' });
    });
  });
});
