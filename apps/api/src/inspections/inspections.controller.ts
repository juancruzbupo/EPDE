import type {
  AddInspectionItemInput,
  CreateInspectionInput,
  CurrentUser as CurrentUserPayload,
  UpdateInspectionItemInput,
} from '@epde/shared';
import {
  addInspectionItemSchema,
  createInspectionSchema,
  linkTaskSchema,
  updateInspectionItemSchema,
  updateNotesSchema,
  UserRole,
} from '@epde/shared';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

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
  async addItem(
    @Param('checklistId', ParseUUIDPipe) checklistId: string,
    @Body(new ZodValidationPipe(addInspectionItemSchema))
    body: AddInspectionItemInput,
  ) {
    const data = await this.service.addItem(checklistId, body);
    return { data };
  }

  @Patch('items/:itemId/link-task')
  @Roles(UserRole.ADMIN)
  async linkTask(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body(new ZodValidationPipe(linkTaskSchema)) body: { taskId: string },
  ) {
    const data = await this.service.linkTask(itemId, body.taskId);
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

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return { data: null, message: 'Inspección eliminada' };
  }
}
