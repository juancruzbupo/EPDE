import { WeeklyChallengeRepository } from './weekly-challenge.repository';
import { WeeklyChallengeService } from './weekly-challenge.service';

jest.mock('@sentry/node', () => ({
  withMonitor: jest.fn((_name, fn) => fn()),
  captureException: jest.fn(),
}));

describe('WeeklyChallengeService', () => {
  let service: WeeklyChallengeService;
  let mockChallengeRepo: {
    upsertChallenge: jest.Mock;
    findByUserAndWeek: jest.Mock;
    updateProgress: jest.Mock;
  };
  let mockUsersRepo: { findActiveClients: jest.Mock };
  let mockStatsRepo: { getAllClientPlanIds: jest.Mock; getBatchTaskStats: jest.Mock };
  let mockPushService: { sendToUsers: jest.Mock };
  let mockLockService: { withLock: jest.Mock };
  let mockMetricsService: { recordCronExecution: jest.Mock };

  beforeEach(() => {
    mockChallengeRepo = {
      upsertChallenge: jest.fn().mockResolvedValue({}),
      findByUserAndWeek: jest.fn().mockResolvedValue(null),
      updateProgress: jest.fn().mockResolvedValue({}),
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
      mockChallengeRepo as unknown as WeeklyChallengeRepository,
      mockUsersRepo as never,
      mockStatsRepo as never,
      mockPushService as never,
      mockLockService as never,
      mockMetricsService as never,
    );
  });

  describe('incrementProgress', () => {
    it('increments progress and returns completed=false when below target', async () => {
      mockChallengeRepo.findByUserAndWeek.mockResolvedValue({
        id: 'ch-1',
        progress: 0,
        target: 3,
        completed: false,
      });
      const result = await service.incrementProgress('user-1');
      expect(result).toEqual({ completed: false });
      expect(mockChallengeRepo.updateProgress).toHaveBeenCalledWith('ch-1', 1, false);
    });

    it('marks completed when progress reaches target', async () => {
      mockChallengeRepo.findByUserAndWeek.mockResolvedValue({
        id: 'ch-1',
        progress: 2,
        target: 3,
        completed: false,
      });
      const result = await service.incrementProgress('user-1');
      expect(result).toEqual({ completed: true });
      expect(mockChallengeRepo.updateProgress).toHaveBeenCalledWith('ch-1', 3, true);
    });

    it('returns null when no active challenge exists', async () => {
      mockChallengeRepo.findByUserAndWeek.mockResolvedValue(null);
      const result = await service.incrementProgress('user-1');
      expect(result).toBeNull();
    });

    it('returns null when challenge already completed', async () => {
      mockChallengeRepo.findByUserAndWeek.mockResolvedValue({
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
      mockChallengeRepo.findByUserAndWeek.mockResolvedValue(challenge);
      const result = await service.getActiveChallenge('user-1');
      expect(result).toEqual(challenge);
    });

    it('returns null when no challenge for current week', async () => {
      mockChallengeRepo.findByUserAndWeek.mockResolvedValue(null);
      const result = await service.getActiveChallenge('user-1');
      expect(result).toBeNull();
    });
  });
});
