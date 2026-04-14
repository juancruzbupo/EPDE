import { Injectable } from '@nestjs/common';
import type {
  InspectionChecklistStatus,
  InspectionItem,
  InspectionItemStatus,
  Prisma,
  PropertySector,
} from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InspectionItemRepository extends BaseRepository<
  InspectionItem,
  'inspectionItem',
  Prisma.InspectionItemCreateInput,
  Prisma.InspectionItemUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'inspectionItem', true);
  }

  async updateEvaluation(
    itemId: string,
    data: { status?: InspectionItemStatus; finding?: string; photoUrl?: string },
  ) {
    return this.update(itemId, {
      ...(data.status && { status: data.status }),
      ...(data.finding !== undefined && { finding: data.finding }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
    });
  }

  /**
   * Adds a custom item to an existing checklist. Computes the next `order` by
   * aggregating the max of existing items so the new row sorts last.
   */
  async addToChecklist(
    checklistId: string,
    data: { sector: PropertySector; name: string; description?: string; isCustom?: boolean },
  ) {
    const maxOrder = await this.model.aggregate({
      where: { checklistId },
      _max: { order: true },
    });

    return this.writeModel.create({
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

  async exists(itemId: string): Promise<boolean> {
    const result = await this.model.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    return result !== null;
  }

  /**
   * Returns the parent checklist id and status in a single query — used by
   * `verifyItemAccessAndEditable` in InspectionsService to block edits on
   * items belonging to a locked (COMPLETED) checklist.
   */
  async findChecklistStatus(
    itemId: string,
  ): Promise<{ checklistId: string; status: InspectionChecklistStatus } | null> {
    const result = await this.model.findUnique({
      where: { id: itemId },
      select: { checklistId: true, checklist: { select: { status: true } } },
    });
    return result ? { checklistId: result.checklistId, status: result.checklist.status } : null;
  }
}
