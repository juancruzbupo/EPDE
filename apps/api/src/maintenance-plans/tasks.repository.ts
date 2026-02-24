import { Injectable } from '@nestjs/common';
import { Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class TasksRepository extends BaseRepository<Task> {
  constructor(prisma: PrismaService) {
    super(prisma, 'task', true);
  }

  async findByPlanId(planId: string) {
    return this.model.findMany({
      where: { maintenancePlanId: planId },
      include: { category: true },
      orderBy: { order: 'asc' },
    });
  }

  async findOverdue() {
    return this.model.findMany({
      where: {
        nextDueDate: { lt: new Date() },
        status: { not: 'COMPLETED' },
      },
      include: {
        category: true,
        maintenancePlan: { include: { property: true } },
      },
      orderBy: { nextDueDate: 'asc' },
    });
  }

  async getMaxOrder(planId: string): Promise<number> {
    const result = await this.model.findFirst({
      where: { maintenancePlanId: planId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return result?.order ?? -1;
  }
}
