import { Controller, Get } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('ADMIN')
  async getStats() {
    const data = await this.dashboardService.getStats();
    return { data };
  }

  @Get('activity')
  @Roles('ADMIN')
  async getRecentActivity() {
    const data = await this.dashboardService.getRecentActivity();
    return { data };
  }

  @Get('client-stats')
  @Roles('CLIENT')
  async getClientStats(@CurrentUser() user: { id: string }) {
    const data = await this.dashboardService.getClientStats(user.id);
    return { data };
  }

  @Get('client-upcoming')
  @Roles('CLIENT')
  async getClientUpcoming(@CurrentUser() user: { id: string }) {
    const data = await this.dashboardService.getClientUpcomingTasks(user.id);
    return { data };
  }
}
