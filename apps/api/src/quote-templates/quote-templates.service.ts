import type { ServiceUser } from '@epde/shared';
import { Injectable, NotFoundException } from '@nestjs/common';

import { QuoteTemplatesRepository } from './quote-templates.repository';

@Injectable()
export class QuoteTemplatesService {
  constructor(private readonly repository: QuoteTemplatesRepository) {}

  async findAll() {
    return this.repository.findAll();
  }

  async findById(id: string) {
    const template = await this.repository.findById(id);
    if (!template) {
      throw new NotFoundException('Plantilla de cotización no encontrada');
    }
    return template;
  }

  async create(
    dto: {
      name: string;
      items: { description: string; quantity: number; unitPrice: number }[];
    },
    user: ServiceUser,
  ) {
    return this.repository.create({
      name: dto.name,
      createdBy: user.id,
      items: dto.items,
    });
  }

  async update(
    id: string,
    dto: {
      name?: string;
      items?: { description: string; quantity: number; unitPrice: number }[];
    },
  ) {
    await this.findById(id);
    return this.repository.update(id, dto);
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repository.delete(id);
    return { data: null, message: 'Plantilla eliminada' };
  }
}
