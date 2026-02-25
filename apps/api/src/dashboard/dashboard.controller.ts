import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { UserRole } from '@epde/shared';

@ApiTags('Dashboard')
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

  @Get('client-stats')
  @Roles(UserRole.CLIENT)
  async getClientStats(@CurrentUser() user: { id: string }) {
    const data = await this.dashboardService.getClientStats(user.id);
    return { data };
  }

  @Get('client-upcoming')
  @Roles(UserRole.CLIENT)
  async getClientUpcoming(@CurrentUser() user: { id: string }) {
    const data = await this.dashboardService.getClientUpcomingTasks(user.id);
    return { data };
  }
}
