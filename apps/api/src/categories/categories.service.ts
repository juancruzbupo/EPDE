import type { CreateCategoryInput, UpdateCategoryInput } from '@epde/shared';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CategoryTemplatesRepository } from '../category-templates/category-templates.repository';
import { CategoryHasReferencingTasksError } from '../common/exceptions/domain.exceptions';
import { CategoriesRepository } from './categories.repository';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly categoryTemplatesRepository: CategoryTemplatesRepository,
  ) {}

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

    if (dto.categoryTemplateId) {
      const template = await this.categoryTemplatesRepository.findById(dto.categoryTemplateId);
      if (!template) {
        throw new NotFoundException('Plantilla de categoría no encontrada');
      }
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

    if (dto.categoryTemplateId) {
      const template = await this.categoryTemplatesRepository.findById(dto.categoryTemplateId);
      if (!template) {
        throw new NotFoundException('Plantilla de categoría no encontrada');
      }
    }

    return this.categoriesRepository.update(id, dto);
  }

  /**
   * Deletes a category if it has no referencing tasks.
   *
   * TOCTOU note: there is a race between hasReferencingTasks() and hardDelete().
   * This is acceptable because: (1) admin-only operation with low concurrency,
   * (2) the DB FK constraint on task.categoryId will reject the delete if a task
   * is created between the check and the delete, so data integrity is preserved.
   */
  async deleteCategory(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const hasRefs = await this.categoriesRepository.hasReferencingTasks(id);
    if (hasRefs) {
      throw new BadRequestException(new CategoryHasReferencingTasksError().message);
    }

    await this.categoriesRepository.hardDelete(id);
  }
}
