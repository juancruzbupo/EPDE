import { Injectable } from '@nestjs/common';
import { TaskTemplate } from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskTemplatesRepository extends BaseRepository<TaskTemplate, 'taskTemplate'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'taskTemplate', false);
  }

  async findByCategoryId(categoryId: string) {
    return this.model.findMany({
      where: { categoryId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findByIdsWithGuide(ids: string[]) {
    return this.prisma.taskTemplate.findMany({
      where: { id: { in: ids } },
      select: { id: true, inspectionGuide: true, guideImageUrls: true },
    });
  }

  async findByIdsWithCategory(ids: string[]) {
    return this.prisma.taskTemplate.findMany({
      where: { id: { in: ids } },
      include: { category: true },
    });
  }

  async reorder(categoryId: string, ids: string[]) {
    return this.prisma.$transaction(
      ids.map((id, index) =>
        this.writeModel.update({
          where: { id },
          data: { displayOrder: index },
        }),
      ),
    );
  }
}
