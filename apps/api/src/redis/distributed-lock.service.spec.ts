import { Test, TestingModule } from '@nestjs/testing';

import { DistributedLockService } from './distributed-lock.service';
import { RedisService } from './redis.service';

const mockRedisService = {
  setnx: jest.fn(),
  eval: jest.fn(),
};

describe('DistributedLockService', () => {
  let service: DistributedLockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DistributedLockService, { provide: RedisService, useValue: mockRedisService }],
    }).compile();

    service = module.get<DistributedLockService>(DistributedLockService);
    jest.clearAllMocks();
  });

  describe('acquireLock', () => {
    it('should return an owner token string when lock is acquired (setnx returns OK)', async () => {
      mockRedisService.setnx.mockResolvedValue('OK');

      const owner = await service.acquireLock('my-key', 30);

      expect(typeof owner).toBe('string');
      expect(owner).not.toBeNull();
      expect(mockRedisService.setnx).toHaveBeenCalledWith('lock:my-key', expect.any(String), 30);
    });

    it('should return null when lock is already held (setnx returns null)', async () => {
      mockRedisService.setnx.mockResolvedValue(null);

      const owner = await service.acquireLock('my-key', 30);

      expect(owner).toBeNull();
    });
  });

  describe('releaseLock', () => {
    it('should call eval with RELEASE_LUA and correct key/owner', async () => {
      mockRedisService.eval.mockResolvedValue(1);

      await service.releaseLock('my-key', 'owner-token');

      expect(mockRedisService.eval).toHaveBeenCalledWith(
        expect.any(String),
        ['lock:my-key'],
        ['owner-token'],
      );
    });
  });

  describe('extendLock', () => {
    it('should return true when eval returns 1 (extension succeeded)', async () => {
      mockRedisService.eval.mockResolvedValue(1);

      expect(await service.extendLock('my-key', 'owner-token', 30)).toBe(true);
    });

    it('should return false when eval returns 0 (lock expired or not owned)', async () => {
      mockRedisService.eval.mockResolvedValue(0);

      expect(await service.extendLock('my-key', 'owner-token', 30)).toBe(false);
    });
  });

  describe('withLock', () => {
    it('should execute callback and release lock when acquired', async () => {
      jest.spyOn(service, 'acquireLock').mockResolvedValue('owner-token');
      jest.spyOn(service, 'releaseLock').mockResolvedValue();
      jest.spyOn(service, 'extendLock').mockResolvedValue(true);

      const callback = jest.fn().mockResolvedValue('result');
      const result = await service.withLock('my-key', 30, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ lockLost: false }));
      expect(result).toBe('result');
      expect(service.releaseLock).toHaveBeenCalledWith('my-key', 'owner-token');
    });

    it('should skip callback and return null when lock is not available', async () => {
      jest.spyOn(service, 'acquireLock').mockResolvedValue(null);

      const callback = jest.fn();
      const result = await service.withLock('my-key', 30, callback);

      expect(callback).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should release lock even when callback throws an error', async () => {
      jest.spyOn(service, 'acquireLock').mockResolvedValue('owner-token');
      jest.spyOn(service, 'releaseLock').mockResolvedValue();
      jest.spyOn(service, 'extendLock').mockResolvedValue(true);

      const callback = jest.fn().mockRejectedValue(new Error('callback error'));

      await expect(service.withLock('my-key', 30, callback)).rejects.toThrow('callback error');
      expect(service.releaseLock).toHaveBeenCalledWith('my-key', 'owner-token');
    });

    it('should set signal.lockLost to true when watchdog cannot extend the lock', async () => {
      jest.useFakeTimers();
      jest.spyOn(service, 'acquireLock').mockResolvedValue('owner-token');
      jest.spyOn(service, 'extendLock').mockResolvedValue(false); // watchdog fails
      jest.spyOn(service, 'releaseLock').mockResolvedValue();

      let capturedSignal: { lockLost: boolean } | undefined;
      let resolveCallback!: () => void;

      const withLockPromise = service.withLock('my-key', 10, async (signal) => {
        capturedSignal = signal;
        await new Promise<void>((r) => {
          resolveCallback = r;
        });
        return null;
      });

      // ttl=10 → watchdog interval = max(floor(10000/2), 5000) = 5000ms
      await jest.advanceTimersByTimeAsync(5100);

      expect(capturedSignal?.lockLost).toBe(true);

      resolveCallback();
      await withLockPromise;

      jest.useRealTimers();
    });
  });
});
