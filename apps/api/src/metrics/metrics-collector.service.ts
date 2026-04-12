import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MetricsService } from './metrics.service';

/**
 * Periodically collects infrastructure metrics (Redis memory, DB pool) and
 * feeds them into MetricsService ObservableGauges for Prometheus scraping.
 *
 * Internal to MetricsModule — not exported.
 */
@Injectable()
export class MetricsCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsCollectorService.name);
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly metrics: MetricsService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.interval = setInterval(() => void this.collect(), 30_000);
    void this.collect();
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  private async collect() {
    await Promise.all([this.collectRedisMemory(), this.collectDbPool()]);
  }

  private async collectRedisMemory() {
    try {
      const info = await this.redis.getMemoryInfo();
      if (info) {
        this.metrics.setRedisMemory(info.usedMemoryBytes, info.usagePercentage);
      }
    } catch (error) {
      this.logger.debug(`Redis memory collection failed: ${(error as Error).message}`);
    }
  }

  private async collectDbPool() {
    try {
      const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()
      `;
      const active = Number(result[0]?.count ?? 0);
      this.metrics.setDbPoolConnections(active);
    } catch (error) {
      this.logger.debug(`DB pool collection failed: ${(error as Error).message}`);
    }
  }
}
