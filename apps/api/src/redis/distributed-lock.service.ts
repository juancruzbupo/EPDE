import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  constructor(private readonly redis: RedisService) {}

  /**
   * Attempts to acquire a distributed lock.
   * @param key Lock name (e.g. 'cron:task-status-recalculation')
   * @param ttlSeconds Maximum lock duration (safety net)
   * @returns true if lock was acquired
   */
  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    return this.redis.setnx(`lock:${key}`, Date.now().toString(), ttlSeconds);
  }

  async releaseLock(key: string): Promise<void> {
    await this.redis.del(`lock:${key}`);
  }

  /**
   * Execute a function with a distributed lock.
   * If the lock cannot be acquired, returns null (skips execution).
   */
  async withLock<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T | null> {
    const acquired = await this.acquireLock(key, ttlSeconds);
    if (!acquired) {
      this.logger.debug(`Lock "${key}" already held, skipping`);
      return null;
    }
    try {
      return await fn();
    } finally {
      await this.releaseLock(key);
    }
  }
}
