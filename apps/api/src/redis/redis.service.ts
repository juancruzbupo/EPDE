import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Key prefix to avoid collisions in shared Redis instances. */
const KEY_PREFIX = 'epde:';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    if (nodeEnv === 'production' && !url.startsWith('rediss://')) {
      throw new Error(
        'REDIS_URL must use TLS (rediss://) in production. ' +
          'Received URL starting with: ' +
          url.substring(0, url.indexOf('://') + 3),
      );
    }

    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 5_000), // Exponential backoff, max 5s
      ...(url.startsWith('rediss://') && { tls: { rejectUnauthorized: true } }),
    });
    this.client.on('connect', () => {
      this._isConnected = true;
      this.logger.log('Redis connected');
    });
    this.client.on('ready', () => {
      this._isConnected = true;
    });
    this.client.on('error', (err) => {
      this._isConnected = false;
      this.logger.error('Redis error', err.message);
    });
    this.client.on('reconnecting', (ms: number) =>
      this.logger.warn(`Redis reconnecting in ${ms}ms`),
    );
    this.client.on('close', () => {
      this._isConnected = false;
      this.logger.warn('Redis connection closed');
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.ping();
      this.logger.log('Redis connection verified');
    } catch (err) {
      const isProd = this.configService.get<string>('NODE_ENV') === 'production';
      if (isProd) {
        throw new Error(
          `Redis is unreachable in production — auth token rotation will not work: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      this.logger.warn(
        'Redis ping failed — auth token rotation will degrade gracefully in development',
      );
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  private prefixed(key: string): string {
    return key.startsWith(KEY_PREFIX) ? key : `${KEY_PREFIX}${key}`;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(this.prefixed(key));
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(this.prefixed(key), value);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.client.setex(this.prefixed(key), seconds, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(this.prefixed(key));
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(this.prefixed(key));
    return result === 1;
  }

  /**
   * Safe version of exists() that returns null instead of throwing when Redis is unavailable.
   * Used for graceful degradation (e.g., skipping blacklist checks when Redis is down).
   */
  async safeExists(key: string): Promise<boolean | null> {
    try {
      const result = await this.client.exists(this.prefixed(key));
      return result === 1;
    } catch {
      return null;
    }
  }

  /**
   * SET key value NX EX seconds — set if not exists with TTL.
   * Returns true if the key was set (lock acquired), false otherwise.
   */
  async setnx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(this.prefixed(key), value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  /**
   * Health check: returns true if Redis responds to PING.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Execute a Lua script atomically.
   */
  async eval(script: string, keys: string[], args: (string | number)[]): Promise<unknown> {
    try {
      const prefixedKeys = keys.map((k) => this.prefixed(k));
      return await this.client.eval(script, prefixedKeys.length, ...prefixedKeys, ...args);
    } catch (error) {
      this.logger.error(`Redis EVAL failed: ${(error as Error).message}`, {
        scriptLength: script.length,
        keys,
      });
      throw error;
    }
  }
}
