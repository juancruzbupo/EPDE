import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class CategoriesRepository extends BaseRepository<Category> {
  constructor(prisma: PrismaService) {
    super(prisma, 'category', true);
  }

  async findAll(): Promise<Category[]> {
    return this.model.findMany({ orderBy: { order: 'asc' } });
  }

  async findByName(name: string): Promise<Category | null> {
    return this.model.findFirst({ where: { name } });
  }

  async hasReferencingTasks(id: string): Promise<boolean> {
    const count = await this.prisma.softDelete.task.count({ where: { categoryId: id } });
    return count > 0;
  }
}
