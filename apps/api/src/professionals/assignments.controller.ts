import type { CreateAssignmentInput, CurrentUser as CurrentUserPayload } from '@epde/shared';
import { createAssignmentSchema, UserRole } from '@epde/shared';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AssignmentsService } from './assignments.service';

@ApiTags('Profesionales')
@ApiBearerAuth()
@Controller('service-requests/:id/assign')
export class AssignmentsController {
  constructor(private readonly service: AssignmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createAssignmentSchema)) dto: CreateAssignmentInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.service.assign(id, dto, user.id);
    return { data, message: 'Profesional asignado' };
  }

  @Delete()
  @Roles(UserRole.ADMIN)
  async unassign(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.unassign(id);
    return { data: null, message: 'Asignación removida' };
  }
}
