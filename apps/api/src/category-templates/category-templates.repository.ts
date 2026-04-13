import { Injectable } from '@nestjs/common';
import { CategoryTemplate } from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryTemplatesRepository extends BaseRepository<
  CategoryTemplate,
  'categoryTemplate'
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'categoryTemplate', false);
  }

  async findByIdWithTasks(id: string) {
    return this.prisma.categoryTemplate.findUnique({
      where: { id },
      include: { tasks: { orderBy: { displayOrder: 'asc' }, take: 100 } },
    });
  }

  async findAllWithTasks() {
    return this.prisma.categoryTemplate.findMany({
      include: { tasks: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findByName(name: string): Promise<CategoryTemplate | null> {
    return this.model.findFirst({ where: { name } });
  }

  async reorder(ids: string[]) {
    return this.prisma.$transaction(
      ids.map((id, index) =>
        this.writeModel.update({ where: { id }, data: { displayOrder: index } }),
      ),
    );
  }
}
