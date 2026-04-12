import { MilestoneRepository } from './milestone.repository';
import { MilestoneService } from './milestone.service';

describe('MilestoneService', () => {
  let service: MilestoneService;
  let mockRepo: {
    findEarnedTypes: jest.Mock;
    countTaskLogsByUser: jest.Mock;
    findUserActivationDate: jest.Mock;
    createMany: jest.Mock;
    findAllByUser: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      findEarnedTypes: jest.fn().mockResolvedValue([]),
      countTaskLogsByUser: jest.fn().mockResolvedValue(0),
      findUserActivationDate: jest.fn().mockResolvedValue(null),
      createMany: jest.fn().mockResolvedValue(undefined),
      findAllByUser: jest.fn().mockResolvedValue([]),
    };
    service = new MilestoneService(mockRepo as unknown as MilestoneRepository);
  });

  describe('checkAndAward', () => {
    it('awards TASKS_10 when taskLog count >= 10', async () => {
      mockRepo.countTaskLogsByUser.mockResolvedValue(10);
      const result = await service.checkAndAward('user-1');
      expect(result).toContain('TASKS_10');
      expect(mockRepo.createMany).toHaveBeenCalledWith(
        'user-1',
        expect.arrayContaining(['TASKS_10']),
      );
    });

    it('awards TASKS_50 when taskLog count >= 50', async () => {
      mockRepo.countTaskLogsByUser.mockResolvedValue(50);
      const result = await service.checkAndAward('user-1');
      expect(result).toContain('TASKS_10');
      expect(result).toContain('TASKS_50');
    });

    it('awards TASKS_100 when taskLog count >= 100', async () => {
      mockRepo.countTaskLogsByUser.mockResolvedValue(100);
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
      mockRepo.findUserActivationDate.mockResolvedValue(twoYearsAgo);
      const result = await service.checkAndAward('user-1');
      expect(result).toContain('ANNIVERSARY_1');
    });

    it('skips already earned milestones', async () => {
      mockRepo.findEarnedTypes.mockResolvedValue([{ type: 'TASKS_10' }]);
      mockRepo.countTaskLogsByUser.mockResolvedValue(15);
      const result = await service.checkAndAward('user-1');
      expect(result).not.toContain('TASKS_10');
    });

    it('returns empty array on repository error (fire-and-forget)', async () => {
      mockRepo.findEarnedTypes.mockRejectedValue(new Error('DB down'));
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
      mockRepo.findAllByUser.mockResolvedValue([
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
