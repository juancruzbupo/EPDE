import { Injectable } from '@nestjs/common';
import {
  type InspectionChecklistStatus,
  type InspectionItemStatus,
  type PropertySector,
} from '@prisma/client';

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

  /** Returns the id of an active (DRAFT, not soft-deleted) checklist for a property,
   *  or null. Used by the create-guard to prevent concurrent DRAFT inspections. */
  async findActiveDraftByProperty(propertyId: string): Promise<string | null> {
    const result = await this.prisma.inspectionChecklist.findFirst({
      where: { propertyId, status: 'DRAFT', deletedAt: null },
      select: { id: true },
    });
    return result?.id ?? null;
  }

  async findByProperty(propertyId: string) {
    // Filter out soft-deleted checklists so cancelled/removed inspections don't
    // resurface in the UI for the property.
    return this.prisma.inspectionChecklist.findMany({
      where: { propertyId, deletedAt: null },
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

  /** Fetches checklist with items filtered by deletedAt — for plan generation.
   *  Also pulls the owner's userId and the property address, used by the post-commit
   *  notification in generatePlanFromInspection without an extra round-trip. */
  async findByIdWithActiveItems(id: string) {
    return this.prisma.inspectionChecklist.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
        property: { select: { userId: true, address: true } },
      },
    });
  }

  async findChecklistProperty(id: string): Promise<string | null> {
    const result = await this.prisma.inspectionChecklist.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    return result?.propertyId ?? null;
  }

  async findChecklistStatus(id: string): Promise<InspectionChecklistStatus | null> {
    const result = await this.prisma.inspectionChecklist.findUnique({
      where: { id },
      select: { status: true },
    });
    return result?.status ?? null;
  }

  async findItemExists(itemId: string): Promise<boolean> {
    const result = await this.prisma.inspectionItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    return result !== null;
  }

  async findItemChecklistStatus(
    itemId: string,
  ): Promise<{ checklistId: string; status: InspectionChecklistStatus } | null> {
    const result = await this.prisma.inspectionItem.findUnique({
      where: { id: itemId },
      select: { checklistId: true, checklist: { select: { status: true } } },
    });
    return result ? { checklistId: result.checklistId, status: result.checklist.status } : null;
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
