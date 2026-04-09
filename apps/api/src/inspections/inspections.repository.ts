import { Injectable } from '@nestjs/common';
import { type InspectionItemStatus, type PropertySector } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

interface CreateInspectionData {
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
    taskTemplateId?: string;
    inspectionGuide?: string;
    guideImageUrls?: string[];
    isCustom?: boolean;
    order?: number;
  }[];
}

@Injectable()
export class InspectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInspectionData) {
    return this.prisma.inspectionChecklist.create({
      data: {
        propertyId: data.propertyId,
        inspectedBy: data.inspectedBy,
        notes: data.notes,
        items: {
          create: data.items.map((item, index) => ({
            sector: item.sector,
            name: item.name,
            description: item.description,
            status: item.status ?? 'PENDING',
            finding: item.finding,
            photoUrl: item.photoUrl,
            taskTemplateId: item.taskTemplateId,
            inspectionGuide: item.inspectionGuide,
            guideImageUrls: item.guideImageUrls ?? [],
            isCustom: item.isCustom ?? false,
            order: item.order ?? index,
          })),
        },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  async findByProperty(propertyId: string) {
    return this.prisma.inspectionChecklist.findMany({
      where: { propertyId },
      include: {
        items: { orderBy: { order: 'asc' } },
        inspector: { select: { id: true, name: true } },
      },
      orderBy: { inspectedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.inspectionChecklist.findUnique({
      where: { id },
      include: {
        items: { orderBy: { order: 'asc' } },
        inspector: { select: { id: true, name: true } },
      },
    });
  }

  async updateItem(
    itemId: string,
    data: { status?: InspectionItemStatus; finding?: string; photoUrl?: string },
  ) {
    return this.prisma.inspectionItem.update({
      where: { id: itemId },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.finding !== undefined && { finding: data.finding }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      },
    });
  }

  async addItem(
    checklistId: string,
    data: { sector: PropertySector; name: string; description?: string; isCustom?: boolean },
  ) {
    const maxOrder = await this.prisma.inspectionItem.aggregate({
      where: { checklistId },
      _max: { order: true },
    });

    return this.prisma.inspectionItem.create({
      data: {
        checklistId,
        sector: data.sector,
        name: data.name,
        description: data.description,
        isCustom: data.isCustom ?? true,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });
  }

  async updateNotes(checklistId: string, notes: string) {
    return this.prisma.inspectionChecklist.update({
      where: { id: checklistId },
      data: { notes },
    });
  }

  async softDelete(id: string) {
    const now = new Date();
    return this.prisma.$transaction([
      this.prisma.inspectionItem.updateMany({
        where: { checklistId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.inspectionChecklist.update({
        where: { id },
        data: { deletedAt: now },
      }),
    ]);
  }
}
