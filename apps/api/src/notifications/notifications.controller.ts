import type {
  CurrentUser as CurrentUserPayload,
  CursorPaginationInput,
  RegisterPushTokenInput,
  RemovePushTokenInput,
} from '@epde/shared';
import {
  cursorPaginationSchema,
  registerPushTokenSchema,
  removePushTokenSchema,
  UserRole,
} from '@epde/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

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

  /** Collection-level bulk action — marks ALL unread notifications as read. */
  @Patch('read-all')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    const count = await this.notificationsService.markAllAsRead(user.id);
    return { data: { count }, message: 'Notificaciones marcadas como leídas' };
  }

  @Patch(':id/read')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.notificationsService.markAsRead(id, user.id);
    return { data, message: 'Notificación marcada como leída' };
  }

  @Post('push-token')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async registerPushToken(
    @Body(new ZodValidationPipe(registerPushTokenSchema)) body: RegisterPushTokenInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.pushService.registerToken(user.id, body.token, body.platform);
    return { data: null, message: 'Push token registrado' };
  }

  @Delete('push-token')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async removePushToken(
    @Body(new ZodValidationPipe(removePushTokenSchema)) body: RemovePushTokenInput,
  ) {
    await this.pushService.removeToken(body.token);
    return { data: null, message: 'Push token eliminado' };
  }
}
