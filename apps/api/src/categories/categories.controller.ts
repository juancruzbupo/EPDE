import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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
  @Roles('ADMIN')
  async createCategory(@Body() dto: CreateCategoryDto) {
    const data = await this.categoriesService.createCategory(dto);
    return { data, message: 'Categoría creada' };
  }

  @Patch(':id')
  @Roles('ADMIN')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const data = await this.categoriesService.updateCategory(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
