import { Injectable, NotFoundException } from '@nestjs/common';
import { type InspectionItemStatus, type PropertySector } from '@prisma/client';

import { InspectionsRepository } from './inspections.repository';

@Injectable()
export class InspectionsService {
  constructor(private readonly repository: InspectionsRepository) {}

  async create(data: {
    propertyId: string;
    inspectedBy: string;
    notes?: string;
    items: {
      sector: PropertySector;
      name: string;
      description?: string;
      status?: InspectionItemStatus;
      finding?: string;
      photoUrl?: string;
      isCustom?: boolean;
      order?: number;
    }[];
  }) {
    return this.repository.create(data);
  }

  async findByProperty(propertyId: string) {
    return this.repository.findByProperty(propertyId);
  }

  async findById(id: string) {
    const checklist = await this.repository.findById(id);
    if (!checklist) throw new NotFoundException('Inspección no encontrada');
    return checklist;
  }

  async updateItem(
    itemId: string,
    data: { status?: InspectionItemStatus; finding?: string; photoUrl?: string },
  ) {
    return this.repository.updateItem(itemId, data);
  }

  async addItem(
    checklistId: string,
    data: { sector: PropertySector; name: string; description?: string; isCustom?: boolean },
  ) {
    return this.repository.addItem(checklistId, data);
  }

  async linkTask(itemId: string, taskId: string) {
    return this.repository.linkTask(itemId, taskId);
  }

  async updateNotes(checklistId: string, notes: string) {
    return this.repository.updateNotes(checklistId, notes);
  }
}
