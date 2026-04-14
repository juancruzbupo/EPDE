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

    // Safety cap — the (type, createdAt) index makes the filter cheap, but we never want
    // this lookup to materialize millions of rows if the notifications table balloons.
    // 10k covers realistic max daily reminders by 2+ orders of magnitude.
    const existing = await this.model.findMany({
      where: {
        type: NotificationType.TASK_REMINDER,
        createdAt: { gte: todayStart },
      },
      select: { data: true },
      take: 10_000,
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

    // Safety cap: a realistic deployment sends far fewer than 5k subscription reminders
    // in a single day; this prevents a runaway scan if the table grows unexpectedly.
    const existing = await this.model.findMany({
      where: {
        type: NotificationType.SYSTEM,
        title: 'Tu suscripción está por vencer',
        createdAt: { gte: todayStart },
      },
      select: { userId: true },
      take: 5_000,
    });

    return new Set(existing.map((n: { userId: string }) => n.userId));
  }

  /**
   * Delete read notifications older than the given date, in bounded batches.
   * A single unconstrained deleteMany on a large Notification table can hold row
   * locks for seconds and block concurrent reads. The batch loop yields between
   * chunks so other transactions can progress.
   */
  async deleteOldRead(olderThan: Date): Promise<number> {
    const BATCH_SIZE = 10_000;
    const BATCH_DELAY_MS = 100;
    let totalDeleted = 0;

    // Hard ceiling to avoid infinite loops in case of clock-skew or pathological input.
    for (let i = 0; i < 200; i++) {
      const rows = await this.prisma.notification.findMany({
        where: { read: true, createdAt: { lt: olderThan } },
        select: { id: true },
        take: BATCH_SIZE,
      });
      if (rows.length === 0) break;

      const { count } = await this.prisma.notification.deleteMany({
        where: { id: { in: rows.map((r) => r.id) } },
      });
      totalDeleted += count;

      // If the fetch came back short of BATCH_SIZE, there's nothing left to do.
      if (rows.length < BATCH_SIZE) break;

      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }

    return totalDeleted;
  }
}
