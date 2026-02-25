import { Injectable } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BaseRepository, PaginatedResult } from '../common/repositories/base.repository';

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
        .filter((n) => n.data && typeof n.data === 'object')
        .map((n) => (n.data as Record<string, unknown>).taskId as string)
        .filter(Boolean),
    );
  }
}
