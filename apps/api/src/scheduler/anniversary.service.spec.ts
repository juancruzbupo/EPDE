import { AnniversaryService } from './anniversary.service';

jest.mock('@sentry/node', () => ({
  withMonitor: jest.fn((_name, fn) => fn()),
  captureException: jest.fn(),
}));

describe('AnniversaryService', () => {
  let service: AnniversaryService;
  let mockUsersRepo: { findAnniversaryUsers: jest.Mock };
  let mockEmailQueue: { enqueueAnniversary: jest.Mock };
  let mockPushService: { sendToUsers: jest.Mock };
  let mockMilestoneService: { checkAndAward: jest.Mock };
  let mockStatsRepo: { getAllClientPlanIds: jest.Mock; countTaskLogsByPlanIds: jest.Mock };
  let mockLockService: { withLock: jest.Mock };
  let mockMetricsService: { recordCronExecution: jest.Mock };

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  beforeEach(() => {
    mockUsersRepo = { findAnniversaryUsers: jest.fn().mockResolvedValue([]) };
    mockEmailQueue = { enqueueAnniversary: jest.fn().mockResolvedValue(undefined) };
    mockPushService = { sendToUsers: jest.fn().mockResolvedValue(undefined) };
    mockMilestoneService = { checkAndAward: jest.fn().mockResolvedValue([]) };
    mockStatsRepo = {
      getAllClientPlanIds: jest.fn().mockResolvedValue(new Map()),
      countTaskLogsByPlanIds: jest.fn().mockResolvedValue(0),
    };
    mockLockService = {
      withLock: jest.fn().mockImplementation((_key, _ttl, fn) => fn({ lockLost: false })),
    };
    mockMetricsService = { recordCronExecution: jest.fn() };

    service = new AnniversaryService(
      mockUsersRepo as never,
      mockEmailQueue as never,
      mockPushService as never,
      mockMilestoneService as never,
      mockStatsRepo as never,
      mockLockService as never,
      mockMetricsService as never,
    );
  });

  describe('checkAnniversaries', () => {
    it('does nothing when no users have anniversaries', async () => {
      await service.checkAnniversaries();
      expect(mockMilestoneService.checkAndAward).not.toHaveBeenCalled();
      expect(mockEmailQueue.enqueueAnniversary).not.toHaveBeenCalled();
    });

    it('awards milestone for anniversary user', async () => {
      const user = { id: 'user-1', email: 'u@test.com', name: 'Test', activatedAt: oneYearAgo };
      mockUsersRepo.findAnniversaryUsers.mockResolvedValue([user]);
      mockStatsRepo.getAllClientPlanIds.mockResolvedValue(new Map([['user-1', ['plan-1']]]));
      mockStatsRepo.countTaskLogsByPlanIds.mockResolvedValue(25);

      await service.checkAnniversaries();

      expect(mockMilestoneService.checkAndAward).toHaveBeenCalledWith('user-1');
    });

    it('sends push notification with task count', async () => {
      const user = { id: 'user-1', email: 'u@test.com', name: 'Test', activatedAt: oneYearAgo };
      mockUsersRepo.findAnniversaryUsers.mockResolvedValue([user]);
      mockStatsRepo.getAllClientPlanIds.mockResolvedValue(new Map([['user-1', ['plan-1']]]));
      mockStatsRepo.countTaskLogsByPlanIds.mockResolvedValue(25);

      await service.checkAnniversaries();

      expect(mockPushService.sendToUsers).toHaveBeenCalledWith(
        ['user-1'],
        expect.objectContaining({
          title: expect.stringContaining('1 año'),
          body: expect.stringContaining('25'),
        }),
      );
    });

    it('enqueues anniversary email', async () => {
      const user = { id: 'user-1', email: 'u@test.com', name: 'Test', activatedAt: oneYearAgo };
      mockUsersRepo.findAnniversaryUsers.mockResolvedValue([user]);
      mockStatsRepo.getAllClientPlanIds.mockResolvedValue(new Map([['user-1', []]]));

      await service.checkAnniversaries();

      expect(mockEmailQueue.enqueueAnniversary).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'u@test.com', name: 'Test' }),
      );
    });

    it('continues processing other users if one fails', async () => {
      const users = [
        { id: 'user-1', email: 'u1@test.com', name: 'Test1', activatedAt: oneYearAgo },
        { id: 'user-2', email: 'u2@test.com', name: 'Test2', activatedAt: oneYearAgo },
      ];
      mockUsersRepo.findAnniversaryUsers.mockResolvedValue(users);
      mockStatsRepo.getAllClientPlanIds.mockResolvedValue(new Map());
      mockMilestoneService.checkAndAward
        .mockRejectedValueOnce(new Error('Milestone error'))
        .mockResolvedValueOnce([]);

      await service.checkAnniversaries();

      // Second user still processed despite first failure
      expect(mockEmailQueue.enqueueAnniversary).toHaveBeenCalledTimes(1);
      expect(mockEmailQueue.enqueueAnniversary).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'u2@test.com' }),
      );
    });

    it('records cron execution metric', async () => {
      await service.checkAnniversaries();
      expect(mockMetricsService.recordCronExecution).toHaveBeenCalledWith(
        'anniversary-check',
        expect.any(Number),
      );
    });
  });
});
