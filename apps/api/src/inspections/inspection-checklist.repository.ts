import { Injectable } from '@nestjs/common';
import type {
  InspectionChecklist,
  InspectionChecklistStatus,
  InspectionItemStatus,
  Prisma,
  PropertySector,
} from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateInspectionChecklistInput {
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
export class InspectionChecklistRepository extends BaseRepository<
  InspectionChecklist,
  'inspectionChecklist',
  Prisma.InspectionChecklistCreateInput,
  Prisma.InspectionChecklistUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'inspectionChecklist', true);
  }

  /**
   * Creates a checklist together with its items in a single write. Uses Prisma's
   * nested `create` so the two rows land atomically without a manual transaction.
   */
  async createWithItems(data: CreateInspectionChecklistInput) {
    return this.writeModel.create({
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

  /**
   * Returns the id of an active (DRAFT, not soft-deleted) checklist for a property,
   * or null. Used by the create-guard to prevent concurrent DRAFT inspections.
   */
  async findActiveDraftByProperty(propertyId: string): Promise<string | null> {
    const result = await this.model.findFirst({
      where: { propertyId, status: 'DRAFT' },
      select: { id: true },
    });
    return result?.id ?? null;
  }

  async findByProperty(propertyId: string) {
    // `model` (soft-delete extension) filters out deletedAt; nested includes need
    // the filter manually, so items are scoped to `deletedAt: null` below.
    return this.model.findMany({
      where: { propertyId },
      include: {
        items: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
        inspector: { select: { id: true, name: true } },
      },
      orderBy: { inspectedAt: 'desc' },
    });
  }

  /**
   * Overrides BaseRepository.findById to include items + inspector, which every
   * caller of the legacy repository expected. Items are filtered by deletedAt
   * because the Prisma soft-delete extension doesn't cascade into includes.
   *
   * Uses `this.prisma.inspectionChecklist.findUnique` directly (not `this.model`)
   * so the return type keeps its full Prisma-inferred shape — `this.model` is
   * typed as `any` in BaseRepository due to dynamic string-keyed access.
   */
  async findByIdWithRelations(id: string) {
    return this.prisma.inspectionChecklist.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
        inspector: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Fetches checklist with its items plus the owner's userId and property address.
   * Used by generatePlanFromInspection to issue the post-commit notification
   * without an extra round-trip.
   */
  async findByIdWithActiveItems(id: string) {
    return this.prisma.inspectionChecklist.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
        property: { select: { userId: true, address: true } },
      },
    });
  }

  async findPropertyId(id: string): Promise<string | null> {
    const result = await this.model.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    return result?.propertyId ?? null;
  }

  async findStatus(id: string): Promise<InspectionChecklistStatus | null> {
    const result = await this.model.findUnique({
      where: { id },
      select: { status: true },
    });
    return result?.status ?? null;
  }

  async updateNotes(checklistId: string, notes: string) {
    return this.update(checklistId, { notes });
  }

  /**
   * Soft-delete a checklist + its items, and detach any plan generated from it.
   * The plan and its tasks remain valid — only the historical origin pointer
   * (MaintenancePlan.sourceInspectionId) is nulled so the UI doesn't try to
   * render traceability back to a now-invisible inspection.
   *
   * Overrides BaseRepository.softDelete because the extension only handles the
   * top-level checklist row; items + plan back-reference need manual handling
   * inside the same transaction.
   *
   * SIEMPRE-rule: these writes set `deletedAt` / `sourceInspectionId` explicitly,
   * so the $transaction-bypasses-soft-delete trap does not apply here.
   */
  override async softDelete(id: string) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.inspectionItem.updateMany({
        where: { checklistId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.inspectionChecklist.update({
        where: { id },
        data: { deletedAt: now },
      }),
      // eslint-disable-next-line local/no-tx-without-soft-delete-filter -- nulling sourceInspectionId is idempotent regardless of plan deletedAt: soft-deleted plans with a stale pointer still get cleaned up harmlessly.
      this.prisma.maintenancePlan.updateMany({
        where: { sourceInspectionId: id },
        data: { sourceInspectionId: null },
      }),
    ]);
    this.requestCache?.invalidate('inspectionChecklist', id);
    // Legacy callers ignored the return value; keep `void` for clarity.
    return undefined as unknown as InspectionChecklist;
  }
}
