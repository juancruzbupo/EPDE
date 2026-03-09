import type {
  CategoryTemplateFiltersInput,
  CreateCategoryTemplateInput,
  UpdateCategoryTemplateInput,
} from '@epde/shared';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { CategoryTemplatesRepository } from './category-templates.repository';

@Injectable()
export class CategoryTemplatesService {
  constructor(private readonly repository: CategoryTemplatesRepository) {}

  async list(filters: CategoryTemplateFiltersInput) {
    return this.repository.findMany({
      cursor: filters.cursor,
      take: filters.take,
      include: { tasks: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getById(id: string) {
    const template = await this.repository.findByIdWithTasks(id);
    if (!template) throw new NotFoundException('Categoría template no encontrada');
    return template;
  }

  async create(data: CreateCategoryTemplateInput) {
    const existing = await this.repository.findByName(data.name);
    if (existing) throw new ConflictException('Ya existe una categoría template con ese nombre');
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateCategoryTemplateInput) {
    await this.getById(id);
    if (data.name) {
      const existing = await this.repository.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe una categoría template con ese nombre');
      }
    }
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repository.hardDelete(id);
    return { data: null, message: 'Categoría template eliminada' };
  }

  async reorder(ids: string[]) {
    await this.repository.reorder(ids);
    return { data: null, message: 'Orden actualizado' };
  }
}
