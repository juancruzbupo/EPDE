import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../redis/redis.service';

const MAX_ATTEMPTS = 10;
const LOCKOUT_TTL_SECONDS = 15 * 60; // 15 minutes

/**
 * Tracks failed login attempts per email and enforces temporary lockout.
 *
 * **Why:** `@nestjs/throttler` rate-limits per IP. An attacker with a botnet or rotating
 * proxies can distribute brute-force attempts across many IPs, each staying under the
 * per-IP limit. This service tracks failures *per victim account*, independent of IP.
 *
 * **Behavior:**
 * - Counter key: `login_fail:{email_lowercase}` with 15-minute sliding TTL
 * - On `recordFailure()`, increments counter
 * - `isLocked()` returns true when counter >= 10
 * - On successful login, caller MUST call `clear()` to reset
 *
 * **Redis fail-open:** if Redis is unavailable, lockout checks return `false` (allow through)
 * to avoid locking out users during infrastructure incidents. Trade-off: availability over
 * perfect security. Combined with `EmailAwareThrottlerGuard`, brute-force is still mitigated.
 */
@Injectable()
export class LoginAttemptService {
  private readonly logger = new Logger(LoginAttemptService.name);

  constructor(private readonly redisService: RedisService) {}

  private key(email: string): string {
    return `login_fail:${email.toLowerCase().trim()}`;
  }

  async isLocked(email: string): Promise<boolean> {
    try {
      const raw = await this.redisService.get(this.key(email));
      if (!raw) return false;
      const count = parseInt(raw, 10);
      return Number.isFinite(count) && count >= MAX_ATTEMPTS;
    } catch (err) {
      this.logger.warn(
        `Redis unavailable — skipping lockout check for ${email.substring(0, 3)}***: ${(err as Error).message}`,
      );
      return false;
    }
  }

  async recordFailure(email: string): Promise<number> {
    try {
      return await this.redisService.incrWithTtl(this.key(email), LOCKOUT_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(
        `Redis unavailable — skipping failure counter for ${email.substring(0, 3)}***: ${(err as Error).message}`,
      );
      return 0;
    }
  }

  async clear(email: string): Promise<void> {
    try {
      await this.redisService.del(this.key(email));
    } catch (err) {
      this.logger.warn(
        `Redis unavailable — could not clear fail counter for ${email.substring(0, 3)}***: ${(err as Error).message}`,
      );
    }
  }
}
