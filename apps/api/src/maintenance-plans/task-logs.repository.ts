import { Injectable } from '@nestjs/common';
import { TaskLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository } from '../common/repositories/base.repository';

@Injectable()
export class TaskLogsRepository extends BaseRepository<TaskLog> {
  constructor(prisma: PrismaService) {
    super(prisma, 'taskLog', false);
  }

  async findByTaskId(taskId: string) {
    return this.model.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { completedAt: 'desc' },
    });
  }
}
