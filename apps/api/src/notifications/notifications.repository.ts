import { NotificationType } from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { Notification, Prisma } from '@prisma/client';

import { BaseRepository, PaginatedResult } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

function isTaskReminderData(data: unknown): data is { taskId: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'taskId' in data &&
    typeof (data as Record<string, unknown>).taskId === 'string'
  );
}

@Injectable()
export class NotificationsRepository extends BaseRepository<Notification, 'notification'> {
  constructor(prisma: PrismaService) {
    // hasSoftDelete=false: Notifications are ephemeral data — no audit trail required.
    // Old read notifications are periodically hard-deleted by NotificationCleanupService
    // (scheduler, every Sunday 03:00 UTC) to prevent table bloat. See deleteOldRead().
    // If you need to add deletedAt to Notification in the future, switch this to true
    // AND add a Prisma migration to create the deletedAt column.
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
      count: false,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.count({ userId, read: false });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.writeModel.update({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.writeModel.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
  }

  async createMany(
    notifications: {
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown> | null;
    }[],
  ): Promise<number> {
    if (notifications.length === 0) return 0;
    const result = await this.writeModel.createMany({
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
    // Argentina is UTC-3 (no DST). Calculate midnight AR in UTC.
    const AR_OFFSET_MS = 3 * 60 * 60 * 1000;
    const nowAR = new Date(Date.now() - AR_OFFSET_MS);
    nowAR.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(nowAR.getTime() + AR_OFFSET_MS);

    const existing = await this.model.findMany({
      where: {
        type: NotificationType.TASK_REMINDER,
        createdAt: { gte: todayStart },
      },
      select: { data: true },
    });

    return new Set(
      existing
        .filter((n: { data: unknown }) => isTaskReminderData(n.data))
        .map((n: { data: unknown }) => (n.data as { taskId: string }).taskId),
    );
  }

  /** Returns user IDs that already received a SYSTEM subscription reminder today. */
  async findTodaySubscriptionReminderUserIds(): Promise<Set<string>> {
    const AR_OFFSET_MS = 3 * 60 * 60 * 1000;
    const nowAR = new Date(Date.now() - AR_OFFSET_MS);
    nowAR.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(nowAR.getTime() + AR_OFFSET_MS);

    const existing = await this.model.findMany({
      where: {
        type: NotificationType.SYSTEM,
        title: 'Tu suscripción está por vencer',
        createdAt: { gte: todayStart },
      },
      select: { userId: true },
    });

    return new Set(existing.map((n: { userId: string }) => n.userId));
  }

  /** Delete read notifications older than the given date. Returns count deleted. */
  async deleteOldRead(olderThan: Date): Promise<number> {
    const { count } = await this.prisma.notification.deleteMany({
      where: { read: true, createdAt: { lt: olderThan } },
    });
    return count;
  }
}
