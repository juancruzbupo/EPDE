import { PrismaService } from '../prisma/prisma.service';
import { MilestoneService } from './milestone.service';

describe('MilestoneService', () => {
  let service: MilestoneService;
  let mockPrisma: {
    userMilestone: { findMany: jest.Mock; createMany: jest.Mock };
    taskLog: { count: jest.Mock };
    softDelete: { user: { findUnique: jest.Mock } };
  };

  beforeEach(() => {
    mockPrisma = {
      userMilestone: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      taskLog: { count: jest.fn().mockResolvedValue(0) },
      softDelete: { user: { findUnique: jest.fn().mockResolvedValue(null) } },
    };
    service = new MilestoneService(mockPrisma as unknown as PrismaService);
  });

  describe('checkAndAward', () => {
    it('awards TASKS_10 when taskLog count >= 10', async () => {
      mockPrisma.taskLog.count.mockResolvedValue(10);
      const result = await service.checkAndAward('user-1');
      expect(result).toContain('TASKS_10');
      expect(mockPrisma.userMilestone.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
    });

    it('awards TASKS_50 when taskLog count >= 50', async () => {
      mockPrisma.taskLog.count.mockResolvedValue(50);
      const result = await service.checkAndAward('user-1');
      expect(result).toContain('TASKS_10');
      expect(result).toContain('TASKS_50');
    });

    it('awards TASKS_100 when taskLog count >= 100', async () => {
      mockPrisma.taskLog.count.mockResolvedValue(100);
      const result = await service.checkAndAward('user-1');
      expect(result).toContain('TASKS_100');
    });

    it('awards FIRST_PREVENTION when problemDetected context is true', async () => {
      const result = await service.checkAndAward('user-1', { problemDetected: true });
      expect(result).toContain('FIRST_PREVENTION');
    });

    it('awards STREAK_6 when streak context >= 6', async () => {
      const result = await service.checkAndAward('user-1', { streak: 6 });
      expect(result).toContain('STREAK_6');
    });

    it('awards STREAK_12 when streak context >= 12', async () => {
      const result = await service.checkAndAward('user-1', { streak: 12 });
      expect(result).toContain('STREAK_6');
      expect(result).toContain('STREAK_12');
    });

    it('awards ANNIVERSARY_1 when user activated > 1 year ago', async () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      mockPrisma.softDelete.user.findUnique.mockResolvedValue({ activatedAt: twoYearsAgo });
      const result = await service.checkAndAward('user-1');
      expect(result).toContain('ANNIVERSARY_1');
    });

    it('skips already earned milestones', async () => {
      mockPrisma.userMilestone.findMany.mockResolvedValue([{ type: 'TASKS_10' }]);
      mockPrisma.taskLog.count.mockResolvedValue(15);
      const result = await service.checkAndAward('user-1');
      expect(result).not.toContain('TASKS_10');
    });

    it('returns empty array on Prisma error (fire-and-forget)', async () => {
      mockPrisma.userMilestone.findMany.mockRejectedValue(new Error('DB down'));
      const result = await service.checkAndAward('user-1');
      expect(result).toEqual([]);
    });

    it('returns empty array when no new milestones earned', async () => {
      const result = await service.checkAndAward('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('getUserMilestones', () => {
    it('returns milestones with emoji and label from MILESTONE_MAP', async () => {
      mockPrisma.userMilestone.findMany.mockResolvedValue([
        { id: 'm-1', userId: 'user-1', type: 'TASKS_10', unlockedAt: new Date() },
      ]);
      const result = await service.getUserMilestones('user-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'TASKS_10',
        emoji: '🎉',
        label: 'Primeras 10 tareas',
      });
    });
  });
});
