import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Key prefix to avoid collisions in shared Redis instances. */
const KEY_PREFIX = 'epde:';

/** TLS-layer Node.js error codes that surface at connect time. Presence of any
 *  of these in the failure means the Redis transport never even negotiated —
 *  the problem is the cert, not the server. Keep the list short and exact; the
 *  match is by `code` or by substring in message for engines that stringify. */
const TLS_ERROR_CODES: ReadonlyArray<string> = [
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
];

function describeTlsError(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as { code?: unknown; message?: unknown };
  const code = typeof e.code === 'string' ? e.code : null;
  if (code && TLS_ERROR_CODES.includes(code)) return `${code}`;
  const message = typeof e.message === 'string' ? e.message : '';
  const matched = TLS_ERROR_CODES.find((c) => message.includes(c));
  return matched ? `${matched} (${message})` : null;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
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
      const tlsHint = describeTlsError(err);

      if (tlsHint) {
        // TLS misconfiguration is almost always a deploy-time mistake (bad CA,
        // hostname mismatch, self-signed without trust chain). Fail hard with a
        // specific message in any environment so the operator sees it during
        // boot rather than at the first real traffic.
        throw new Error(
          `Redis TLS handshake failed — ${tlsHint}. Check REDIS_URL scheme (rediss://) and TLS cert trust chain.`,
        );
      }

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

  /**
   * Set a key with a mandatory TTL (seconds). We intentionally do not expose an
   * untimed `set()` to prevent unbounded Redis memory growth via forgotten TTLs.
   * If you need a write-once key, use `setnx` (it also requires TTL).
   */
  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.client.setex(this.prefixed(key), seconds, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(this.prefixed(key));
  }

  /**
   * Delete every key matching a glob pattern. Uses SCAN + UNLINK in batches so
   * it never blocks the server (KEYS would stall Redis for the duration of the
   * match). The pattern is passed as-is after prefixing, so callers pass e.g.
   * 'health:*' and the actual scan happens on 'epde:health:*'.
   *
   * Returns the number of keys removed. Intended for cache-busting on mutations.
   */
  async delByPattern(pattern: string): Promise<number> {
    const fullPattern = this.prefixed(pattern);
    let deleted = 0;
    let cursor = '0';
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', fullPattern, 'COUNT', 500);
      cursor = nextCursor;
      if (keys.length > 0) {
        // UNLINK is non-blocking; falls back to DEL on older Redis but still safe.
        deleted += await this.client.unlink(...keys);
      }
    } while (cursor !== '0');
    return deleted;
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
   * Atomically increment a key and set TTL on first creation.
   * Returns the new counter value. Used for fail-count / rate-limit counters.
   */
  async incrWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const fullKey = this.prefixed(key);
    const pipeline = this.client.multi();
    pipeline.incr(fullKey);
    pipeline.expire(fullKey, ttlSeconds, 'NX'); // only set TTL if not already set
    const results = await pipeline.exec();
    const count = results?.[0]?.[1];
    return typeof count === 'number' ? count : 0;
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
   * Returns Redis memory usage via INFO memory command.
   * Used by MetricsCollectorService for Prometheus gauges.
   */
  async getMemoryInfo(): Promise<{
    usedMemoryBytes: number;
    maxMemoryBytes: number;
    usagePercentage: number;
  } | null> {
    try {
      const info = await this.client.info('memory');
      const usedMatch = info.match(/used_memory:(\d+)/);
      const maxMatch = info.match(/maxmemory:(\d+)/);
      const usedMemoryBytes = usedMatch?.[1] ? parseInt(usedMatch[1], 10) : 0;
      const maxMemoryBytes = maxMatch?.[1] ? parseInt(maxMatch[1], 10) : 0;
      const usagePercentage = maxMemoryBytes > 0 ? (usedMemoryBytes / maxMemoryBytes) * 100 : 0;
      return { usedMemoryBytes, maxMemoryBytes, usagePercentage };
    } catch {
      return null;
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
