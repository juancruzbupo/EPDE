import { Injectable } from '@nestjs/common';
import { Property, PropertyType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';

@Injectable()
export class PropertiesRepository extends BaseRepository<Property> {
  constructor(prisma: PrismaService) {
    super(prisma, 'property', true);
  }

  async findProperties(params: {
    cursor?: string;
    take?: number;
    search?: string;
    userId?: string;
    city?: string;
    type?: string;
  }): Promise<PaginatedResult<Property>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

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
          status: 'DRAFT',
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

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { userId },
      include: { maintenancePlan: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
