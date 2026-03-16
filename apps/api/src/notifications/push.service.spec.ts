import { PushService } from './push.service';

describe('PushService', () => {
  let service: PushService;
  let pushTokensRepository: {
    upsert: jest.Mock;
    remove: jest.Mock;
    removeAllForUser: jest.Mock;
    findByUserIds: jest.Mock;
  };

  beforeEach(() => {
    pushTokensRepository = {
      upsert: jest.fn(),
      remove: jest.fn(),
      removeAllForUser: jest.fn(),
      findByUserIds: jest.fn(),
    };
    service = new PushService(pushTokensRepository as never);
  });

  describe('registerToken', () => {
    it('should upsert token via repository', async () => {
      pushTokensRepository.upsert.mockResolvedValue({ id: '1', token: 'tok', userId: 'u1' });
      await service.registerToken('u1', 'tok', 'ios');
      expect(pushTokensRepository.upsert).toHaveBeenCalledWith('u1', 'tok', 'ios');
    });
  });

  describe('removeToken', () => {
    it('should delegate to repository', async () => {
      pushTokensRepository.remove.mockResolvedValue(null);
      await service.removeToken('tok');
      expect(pushTokensRepository.remove).toHaveBeenCalledWith('tok');
    });
  });

  describe('removeAllForUser', () => {
    it('should delegate to repository', async () => {
      pushTokensRepository.removeAllForUser.mockResolvedValue({ count: 2 });
      await service.removeAllForUser('u1');
      expect(pushTokensRepository.removeAllForUser).toHaveBeenCalledWith('u1');
    });
  });

  describe('sendToUsers', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true }) as never;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should not call Expo API if no tokens found', async () => {
      pushTokensRepository.findByUserIds.mockResolvedValue([]);
      await service.sendToUsers(['u1'], { title: 'Test', body: 'Body' });
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should send push notification via Expo API', async () => {
      pushTokensRepository.findByUserIds.mockResolvedValue([
        { token: 'ExponentPushToken[abc]', userId: 'u1' },
      ]);

      await service.sendToUsers(['u1'], { title: 'Test', body: 'Body' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('ExponentPushToken[abc]'),
        }),
      );
    });

    it('should not throw on Expo API failure', async () => {
      pushTokensRepository.findByUserIds.mockResolvedValue([{ token: 'tok', userId: 'u1' }]);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(service.sendToUsers(['u1'], { title: 'T', body: 'B' })).resolves.toBeUndefined();
    });

    it('should chunk messages in batches of 100', async () => {
      const tokens = Array.from({ length: 150 }, (_, i) => ({
        token: `tok-${i}`,
        userId: `u-${i}`,
      }));
      pushTokensRepository.findByUserIds.mockResolvedValue(tokens);

      await service.sendToUsers(
        tokens.map((t) => t.userId),
        { title: 'T', body: 'B' },
      );

      // 150 tokens = 2 chunks (100 + 50)
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
