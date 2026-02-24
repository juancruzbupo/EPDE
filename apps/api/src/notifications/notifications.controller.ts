import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: { id: string },
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.notificationsService.getNotifications(
      user.id,
      cursor,
      take ? parseInt(take, 10) : undefined,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { data: { count } };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const data = await this.notificationsService.markAsRead(id, user.id);
    return { data };
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    const count = await this.notificationsService.markAllAsRead(user.id);
    return { data: { count }, message: 'Notificaciones marcadas como leídas' };
  }
}
