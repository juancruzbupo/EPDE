import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAuditLog(
    taskId: string,
    userId: string,
    action: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) {
    return this.prisma.taskAuditLog.create({
      data: {
        taskId,
        userId,
        action,
        before: before as Prisma.InputJsonValue,
        after: after as Prisma.InputJsonValue,
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
