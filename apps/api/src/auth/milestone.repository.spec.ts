import { MilestoneRepository } from './milestone.repository';

describe('MilestoneRepository', () => {
  let repository: MilestoneRepository;
  let prisma: {
    userMilestone: {
      findMany: jest.Mock;
      createMany: jest.Mock;
    };
    taskLog: { count: jest.Mock };
    softDelete: { user: { findUnique: jest.Mock } };
  };

  beforeEach(() => {
    prisma = {
      userMilestone: {
        findMany: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      taskLog: { count: jest.fn().mockResolvedValue(0) },
      softDelete: { user: { findUnique: jest.fn() } },
    };
    repository = new MilestoneRepository(prisma as never);
  });

  describe('findEarnedTypes', () => {
    it('returns type-only objects for earned milestones', async () => {
      prisma.userMilestone.findMany.mockResolvedValue([
        { type: 'FIRST_TASK' },
        { type: 'STREAK_7' },
      ]);
      const result = await repository.findEarnedTypes('user-1');
      expect(result).toEqual([{ type: 'FIRST_TASK' }, { type: 'STREAK_7' }]);
      expect(prisma.userMilestone.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { type: true },
      });
    });

    it('returns empty array when no milestones earned', async () => {
      prisma.userMilestone.findMany.mockResolvedValue([]);
      const result = await repository.findEarnedTypes('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('countTaskLogsByUser', () => {
    it('counts task logs across all plans owned by the user', async () => {
      prisma.taskLog.count.mockResolvedValue(15);
      const result = await repository.countTaskLogsByUser('user-1');
      expect(result).toBe(15);
      expect(prisma.taskLog.count).toHaveBeenCalledWith({
        where: { task: { maintenancePlan: { property: { userId: 'user-1' } } } },
      });
    });
  });

  describe('findUserActivationDate', () => {
    it('returns activatedAt when user exists', async () => {
      const date = new Date('2025-06-01');
      prisma.softDelete.user.findUnique.mockResolvedValue({ activatedAt: date });
      const result = await repository.findUserActivationDate('user-1');
      expect(result).toEqual(date);
    });

    it('returns null when user does not exist', async () => {
      prisma.softDelete.user.findUnique.mockResolvedValue(null);
      const result = await repository.findUserActivationDate('user-1');
      expect(result).toBeNull();
    });

    it('returns null when activatedAt is null (never activated)', async () => {
      prisma.softDelete.user.findUnique.mockResolvedValue({ activatedAt: null });
      const result = await repository.findUserActivationDate('user-1');
      expect(result).toBeNull();
    });
  });

  describe('createMany', () => {
    it('bulk-creates milestones with skipDuplicates', async () => {
      await repository.createMany('user-1', ['FIRST_TASK', 'STREAK_7']);
      expect(prisma.userMilestone.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-1', type: 'FIRST_TASK' },
          { userId: 'user-1', type: 'STREAK_7' },
        ],
        skipDuplicates: true,
      });
    });

    it('is a no-op for empty types array', async () => {
      await repository.createMany('user-1', []);
      expect(prisma.userMilestone.createMany).toHaveBeenCalledWith({
        data: [],
        skipDuplicates: true,
      });
    });
  });

  describe('findAllByUser', () => {
    it('returns milestones ordered by unlockedAt ascending', async () => {
      const milestones = [{ id: 'm-1', type: 'FIRST_TASK', unlockedAt: new Date() }];
      prisma.userMilestone.findMany.mockResolvedValue(milestones);
      const result = await repository.findAllByUser('user-1');
      expect(result).toEqual(milestones);
      expect(prisma.userMilestone.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { unlockedAt: 'asc' },
      });
    });
  });
});
