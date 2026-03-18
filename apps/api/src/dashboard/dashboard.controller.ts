import type { CurrentUser as CurrentUserPayload } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { DashboardService } from './dashboard.service';

const analyticsQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});

@ApiTags('Panel')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    const data = await this.dashboardService.getStats();
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
  async getClientAnalytics(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(analyticsQuerySchema)) query: { months: number },
  ) {
    return { data: await this.dashboardService.getClientAnalytics(user.id, query.months) };
  }
}
