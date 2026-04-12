import type {
  AddInspectionItemInput,
  CreateInspectionInput,
  CurrentUser as CurrentUserPayload,
  GeneratePlanFromInspectionInput,
  UpdateInspectionItemInput,
} from '@epde/shared';
import {
  addInspectionItemSchema,
  createInspectionSchema,
  generatePlanFromInspectionSchema,
  updateInspectionItemSchema,
  updateNotesSchema,
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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { InspectionsService } from './inspections.service';

@ApiTags('Inspecciones')
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly service: InspectionsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createInspectionSchema))
    body: CreateInspectionInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.service.create({
      ...body,
      inspectedBy: user.id,
    });
    return { data };
  }

  @Get('property/:propertyId')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  async findByProperty(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const userId = user.role === UserRole.CLIENT ? user.id : undefined;
    const data = await this.service.findByProperty(propertyId, userId);
    return { data };
  }

  @Get('templates/:propertyId')
  @Roles(UserRole.ADMIN)
  async getTemplateItems(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    const data = await this.service.generateItemsFromTemplates(propertyId);
    return { data };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  async findById(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    const userId = user.role === UserRole.CLIENT ? user.id : undefined;
    const data = await this.service.findById(id, userId);
    return { data };
  }

  @Patch('items/:itemId')
  @Roles(UserRole.ADMIN)
  async updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body(new ZodValidationPipe(updateInspectionItemSchema))
    body: UpdateInspectionItemInput,
  ) {
    const data = await this.service.updateItem(itemId, body);
    return { data };
  }

  @Post(':checklistId/items')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async addItem(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Body(new ZodValidationPipe(addInspectionItemSchema))
    body: AddInspectionItemInput,
  ) {
    const data = await this.service.addItem(checklistId, body);
    return { data };
  }

  @Patch(':checklistId/notes')
  @Roles(UserRole.ADMIN)
  async updateNotes(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Body(new ZodValidationPipe(updateNotesSchema)) body: { notes: string },
  ) {
    const data = await this.service.updateNotes(checklistId, body.notes);
    return { data };
  }

  @Post(':checklistId/generate-plan')
  @Throttle({ medium: { limit: 3, ttl: 60_000 } })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async generatePlan(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Body(new ZodValidationPipe(generatePlanFromInspectionSchema))
    body: GeneratePlanFromInspectionInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.service.generatePlanFromInspection(checklistId, body.planName, user.id);
    return { data, message: 'Plan de mantenimiento generado desde inspección' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return { data: null, message: 'Inspección eliminada' };
  }
}
