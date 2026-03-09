import { Injectable } from '@nestjs/common';
import { MaintenancePlan, Prisma } from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

const fullDetailsInclude = {
  property: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  tasks: {
    where: { deletedAt: null },
    include: { category: true },
    orderBy: { order: 'asc' as const },
  },
} as const;

export type PlanWithFullDetails = Prisma.MaintenancePlanGetPayload<{
  include: typeof fullDetailsInclude;
}>;

@Injectable()
export class MaintenancePlansRepository extends BaseRepository<MaintenancePlan, 'maintenancePlan'> {
  /**
   * hasSoftDelete: false — MaintenancePlan has no `deletedAt` field in Prisma schema.
   * Lifecycle is managed via PlanStatus (DRAFT → ACTIVE → ARCHIVED) instead of soft-delete.
   */
  constructor(prisma: PrismaService) {
    super(prisma, 'maintenancePlan', false);
  }

  async findAll(userId?: string) {
    return this.model.findMany({
      where: userId ? { property: { userId } } : undefined,
      include: {
        property: {
          select: { id: true, address: true, city: true, userId: true },
        },
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPropertyId(propertyId: string) {
    return this.model.findFirst({
      where: { propertyId },
      include: {
        tasks: {
          where: { deletedAt: null },
          include: { category: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findWithProperty(id: string) {
    return this.model.findFirst({
      where: { id },
      include: { property: { select: { userId: true } } },
    });
  }

  async findWithFullDetails(id: string): Promise<PlanWithFullDetails | null> {
    return this.model.findFirst({
      where: { id },
      include: fullDetailsInclude,
    });
  }
}
