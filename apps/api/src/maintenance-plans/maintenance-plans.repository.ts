import { Injectable } from '@nestjs/common';
import { MaintenancePlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class MaintenancePlansRepository extends BaseRepository<MaintenancePlan> {
  constructor(prisma: PrismaService) {
    super(prisma, 'maintenancePlan', false);
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

  async findWithFullDetails(id: string) {
    return this.model.findFirst({
      where: { id },
      include: {
        property: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: {
          where: { deletedAt: null },
          include: { category: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
