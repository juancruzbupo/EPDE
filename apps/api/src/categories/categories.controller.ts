import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { createCategorySchema, updateCategorySchema, UserRole } from '@epde/shared';
import type { CreateCategoryInput, UpdateCategoryInput } from '@epde/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Categorias')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    const data = await this.categoriesService.findAll();
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async createCategory(
    @Body(new ZodValidationPipe(createCategorySchema)) dto: CreateCategoryInput,
  ) {
    const data = await this.categoriesService.createCategory(dto);
    return { data, message: 'Categoría creada' };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) dto: UpdateCategoryInput,
  ) {
    const data = await this.categoriesService.updateCategory(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
