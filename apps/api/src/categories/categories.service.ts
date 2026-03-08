import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryHasReferencingTasksError } from '../common/exceptions/domain.exceptions';
import { CategoriesRepository } from './categories.repository';
import type { CreateCategoryInput, UpdateCategoryInput } from '@epde/shared';

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

  async createCategory(dto: CreateCategoryInput) {
    const existing = await this.categoriesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
    return this.categoriesRepository.create(dto);
  }

  async updateCategory(id: string, dto: UpdateCategoryInput) {
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

    try {
      const hasRefs = await this.categoriesRepository.hasReferencingTasks(id);
      if (hasRefs) {
        throw new CategoryHasReferencingTasksError();
      }

      await this.categoriesRepository.hardDelete(id);
      return { data: null, message: 'Categoría eliminada' };
    } catch (error) {
      if (error instanceof CategoryHasReferencingTasksError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
