import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async findAll() {
    return this.categoriesRepository.findAll();
  }

  async getCategory(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.categoriesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
    return this.categoriesRepository.create(dto);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    if (dto.name) {
      const existing = await this.categoriesRepository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
    }

    return this.categoriesRepository.update(id, dto);
  }

  async deleteCategory(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const hasRefs = await this.categoriesRepository.hasReferencingTasks(id);
    if (hasRefs) {
      throw new BadRequestException(
        'No se puede eliminar una categoría que tiene tareas asociadas',
      );
    }

    await this.categoriesRepository.hardDelete(id);
    return { message: 'Categoría eliminada' };
  }
}
