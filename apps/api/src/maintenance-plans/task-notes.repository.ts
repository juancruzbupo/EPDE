import { Injectable } from '@nestjs/common';
import { TaskNote } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class TaskNotesRepository extends BaseRepository<TaskNote> {
  constructor(prisma: PrismaService) {
    super(prisma, 'taskNote', false);
  }

  async findByTaskId(taskId: string) {
    return this.model.findMany({
      where: { taskId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
