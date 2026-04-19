import type { CurrentUser as CurrentUserPayload } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

const analyticsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

@ApiTags('Panel')
@ApiBearerAuth()
@Throttle({ medium: { limit: 30, ttl: 60_000 } })
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    const data = await this.dashboardService.getStats();
    return { data };
  }

  /**
   * Financial pulse — revenue consolidado + cobranza pendiente. Lazy-loaded
   * desde el frontend para no bloquear la carga inicial del dashboard.
   */
  @Get('financial')
  @Roles(UserRole.ADMIN)
  async getFinancial() {
    const data = await this.dashboardService.getFinancial();
    return { data };
  }

  /** Operational — inspecciones técnicas + profesionales + clientes en riesgo. */
  @Get('operational')
  @Roles(UserRole.ADMIN)
  async getOperational() {
    const data = await this.dashboardService.getOperational();
    return { data };
  }

  /** Portfolio — ISV del stock + certificados de mantenimiento. */
  @Get('portfolio')
  @Roles(UserRole.ADMIN)
  async getPortfolio() {
    const data = await this.dashboardService.getPortfolio();
    return { data };
  }

  @Get('activity')
  @Roles(UserRole.ADMIN)
  async getRecentActivity() {
    const data = await this.dashboardService.getRecentActivity();
    return { data };
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async getAnalytics(
    @Query(new ZodValidationPipe(analyticsQuerySchema)) query: { months: number },
  ) {
    return { data: await this.dashboardService.getAdminAnalytics(query.months) };
  }

  @Get('client-stats')
  @Roles(UserRole.CLIENT)
  async getClientStats(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.dashboardService.getClientStats(user.id);
    return { data };
  }

  @Get('client-upcoming')
  @Roles(UserRole.CLIENT)
  async getClientUpcoming(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.dashboardService.getClientUpcomingTasks(user.id);
    return { data };
  }

  @Get('client-analytics')
  @Roles(UserRole.CLIENT)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async getClientAnalytics(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(analyticsQuerySchema)) query: { months: number },
  ) {
    return { data: await this.dashboardService.getClientAnalytics(user.id, query.months) };
  }

  /** Current week's challenge for the authenticated user. */
  @Get('weekly-challenge')
  @Roles(UserRole.CLIENT)
  async getWeeklyChallenge(@CurrentUser('id') userId: string) {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setUTCDate(monday.getUTCDate() - diff);
    monday.setUTCHours(0, 0, 0, 0);

    const challenge = await this.prisma.weeklyChallenge.findUnique({
      where: { userId_weekStart: { userId, weekStart: monday } },
    });
    return { data: challenge };
  }
}
