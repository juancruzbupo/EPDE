import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { type InspectionItemStatus, type PropertySector } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { InspectionsRepository } from './inspections.repository';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly repository: InspectionsRepository,
    private readonly prisma: PrismaService,
  ) {}

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

  async findByProperty(propertyId: string, userId?: string) {
    if (userId) await this.verifyPropertyOwnership(propertyId, userId);
    return this.repository.findByProperty(propertyId);
  }

  async findById(id: string, userId?: string) {
    const checklist = await this.repository.findById(id);
    if (!checklist) throw new NotFoundException('Inspección no encontrada');
    if (userId) await this.verifyPropertyOwnership(checklist.propertyId, userId);
    return checklist;
  }

  async updateItem(
    itemId: string,
    data: { status?: InspectionItemStatus; finding?: string; photoUrl?: string },
  ) {
    await this.verifyItemAccess(itemId);
    return this.repository.updateItem(itemId, data);
  }

  async addItem(
    checklistId: string,
    data: { sector: PropertySector; name: string; description?: string; isCustom?: boolean },
  ) {
    await this.verifyChecklistAccess(checklistId);
    return this.repository.addItem(checklistId, data);
  }

  async linkTask(itemId: string, taskId: string) {
    await this.verifyItemAccess(itemId);
    return this.repository.linkTask(itemId, taskId);
  }

  async updateNotes(checklistId: string, notes: string) {
    await this.verifyChecklistAccess(checklistId);
    return this.repository.updateNotes(checklistId, notes);
  }

  async remove(id: string) {
    await this.verifyChecklistAccess(id);
    return this.repository.softDelete(id);
  }

  // ─── Ownership validation ─────────────────────────────

  private async verifyPropertyOwnership(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { userId: true },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    if (property.userId !== userId) {
      throw new ForbiddenException('No tenés acceso a esta propiedad');
    }
  }

  private async verifyChecklistAccess(checklistId: string) {
    const checklist = await this.prisma.inspectionChecklist.findUnique({
      where: { id: checklistId },
      select: { propertyId: true },
    });
    if (!checklist) throw new NotFoundException('Inspección no encontrada');
  }

  private async verifyItemAccess(itemId: string) {
    const item = await this.prisma.inspectionItem.findUnique({
      where: { id: itemId },
      select: { checklistId: true },
    });
    if (!item) throw new NotFoundException('Item de inspección no encontrado');
  }
}
