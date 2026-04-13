import { WeeklyChallengeRepository } from './weekly-challenge.repository';

describe('WeeklyChallengeRepository', () => {
  let repository: WeeklyChallengeRepository;
  let prisma: {
    weeklyChallenge: {
      upsert: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const weekStart = new Date('2026-04-07T00:00:00.000Z'); // Monday
  const userId = 'user-1';

  const challenge = {
    id: 'wc-1',
    userId,
    weekStart,
    type: 'COMPLETE_3_TASKS',
    target: 3,
    progress: 0,
    completed: false,
    completedAt: null,
  };

  beforeEach(() => {
    prisma = {
      weeklyChallenge: {
        upsert: jest.fn().mockResolvedValue(challenge),
        findUnique: jest.fn().mockResolvedValue(challenge),
        update: jest.fn().mockResolvedValue({ ...challenge, progress: 3, completed: true }),
      },
    };
    repository = new WeeklyChallengeRepository(prisma as never);
  });

  describe('upsertChallenge', () => {
    it('creates a challenge when it does not exist for that user+week', async () => {
      const result = await repository.upsertChallenge(userId, weekStart, 'COMPLETE_3_TASKS', 3);
      expect(prisma.weeklyChallenge.upsert).toHaveBeenCalledWith({
        where: { userId_weekStart: { userId, weekStart } },
        update: {},
        create: { userId, weekStart, type: 'COMPLETE_3_TASKS', target: 3 },
      });
      expect(result).toEqual(challenge);
    });

    it('is idempotent — second call for same user+week is a no-op (update: {})', async () => {
      await repository.upsertChallenge(userId, weekStart, 'COMPLETE_3_TASKS', 3);
      await repository.upsertChallenge(userId, weekStart, 'COMPLETE_3_TASKS', 3);
      expect(prisma.weeklyChallenge.upsert).toHaveBeenCalledTimes(2);
      // Both calls use update: {} which means existing record is not modified
      expect(prisma.weeklyChallenge.upsert).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ update: {} }),
      );
    });
  });

  describe('findByUserAndWeek', () => {
    it('returns the challenge for a user+week combination', async () => {
      const result = await repository.findByUserAndWeek(userId, weekStart);
      expect(result).toEqual(challenge);
      expect(prisma.weeklyChallenge.findUnique).toHaveBeenCalledWith({
        where: { userId_weekStart: { userId, weekStart } },
      });
    });

    it('returns null when no challenge exists for that week', async () => {
      prisma.weeklyChallenge.findUnique.mockResolvedValue(null);
      const result = await repository.findByUserAndWeek(userId, weekStart);
      expect(result).toBeNull();
    });
  });

  describe('updateProgress', () => {
    it('updates progress without setting completedAt when not completed', async () => {
      prisma.weeklyChallenge.update.mockResolvedValue({
        ...challenge,
        progress: 2,
        completed: false,
      });
      const result = await repository.updateProgress('wc-1', 2, false);
      expect(prisma.weeklyChallenge.update).toHaveBeenCalledWith({
        where: { id: 'wc-1' },
        data: { progress: 2, completed: false },
      });
      expect(result.completed).toBe(false);
    });

    it('sets completedAt when completed=true', async () => {
      const now = new Date();
      jest.useFakeTimers().setSystemTime(now);

      await repository.updateProgress('wc-1', 3, true);
      expect(prisma.weeklyChallenge.update).toHaveBeenCalledWith({
        where: { id: 'wc-1' },
        data: { progress: 3, completed: true, completedAt: now },
      });

      jest.useRealTimers();
    });
  });
});
