import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAuditLog(
    taskId: string,
    userId: string,
    action: string,
    before: object,
    after: object,
  ) {
    return this.prisma.taskAuditLog.create({
      data: {
        taskId,
        userId,
        action,
        before,
        after,
      },
    });
  }

  async findByTaskId(taskId: string) {
    return this.prisma.taskAuditLog.findMany({
      where: { taskId },
      orderBy: { changedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }
}
