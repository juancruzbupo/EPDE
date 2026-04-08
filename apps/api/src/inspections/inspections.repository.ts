import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InspectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    propertyId: string;
    inspectedBy: string;
    notes?: string;
    items: {
      sector: string;
      name: string;
      description?: string;
      status?: string;
      finding?: string;
      photoUrl?: string;
      isCustom?: boolean;
      order?: number;
    }[];
  }) {
    return this.prisma.inspectionChecklist.create({
      data: {
        propertyId: data.propertyId,
        inspectedBy: data.inspectedBy,
        notes: data.notes,
        items: {
          create: data.items.map((item, index) => ({
            sector: item.sector as never,
            name: item.name,
            description: item.description,
            status: (item.status as never) ?? 'PENDING',
            finding: item.finding,
            photoUrl: item.photoUrl,
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

  async updateItem(itemId: string, data: { status?: string; finding?: string; photoUrl?: string }) {
    return this.prisma.inspectionItem.update({
      where: { id: itemId },
      data: {
        ...(data.status && { status: data.status as never }),
        ...(data.finding !== undefined && { finding: data.finding }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      },
    });
  }

  async addItem(
    checklistId: string,
    data: { sector: string; name: string; description?: string; isCustom?: boolean },
  ) {
    const maxOrder = await this.prisma.inspectionItem.aggregate({
      where: { checklistId },
      _max: { order: true },
    });

    return this.prisma.inspectionItem.create({
      data: {
        checklistId,
        sector: data.sector as never,
        name: data.name,
        description: data.description,
        isCustom: data.isCustom ?? true,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });
  }

  async linkTask(itemId: string, taskId: string) {
    return this.prisma.inspectionItem.update({
      where: { id: itemId },
      data: { taskId },
    });
  }

  async updateNotes(checklistId: string, notes: string) {
    return this.prisma.inspectionChecklist.update({
      where: { id: checklistId },
      data: { notes },
    });
  }
}
