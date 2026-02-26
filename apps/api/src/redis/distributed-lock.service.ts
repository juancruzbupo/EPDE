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
   * Execute a function with a distributed lock.
   * If the lock cannot be acquired, returns null (skips execution).
   */
  async withLock<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T | null> {
    const owner = await this.acquireLock(key, ttlSeconds);
    if (!owner) {
      this.logger.debug(`Lock "${key}" already held, skipping`);
      return null;
    }
    try {
      return await fn();
    } finally {
      await this.releaseLock(key, owner);
    }
  }
}
