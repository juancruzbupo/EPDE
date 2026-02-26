import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from './redis.service';

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  /**
   * Lua script: release lock only if the caller still owns it.
   * KEYS[1] = lock key
   * ARGV[1] = expected owner value
   * Returns 1 if released, 0 if not owned.
   */
  private static readonly RELEASE_LUA = `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('DEL', KEYS[1])
    else
      return 0
    end
  `;

  /**
   * Lua script: extend lock TTL only if the caller still owns it.
   * KEYS[1] = lock key
   * ARGV[1] = expected owner value
   * ARGV[2] = new TTL in seconds
   * Returns 1 if extended, 0 if not owned or not found.
   */
  private static readonly EXTEND_LUA = `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
    else
      return 0
    end
  `;

  constructor(private readonly redis: RedisService) {}

  /**
   * Attempts to acquire a distributed lock.
   * @returns The lock owner token if acquired, null otherwise.
   */
  async acquireLock(key: string, ttlSeconds: number): Promise<string | null> {
    const owner = randomUUID();
    const acquired = await this.redis.setnx(`lock:${key}`, owner, ttlSeconds);
    return acquired ? owner : null;
  }

  /**
   * Release the lock only if the caller still owns it.
   */
  async releaseLock(key: string, owner: string): Promise<void> {
    await this.redis.eval(DistributedLockService.RELEASE_LUA, [`lock:${key}`], [owner]);
  }

  /**
   * Extend the lock TTL only if the caller still owns it.
   * @returns true if extended, false if lock expired or not owned.
   */
  async extendLock(key: string, owner: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.redis.eval(
      DistributedLockService.EXTEND_LUA,
      [`lock:${key}`],
      [owner, ttlSeconds],
    );
    return result === 1;
  }

  /**
   * Execute a function with a distributed lock and automatic TTL watchdog.
   * The watchdog extends the lock TTL periodically to prevent expiration
   * during long-running operations.
   * If the lock cannot be acquired, returns null (skips execution).
   *
   * The callback receives a signal object with a `lockLost` flag. Long-running
   * operations should check `signal.lockLost` before expensive steps and abort
   * early if the lock was lost.
   */
  async withLock<T>(
    key: string,
    ttlSeconds: number,
    fn: (signal: { lockLost: boolean }) => Promise<T>,
  ): Promise<T | null> {
    const owner = await this.acquireLock(key, ttlSeconds);
    if (!owner) {
      this.logger.debug(`Lock "${key}" already held, skipping`);
      return null;
    }

    const signal = { lockLost: false };

    // Watchdog: extend lock at half the TTL interval
    const watchdogInterval = Math.max(Math.floor((ttlSeconds * 1000) / 2), 5000);
    const watchdog = setInterval(async () => {
      try {
        const extended = await this.extendLock(key, owner, ttlSeconds);
        if (!extended) {
          signal.lockLost = true;
          clearInterval(watchdog);
          this.logger.error(`Lock "${key}" lost during execution`);
        }
      } catch (error) {
        signal.lockLost = true;
        clearInterval(watchdog);
        this.logger.error(`Lock "${key}" watchdog error: ${(error as Error).message}`);
      }
    }, watchdogInterval);

    try {
      return await fn(signal);
    } finally {
      clearInterval(watchdog);
      if (!signal.lockLost) {
        await this.releaseLock(key, owner);
      }
    }
  }
}
