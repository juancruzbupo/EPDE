import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { HealthIndexRepository } from './health-index.repository';

describe('HealthIndexRepository', () => {
  let repo: HealthIndexRepository;
  let mockPrisma: {
    softDelete: { task: { findMany: jest.Mock; count: jest.Mock } };
    task: { findMany: jest.Mock; groupBy: jest.Mock };
    taskLog: { findMany: jest.Mock };
    iSVSnapshot: { findMany: jest.Mock };
    $queryRaw: jest.Mock;
  };
  let mockRedis: {
    get: jest.Mock;
    setex: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      softDelete: {
        task: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      },
      task: {
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      taskLog: { findMany: jest.fn().mockResolvedValue([]) },
      iSVSnapshot: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue(undefined),
    };
    repo = new HealthIndexRepository(
      mockPrisma as unknown as PrismaService,
      mockRedis as unknown as RedisService,
    );
  });

  describe('getPropertyHealthIndex', () => {
    it('returns zero score when planIds is empty', async () => {
      const result = await repo.getPropertyHealthIndex([]);
      expect(result.score).toBe(0);
      expect(result.label).toBe('Sin datos');
    });

    it('returns cached result on Redis hit', async () => {
      const cached = {
        score: 75,
        label: 'Bueno',
        dimensions: { compliance: 80, condition: 75, coverage: 70, investment: 65, trend: 60 },
        sectorScores: [],
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));
      const result = await repo.getPropertyHealthIndex(['plan-1']);
      expect(result).toEqual(cached);
      expect(mockPrisma.softDelete.task.findMany).not.toHaveBeenCalled();
    });

    it('computes and caches on Redis miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await repo.getPropertyHealthIndex(['plan-1']);
      expect(result).toHaveProperty('score');
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('health:'),
        expect.any(Number),
        expect.any(String),
      );
    });

    it('computes even when Redis throws (graceful degradation)', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'));
      const result = await repo.getPropertyHealthIndex(['plan-1']);
      expect(result).toHaveProperty('score');
    });
  });

  describe('getPropertyHealthIndexBatch', () => {
    it('returns empty map for empty planIds', async () => {
      const result = await repo.getPropertyHealthIndexBatch([]);
      expect(result.size).toBe(0);
    });

    it('returns cached batch on Redis hit', async () => {
      const cached = [
        [
          'plan-1',
          {
            score: 80,
            label: 'Bueno',
            dimensions: { compliance: 85, condition: 80, coverage: 75, investment: 70, trend: 65 },
            sectorScores: [],
          },
        ],
      ];
      mockRedis.get.mockResolvedValue(JSON.stringify(cached));
      const result = await repo.getPropertyHealthIndexBatch(['plan-1']);
      expect(result.size).toBe(1);
      expect(result.get('plan-1')).toHaveProperty('score', 80);
    });

    it('computes per-plan results and caches batch', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await repo.getPropertyHealthIndexBatch(['plan-1']);
      expect(result).toBeInstanceOf(Map);
      expect(mockRedis.setex).toHaveBeenCalled();
    });
  });

  describe('getMaintenanceStreak', () => {
    it('returns 0 for empty planIds', async () => {
      const result = await repo.getMaintenanceStreak([]);
      expect(result).toBe(0);
    });

    it('returns cached streak on Redis hit', async () => {
      mockRedis.get.mockResolvedValue('6');
      const result = await repo.getMaintenanceStreak(['plan-1']);
      expect(result).toBe(6);
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('computes streak with 2 batch queries (not N+1 loop)', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      await repo.getMaintenanceStreak(['plan-1']);
      // Should call $queryRaw exactly 2 times (overdue + completed)
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('returns 24 when all months are clean (no overdue)', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.$queryRaw.mockResolvedValue([]); // No overdue in any month
      const result = await repo.getMaintenanceStreak(['plan-1']);
      expect(result).toBe(24);
    });

    it('caches computed streak in Redis', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      await repo.getMaintenanceStreak(['plan-1']);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('streak:'),
        expect.any(Number),
        expect.any(String),
      );
    });
  });

  describe('getIsvDelta', () => {
    it('returns null for empty propertyIds', async () => {
      const result = await repo.getIsvDelta([]);
      expect(result).toBeNull();
    });

    it('returns null when fewer than 2 snapshots', async () => {
      mockPrisma.iSVSnapshot.findMany.mockResolvedValue([{ score: 75 }]);
      const result = await repo.getIsvDelta(['prop-1']);
      expect(result).toBeNull();
    });
  });

  describe('getClientSectorBreakdown', () => {
    it('returns empty array for empty planIds', async () => {
      const result = await repo.getClientSectorBreakdown([]);
      expect(result).toEqual([]);
    });

    it('queries with take limits (bounded)', async () => {
      await repo.getClientSectorBreakdown(['plan-1']);
      const taskCall = mockPrisma.task.findMany.mock.calls[0][0];
      const logCall = mockPrisma.taskLog.findMany.mock.calls[0][0];
      expect(taskCall.take).toBe(500);
      expect(logCall.take).toBe(1_000);
    });
  });
});
