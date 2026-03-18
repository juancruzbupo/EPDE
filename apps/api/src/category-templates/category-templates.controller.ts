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
import { Throttle } from '@nestjs/throttler';

import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CategoryTemplatesService } from './category-templates.service';

@ApiTags('Plantillas de Categorías')
@ApiBearerAuth()
@Controller('category-templates')
export class CategoryTemplatesController {
  constructor(private readonly service: CategoryTemplatesService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async list(
    @Query(new ZodValidationPipe(categoryTemplateFiltersSchema))
    filters: CategoryTemplateFiltersInput,
  ) {
    // Returns PaginatedResult directly — already contains { data, nextCursor, hasMore }
    return this.service.list(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.getById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async create(
    @Body(new ZodValidationPipe(createCategoryTemplateSchema)) dto: CreateCategoryTemplateInput,
  ) {
    const data = await this.service.create(dto);
    return { data, message: 'Categoría template creada' };
  }

  @Patch('reorder/batch')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async reorder(@Body(new ZodValidationPipe(reorderTemplatesSchema)) dto: ReorderTemplatesInput) {
    await this.service.reorder(dto.ids);
    return { data: null, message: 'Orden actualizado' };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCategoryTemplateSchema)) dto: UpdateCategoryTemplateInput,
  ) {
    const data = await this.service.update(id, dto);
    return { data, message: 'Plantilla de categoría actualizada' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return { data: null, message: 'Categoría template eliminada' };
  }
}
