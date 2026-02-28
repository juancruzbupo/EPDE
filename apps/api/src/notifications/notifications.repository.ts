import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository, PaginatedResult } from '../common/repositories/base.repository';

function isTaskReminderData(data: unknown): data is { taskId: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'taskId' in data &&
    typeof (data as Record<string, unknown>).taskId === 'string'
  );
}

@Injectable()
export class NotificationsRepository extends BaseRepository<Notification> {
  constructor(prisma: PrismaService) {
    super(prisma, 'notification', false);
  }

  async findByUser(
    userId: string,
    cursor?: string,
    take?: number,
  ): Promise<PaginatedResult<Notification>> {
    return this.findMany({
      where: { userId },
      cursor,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.count({ userId, read: false });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
  }

  async createMany(
    notifications: {
      userId: string;
      type: 'TASK_REMINDER' | 'BUDGET_UPDATE' | 'SERVICE_UPDATE' | 'SYSTEM';
      title: string;
      message: string;
      data?: Record<string, unknown> | null;
    }[],
  ): Promise<number> {
    if (notifications.length === 0) return 0;
    const result = await this.prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        data: (n.data as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      })),
    });
    return result.count;
  }

  async findTodayReminderTaskIds(): Promise<Set<string>> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existing = await this.prisma.notification.findMany({
      where: {
        type: 'TASK_REMINDER',
        createdAt: { gte: todayStart },
      },
      select: { data: true },
    });

    return new Set(
      existing
        .filter((n) => isTaskReminderData(n.data))
        .map((n) => (n.data as { taskId: string }).taskId),
    );
  }
}
