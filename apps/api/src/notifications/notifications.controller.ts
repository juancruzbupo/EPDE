import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { cursorPaginationSchema } from '@epde/shared';
import type { CursorPaginationInput } from '@epde/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: { id: string },
    @Query(new ZodValidationPipe(cursorPaginationSchema)) query: CursorPaginationInput,
  ) {
    return this.notificationsService.getNotifications(user.id, query.cursor, query.take);
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
