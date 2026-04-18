import type {
  CreateAttachmentInput,
  CreateRatingInput,
  CreateTagInput,
  CreateTimelineNoteInput,
  CurrentUser as CurrentUserPayload,
} from '@epde/shared';
import {
  createAttachmentSchema,
  createRatingSchema,
  createTagSchema,
  createTimelineNoteSchema,
  UserRole,
} from '@epde/shared';
import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProfessionalSubService } from './professional-sub.service';

@ApiTags('Profesionales')
@ApiBearerAuth()
@Controller('professionals/:id')
export class ProfessionalSubController {
  constructor(private readonly sub: ProfessionalSubService) {}

  @Post('ratings')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 30, ttl: 60_000 } })
  async createRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createRatingSchema)) dto: CreateRatingInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.sub.createRating(id, user.id, dto);
    return { data, message: 'Valoración agregada' };
  }

  @Delete('ratings/:ratingId')
  @Roles(UserRole.ADMIN)
  async deleteRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ratingId', ParseUUIDPipe) ratingId: string,
  ) {
    await this.sub.deleteRating(id, ratingId);
    return { data: null, message: 'Valoración eliminada' };
  }

  @Post('notes')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 60, ttl: 60_000 } })
  async createNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createTimelineNoteSchema)) dto: CreateTimelineNoteInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.sub.createTimelineNote(id, user.id, dto);
    return { data, message: 'Nota agregada' };
  }

  @Post('tags')
  @Roles(UserRole.ADMIN)
  async createTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createTagSchema)) dto: CreateTagInput,
  ) {
    const data = await this.sub.createTag(id, dto);
    return { data, message: 'Tag agregado' };
  }

  @Delete('tags/:tag')
  @Roles(UserRole.ADMIN)
  async deleteTag(@Param('id', ParseUUIDPipe) id: string, @Param('tag') tag: string) {
    await this.sub.deleteTag(id, tag);
    return { data: null, message: 'Tag eliminado' };
  }

  @Post('attachments')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 20, ttl: 60_000 } })
  async createAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createAttachmentSchema)) dto: CreateAttachmentInput,
  ) {
    const data = await this.sub.createAttachment(id, dto);
    return { data, message: 'Adjunto subido' };
  }

  @Patch('attachments/:attachmentId/verify')
  @Roles(UserRole.ADMIN)
  async verifyAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.sub.verifyAttachment(id, attachmentId, user.id);
    return { data, message: 'Adjunto verificado' };
  }

  @Delete('attachments/:attachmentId')
  @Roles(UserRole.ADMIN)
  async deleteAttachment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    await this.sub.deleteAttachment(id, attachmentId);
    return { data: null, message: 'Adjunto eliminado' };
  }
}
