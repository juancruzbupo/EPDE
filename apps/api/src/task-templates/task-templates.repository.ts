import { Injectable } from '@nestjs/common';
import { TaskTemplate } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class TaskTemplatesRepository extends BaseRepository<TaskTemplate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'taskTemplate', false);
  }

  async findByCategoryId(categoryId: string) {
    return this.model.findMany({
      where: { categoryId },
      orderBy: { displayOrder: 'asc' },
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
