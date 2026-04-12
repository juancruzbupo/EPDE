import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsRepository } from './analytics.repository';

describe('AnalyticsRepository', () => {
  let repo: AnalyticsRepository;
  let mockPrisma: {
    $queryRaw: jest.Mock;
    taskLog: { groupBy: jest.Mock; aggregate: jest.Mock };
    task: { groupBy: jest.Mock };
    softDelete: { task: { findMany: jest.Mock; count: jest.Mock } };
  };

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      taskLog: {
        groupBy: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _sum: { cost: null } }),
      },
      task: { groupBy: jest.fn().mockResolvedValue([]) },
      softDelete: {
        task: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      },
    };
    repo = new AnalyticsRepository(mockPrisma as unknown as PrismaService);
  });

  describe('getCompletionTrend', () => {
    it('returns month buckets with zero fills for missing months', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      const result = await repo.getCompletionTrend(6);
      expect(result).toHaveLength(6);
      expect(result.every((r) => r.value === 0)).toBe(true);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('label');
    });

    it('maps raw query results to correct months', async () => {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      mockPrisma.$queryRaw.mockResolvedValue([{ month: currentMonth, count: BigInt(5) }]);
      const result = await repo.getCompletionTrend(3);
      const current = result.find((r) => r.month === currentMonth);
      expect(current?.value).toBe(5);
    });
  });

  describe('getConditionDistribution', () => {
    it('maps groupBy results to condition + count + label', async () => {
      mockPrisma.taskLog.groupBy.mockResolvedValue([
        { conditionFound: 'GOOD', _count: 10 },
        { conditionFound: 'POOR', _count: 3 },
      ]);
      const result = await repo.getConditionDistribution();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ condition: 'GOOD', count: 10 });
      expect(result[1]).toMatchObject({ condition: 'POOR', count: 3 });
    });
  });

  describe('getBudgetPipeline', () => {
    it('returns budget counts and amounts per status', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { status: 'PENDING', count: BigInt(5), totalAmount: 150000 },
        { status: 'APPROVED', count: BigInt(2), totalAmount: 80000 },
      ]);
      const result = await repo.getBudgetPipeline();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ status: 'PENDING', count: 5, totalAmount: 150000 });
    });
  });

  describe('getClientCategoryBreakdown', () => {
    it('returns empty array for empty planIds', async () => {
      const result = await repo.getClientCategoryBreakdown([]);
      expect(result).toEqual([]);
    });

    it('caps task query at take:100', async () => {
      await repo.getClientCategoryBreakdown(['plan-1']);
      const findManyCall = mockPrisma.softDelete.task.findMany.mock.calls[0][0];
      expect(findManyCall.take).toBe(100);
    });
  });

  describe('getCompletionRate', () => {
    it('returns 0 when no tasks exist', async () => {
      mockPrisma.softDelete.task.count.mockResolvedValue(0);
      const result = await repo.getCompletionRate();
      expect(result).toBe(0);
    });

    it('calculates percentage of tasks with logs', async () => {
      mockPrisma.softDelete.task.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75); // with logs
      const result = await repo.getCompletionRate();
      expect(result).toBe(75);
    });
  });

  describe('getTotalMaintenanceCost', () => {
    it('returns 0 when no costs', async () => {
      const result = await repo.getTotalMaintenanceCost();
      expect(result).toBe(0);
    });
  });
});
