import { Injectable } from '@nestjs/common';
import { PlanStatus, Prisma, Property, PropertyType } from '@prisma/client';

import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertiesRepository extends BaseRepository<Property, 'property'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'property', true);
  }

  async findProperties(params: {
    cursor?: string;
    take?: number;
    search?: string;
    userId?: string;
    city?: string;
    type?: PropertyType;
  }): Promise<PaginatedResult<Property>> {
    const where: Prisma.PropertyWhereInput = {};

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.city) {
      where.city = { contains: params.city, mode: 'insensitive' };
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.search) {
      where.OR = [
        { address: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const findParams: FindManyParams = {
      cursor: params.cursor,
      take: params.take,
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
    };

    return this.findMany(findParams);
  }

  async findWithPlan(id: string) {
    return this.model.findFirst({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        maintenancePlan: {
          include: { tasks: { include: { category: true }, orderBy: { order: 'asc' } } },
        },
      },
    });
  }

  async findOwnership(id: string): Promise<{ id: string; userId: string } | null> {
    return this.model.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }

  async createWithPlan(data: {
    userId: string;
    address: string;
    city: string;
    type: PropertyType;
    yearBuilt?: number;
    squareMeters?: number;
    createdBy?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const property = await tx.property.create({ data });

      await tx.maintenancePlan.create({
        data: {
          propertyId: property.id,
          name: `Plan de Mantenimiento — ${property.address}`,
          status: PlanStatus.DRAFT,
          createdBy: data.createdBy,
        },
      });

      return tx.property.findUnique({
        where: { id: property.id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          maintenancePlan: true,
        },
      });
    });
  }

  /**
   * Soft-delete property and cascade to active budgets + service requests.
   * onDelete: Cascade only applies to hard deletes; soft-delete requires explicit cascade.
   */
  async softDeleteWithCascade(id: string) {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.property.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.budgetRequest.updateMany({
        where: { propertyId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.serviceRequest.updateMany({
        where: { propertyId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
    ]);
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      include: { maintenancePlan: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
