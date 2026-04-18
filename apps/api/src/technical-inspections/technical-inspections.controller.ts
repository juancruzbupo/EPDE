import type {
  CreateTechnicalInspectionInput,
  CurrentUser as CurrentUserPayload,
  MarkInspectionPaidInput,
  ScheduleInspectionInput,
  TechnicalInspectionFiltersInput,
  UpdateInspectionStatusInput,
  UploadDeliverableInput,
} from '@epde/shared';
import {
  createTechnicalInspectionSchema,
  markInspectionPaidSchema,
  scheduleInspectionSchema,
  technicalInspectionFiltersSchema,
  updateInspectionStatusSchema,
  uploadDeliverableSchema,
  UserRole,
} from '@epde/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { TechnicalInspectionsService } from './technical-inspections.service';

@ApiTags('Inspecciones técnicas')
@ApiBearerAuth()
@Controller('technical-inspections')
export class TechnicalInspectionsController {
  constructor(private readonly service: TechnicalInspectionsService) {}

  @Get()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async list(
    @Query(new ZodValidationPipe(technicalInspectionFiltersSchema))
    filters: TechnicalInspectionFiltersInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.list(filters, user);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    const data = await this.service.get(id, user);
    return { data };
  }

  @Post()
  @Roles(UserRole.CLIENT)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createTechnicalInspectionSchema))
    dto: CreateTechnicalInspectionInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.service.create(dto, user);
    return { data, message: 'Inspección técnica solicitada' };
  }

  @Patch(':id/schedule')
  @Roles(UserRole.ADMIN)
  async schedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(scheduleInspectionSchema)) dto: ScheduleInspectionInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.service.schedule(id, dto, user.id);
    return { data, message: 'Inspección agendada' };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateInspectionStatusSchema)) dto: UpdateInspectionStatusInput,
  ) {
    const data = await this.service.updateStatus(id, dto);
    return { data, message: 'Estado actualizado' };
  }

  @Post(':id/deliverable')
  @Roles(UserRole.ADMIN)
  async uploadDeliverable(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(uploadDeliverableSchema)) dto: UploadDeliverableInput,
  ) {
    const data = await this.service.uploadDeliverable(id, dto);
    return { data, message: 'Informe subido' };
  }

  @Post(':id/mark-paid')
  @Roles(UserRole.ADMIN)
  async markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(markInspectionPaidSchema)) dto: MarkInspectionPaidInput,
  ) {
    const data = await this.service.markPaid(id, dto);
    return { data, message: 'Inspección marcada como pagada' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.cancel(id);
    return { data: null, message: 'Inspección cancelada' };
  }
}
