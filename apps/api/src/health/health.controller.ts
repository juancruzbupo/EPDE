import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisHealthIndicator } from './redis.health';

/**
 * Infrastructure health checks — NOT a domain controller.
 *
 * PrismaService is injected here because `@nestjs/terminus` PrismaHealthIndicator.pingCheck()
 * requires a PrismaClient instance as argument. This is the documented Terminus API, not a
 * violation of the "only repositories inject PrismaService" rule — health checks are
 * infrastructure-layer concerns, not data access.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
