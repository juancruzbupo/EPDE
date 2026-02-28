import { Injectable } from '@nestjs/common';
import { CategoryTemplate } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class CategoryTemplatesRepository extends BaseRepository<CategoryTemplate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'categoryTemplate', false);
  }

  async findAllWithTasks() {
    return this.model.findMany({
      include: { tasks: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });
  }

  override async findById(id: string, include?: Record<string, unknown>) {
    return this.model.findUnique({
      where: { id },
      include: include ?? { tasks: { orderBy: { displayOrder: 'asc' } } },
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
