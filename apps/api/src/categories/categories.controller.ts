import type { CreateCategoryInput, UpdateCategoryInput } from '@epde/shared';
import { createCategorySchema, updateCategorySchema, UserRole } from '@epde/shared';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CategoriesService } from './categories.service';

@ApiTags('Categorias')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async findAll() {
    const data = await this.categoriesService.findAll();
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async createCategory(
    @Body(new ZodValidationPipe(createCategorySchema)) dto: CreateCategoryInput,
  ) {
    const data = await this.categoriesService.createCategory(dto);
    return { data, message: 'Categoría creada' };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) dto: UpdateCategoryInput,
  ) {
    const data = await this.categoriesService.updateCategory(id, dto);
    return { data, message: 'Categoría actualizada' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.deleteCategory(id);
    return { data: null, message: 'Categoría eliminada' };
  }
}
