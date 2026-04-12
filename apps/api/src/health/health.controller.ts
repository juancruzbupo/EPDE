import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { QueueHealthIndicator } from './queue.health';
import { RedisHealthIndicator } from './redis.health';

/**
 * Infrastructure health checks — NOT a domain controller.
 *
 * PrismaService is injected here because `@nestjs/terminus` PrismaHealthIndicator.pingCheck()
 * requires a PrismaClient instance as argument. This is the documented Terminus API, not a
 * violation of the "only repositories inject PrismaService" rule — health checks are
 * infrastructure-layer concerns, not data access.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly queueHealth: QueueHealthIndicator,
  ) {}

  /** Liveness probe — DB + Redis ping. Used by load balancers. */
  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }

  /** Readiness probe — DB + Redis + queue backlog. For deployment verification. */
  @Get('ready')
  @Public()
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
      () => this.queueHealth.isHealthy('queues'),
    ]);
  }
}
