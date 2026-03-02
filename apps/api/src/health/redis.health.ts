import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

/**
 * Redis health indicator that returns degraded status (HTTP 200) when Redis is down,
 * rather than failing the entire health check (HTTP 503).
 * This allows load balancers and orchestrators to keep routing traffic while Redis recovers.
 * The `redis.status` field in the response body will show "down" to alert operators.
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.redis.isHealthy();
    if (!isHealthy) {
      this.logger.warn('Redis is unreachable — reporting degraded health (HTTP 200)');
    }
    return this.getStatus(key, isHealthy);
  }
}
