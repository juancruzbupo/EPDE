import type { RedisService } from '../redis/redis.service';
import { LoginAttemptService } from './login-attempt.service';

describe('LoginAttemptService', () => {
  let service: LoginAttemptService;
  let mockRedis: {
    get: jest.Mock;
    del: jest.Mock;
    incrWithTtl: jest.Mock;
  };

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      del: jest.fn(),
      incrWithTtl: jest.fn(),
    };
    service = new LoginAttemptService(mockRedis as unknown as RedisService);
  });

  describe('isLocked', () => {
    it('returns false when no attempts recorded', async () => {
      mockRedis.get.mockResolvedValue(null);
      await expect(service.isLocked('user@test.com')).resolves.toBe(false);
    });

    it('returns false when attempts below threshold', async () => {
      mockRedis.get.mockResolvedValue('5');
      await expect(service.isLocked('user@test.com')).resolves.toBe(false);
    });

    it('returns true when attempts at or above threshold', async () => {
      mockRedis.get.mockResolvedValue('10');
      await expect(service.isLocked('user@test.com')).resolves.toBe(true);

      mockRedis.get.mockResolvedValue('15');
      await expect(service.isLocked('user@test.com')).resolves.toBe(true);
    });

    it('normalizes email to lowercase before lookup', async () => {
      mockRedis.get.mockResolvedValue(null);
      await service.isLocked('  User@Test.COM  ');
      expect(mockRedis.get).toHaveBeenCalledWith('login_fail:user@test.com');
    });

    it('fails open when Redis throws (availability over lockout)', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis down'));
      await expect(service.isLocked('user@test.com')).resolves.toBe(false);
    });

    it('handles malformed counter values', async () => {
      mockRedis.get.mockResolvedValue('not-a-number');
      await expect(service.isLocked('user@test.com')).resolves.toBe(false);
    });
  });

  describe('recordFailure', () => {
    it('increments the counter with 15-minute TTL', async () => {
      mockRedis.incrWithTtl.mockResolvedValue(3);
      const result = await service.recordFailure('user@test.com');
      expect(result).toBe(3);
      expect(mockRedis.incrWithTtl).toHaveBeenCalledWith('login_fail:user@test.com', 15 * 60);
    });

    it('returns 0 and logs warning when Redis unavailable', async () => {
      mockRedis.incrWithTtl.mockRejectedValue(new Error('Redis down'));
      await expect(service.recordFailure('user@test.com')).resolves.toBe(0);
    });
  });

  describe('clear', () => {
    it('deletes the counter key', async () => {
      mockRedis.del.mockResolvedValue(undefined);
      await service.clear('user@test.com');
      expect(mockRedis.del).toHaveBeenCalledWith('login_fail:user@test.com');
    });

    it('silently ignores Redis errors', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis down'));
      await expect(service.clear('user@test.com')).resolves.toBeUndefined();
    });
  });
});
