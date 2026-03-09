import type { CurrentUser as CurrentUserPayload, CursorPaginationInput } from '@epde/shared';
import { cursorPaginationSchema, UserRole } from '@epde/shared';
import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { NotificationsService } from './notifications.service';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query(new ZodValidationPipe(cursorPaginationSchema)) query: CursorPaginationInput,
  ) {
    return this.notificationsService.getNotifications(user.id, query.cursor, query.take);
  }

  @Get('unread-count')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { data: { count } };
  }

  @Patch(':id/read')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.notificationsService.markAsRead(id, user.id);
    return { data };
  }

  /** Collection-level bulk action — marks ALL unread notifications as read. */
  @Patch('read-all')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    const count = await this.notificationsService.markAllAsRead(user.id);
    return { data: { count }, message: 'Notificaciones marcadas como leídas' };
  }
}
