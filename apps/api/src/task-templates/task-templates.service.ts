import type { CreateTaskTemplateInput, UpdateTaskTemplateInput } from '@epde/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

import { CategoryTemplatesRepository } from '../category-templates/category-templates.repository';
import { TaskTemplatesRepository } from './task-templates.repository';

@Injectable()
export class TaskTemplatesService {
  constructor(
    private readonly repository: TaskTemplatesRepository,
    private readonly categoryTemplatesRepository: CategoryTemplatesRepository,
  ) {}

  async create(categoryId: string, data: CreateTaskTemplateInput) {
    const category = await this.categoryTemplatesRepository.findById(categoryId);
    if (!category) throw new NotFoundException('Categoría template no encontrada');

    return this.repository.create({
      ...data,
      category: { connect: { id: categoryId } },
    });
  }

  async update(id: string, data: UpdateTaskTemplateInput) {
    const template = await this.repository.findById(id);
    if (!template) throw new NotFoundException('Tarea template no encontrada');
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    const template = await this.repository.findById(id);
    if (!template) throw new NotFoundException('Tarea template no encontrada');
    await this.repository.hardDelete(id);
  }

  async reorder(categoryId: string, ids: string[]) {
    const category = await this.categoryTemplatesRepository.findById(categoryId);
    if (!category) throw new NotFoundException('Categoría template no encontrada');
    await this.repository.reorder(categoryId, ids);
    return { data: null, message: 'Orden actualizado' };
  }
}
