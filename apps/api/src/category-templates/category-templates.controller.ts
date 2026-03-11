import type {
  CategoryTemplateFiltersInput,
  CreateCategoryTemplateInput,
  ReorderTemplatesInput,
  UpdateCategoryTemplateInput,
} from '@epde/shared';
import {
  categoryTemplateFiltersSchema,
  createCategoryTemplateSchema,
  reorderTemplatesSchema,
  updateCategoryTemplateSchema,
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

import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CategoryTemplatesService } from './category-templates.service';

@ApiTags('Plantillas de Categorías')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('category-templates')
export class CategoryTemplatesController {
  constructor(private readonly service: CategoryTemplatesService) {}

  @Get()
  async list(
    @Query(new ZodValidationPipe(categoryTemplateFiltersSchema))
    filters: CategoryTemplateFiltersInput,
  ) {
    // Returns PaginatedResult directly — already contains { data, nextCursor, hasMore }
    return this.service.list(filters);
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.getById(id);
    return { data };
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createCategoryTemplateSchema)) dto: CreateCategoryTemplateInput,
  ) {
    const data = await this.service.create(dto);
    return { data, message: 'Categoría template creada' };
  }

  @Patch('reorder/batch')
  async reorder(@Body(new ZodValidationPipe(reorderTemplatesSchema)) dto: ReorderTemplatesInput) {
    return this.service.reorder(dto.ids);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCategoryTemplateSchema)) dto: UpdateCategoryTemplateInput,
  ) {
    const data = await this.service.update(id, dto);
    return { data, message: 'Plantilla de categoría actualizada' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
