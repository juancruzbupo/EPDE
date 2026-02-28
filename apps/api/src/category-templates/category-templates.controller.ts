import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CategoryTemplatesService } from './category-templates.service';
import {
  createCategoryTemplateSchema,
  updateCategoryTemplateSchema,
  categoryTemplateFiltersSchema,
  reorderTemplatesSchema,
  UserRole,
} from '@epde/shared';
import type {
  CreateCategoryTemplateInput,
  UpdateCategoryTemplateInput,
  CategoryTemplateFiltersInput,
  ReorderTemplatesInput,
} from '@epde/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Category Templates')
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
    return this.service.list(filters);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
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

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategoryTemplateSchema)) dto: UpdateCategoryTemplateInput,
  ) {
    const data = await this.service.update(id, dto);
    return { data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch('reorder/batch')
  async reorder(@Body(new ZodValidationPipe(reorderTemplatesSchema)) dto: ReorderTemplatesInput) {
    return this.service.reorder(dto.ids);
  }
}
