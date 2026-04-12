import { PrismaService } from '../prisma/prisma.service';
import { WeeklyChallengeService } from './weekly-challenge.service';

describe('WeeklyChallengeService', () => {
  let service: WeeklyChallengeService;
  let mockPrisma: {
    weeklyChallenge: { upsert: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let mockUsersRepo: { findActiveClients: jest.Mock };
  let mockStatsRepo: { getAllClientPlanIds: jest.Mock; getBatchTaskStats: jest.Mock };
  let mockPushService: { sendToUsers: jest.Mock };
  let mockLockService: { withLock: jest.Mock };
  let mockMetricsService: { recordCronExecution: jest.Mock };

  beforeEach(() => {
    mockPrisma = {
      weeklyChallenge: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    mockUsersRepo = { findActiveClients: jest.fn().mockResolvedValue([]) };
    mockStatsRepo = {
      getAllClientPlanIds: jest.fn().mockResolvedValue(new Map()),
      getBatchTaskStats: jest.fn().mockResolvedValue(new Map()),
    };
    mockPushService = { sendToUsers: jest.fn().mockResolvedValue(undefined) };
    mockLockService = {
      withLock: jest.fn().mockImplementation((_key, _ttl, fn) => fn({ lockLost: false })),
    };
    mockMetricsService = { recordCronExecution: jest.fn() };

    service = new WeeklyChallengeService(
      mockPrisma as unknown as PrismaService,
      mockUsersRepo as never,
      mockStatsRepo as never,
      mockPushService as never,
      mockLockService as never,
      mockMetricsService as never,
    );
  });

  describe('incrementProgress', () => {
    it('increments progress and returns completed=false when below target', async () => {
      mockPrisma.weeklyChallenge.findUnique.mockResolvedValue({
        id: 'ch-1',
        progress: 0,
        target: 3,
        completed: false,
      });
      const result = await service.incrementProgress('user-1');
      expect(result).toEqual({ completed: false });
      expect(mockPrisma.weeklyChallenge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ progress: 1, completed: false }),
        }),
      );
    });

    it('marks completed when progress reaches target', async () => {
      mockPrisma.weeklyChallenge.findUnique.mockResolvedValue({
        id: 'ch-1',
        progress: 2,
        target: 3,
        completed: false,
      });
      const result = await service.incrementProgress('user-1');
      expect(result).toEqual({ completed: true });
      expect(mockPrisma.weeklyChallenge.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            progress: 3,
            completed: true,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('returns null when no active challenge exists', async () => {
      mockPrisma.weeklyChallenge.findUnique.mockResolvedValue(null);
      const result = await service.incrementProgress('user-1');
      expect(result).toBeNull();
    });

    it('returns null when challenge already completed', async () => {
      mockPrisma.weeklyChallenge.findUnique.mockResolvedValue({
        id: 'ch-1',
        progress: 3,
        target: 3,
        completed: true,
      });
      const result = await service.incrementProgress('user-1');
      expect(result).toBeNull();
    });
  });

  describe('getActiveChallenge', () => {
    it('returns current week challenge', async () => {
      const challenge = { id: 'ch-1', type: 'COMPLETE_N', target: 2, progress: 1 };
      mockPrisma.weeklyChallenge.findUnique.mockResolvedValue(challenge);
      const result = await service.getActiveChallenge('user-1');
      expect(result).toEqual(challenge);
    });

    it('returns null when no challenge for current week', async () => {
      mockPrisma.weeklyChallenge.findUnique.mockResolvedValue(null);
      const result = await service.getActiveChallenge('user-1');
      expect(result).toBeNull();
    });
  });
});
