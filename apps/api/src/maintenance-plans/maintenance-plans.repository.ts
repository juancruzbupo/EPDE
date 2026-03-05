import { Injectable } from '@nestjs/common';
import { MaintenancePlan, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '../common/repositories/base.repository';

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
