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
      include: {
        user: { select: { id: true, name: true, email: true } },
        maintenancePlan: { select: { id: true, name: true, status: true } },
      },
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

  /** Aggregates expenses for a property from TaskLog costs + approved BudgetResponse amounts. */
  async getPropertyExpenses(propertyId: string) {
    const [taskExpenses, budgetExpenses] = await Promise.all([
      // Task completion costs via MaintenancePlan
      this.prisma.taskLog.findMany({
        where: {
          task: { maintenancePlan: { propertyId } },
          cost: { not: null },
        },
        select: {
          completedAt: true,
          cost: true,
          task: { select: { name: true, category: { select: { name: true } } } },
        },
        orderBy: { completedAt: 'desc' },
      }),
      // Approved budget costs
      this.prisma.budgetResponse.findMany({
        where: {
          budgetRequest: {
            propertyId,
            status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
            deletedAt: null,
          },
        },
        select: {
          totalAmount: true,
          respondedAt: true,
          budgetRequest: { select: { title: true } },
        },
        orderBy: { respondedAt: 'desc' },
      }),
    ]);

    const items = [
      ...taskExpenses.map((t) => ({
        date: t.completedAt.toISOString(),
        description: t.task.name,
        category: t.task.category.name,
        amount: Number(t.cost),
        type: 'task' as const,
      })),
      ...budgetExpenses.map((b) => ({
        date: b.respondedAt.toISOString(),
        description: b.budgetRequest.title,
        category: null,
        amount: Number(b.totalAmount),
        type: 'budget' as const,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalCost = items.reduce((sum, item) => sum + item.amount, 0);

    return { totalCost, items };
  }

  /** Aggregates all photos for a property from ServiceRequestPhotos + TaskLog photoUrls. */
  async getPropertyPhotos(propertyId: string) {
    const [servicePhotos, taskPhotos] = await Promise.all([
      this.prisma.serviceRequestPhoto.findMany({
        where: { serviceRequest: { propertyId, deletedAt: null } },
        select: {
          url: true,
          createdAt: true,
          serviceRequest: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.taskLog.findMany({
        where: {
          task: { maintenancePlan: { propertyId } },
          photoUrl: { not: null },
        },
        select: {
          photoUrl: true,
          completedAt: true,
          task: { select: { name: true } },
        },
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    return [
      ...servicePhotos.map((p) => ({
        url: p.url,
        date: p.createdAt.toISOString(),
        description: p.serviceRequest.title,
        source: 'service-request' as const,
      })),
      ...taskPhotos.map((p) => ({
        url: p.photoUrl!,
        date: p.completedAt.toISOString(),
        description: p.task.name,
        source: 'task' as const,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
