import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/** Maximum times a failed notification will be retried before it stays permanently failed. */
export const FAILED_NOTIFICATION_MAX_RETRIES = 3;

/**
 * FailedNotificationRepository — append-only DLQ log. Not extending
 * BaseRepository: no cursor pagination (retry scans `createdAt asc` with a
 * time-window filter), no soft-delete (rows are either retried to success
 * or stay permanent), no generic update (only `incrementRetryCount`).
 * BaseRepository's surface would add nothing. See ADR-011 (append-only).
 */
@Injectable()
export class FailedNotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { handler: string; payload: Record<string, unknown>; lastError: string }) {
    return this.prisma.failedNotification.create({
      data: {
        handler: data.handler,
        payload: data.payload as Prisma.InputJsonValue,
        lastError: data.lastError.slice(0, 1000),
      },
    });
  }

  /** Returns records eligible for retry: not yet resolved, retryCount below max, past their nextRetryAt. */
  async findRetryable() {
    return this.prisma.failedNotification.findMany({
      where: {
        resolvedAt: null,
        retryCount: { lt: FAILED_NOTIFICATION_MAX_RETRIES },
        nextRetryAt: { lte: new Date() },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
  }

  async markResolved(id: string) {
    await this.prisma.failedNotification.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
  }

  async incrementRetry(id: string, lastError: string, nextRetryAt: Date) {
    await this.prisma.failedNotification.update({
      where: { id },
      data: {
        retryCount: { increment: 1 },
        lastError: lastError.slice(0, 1000),
        nextRetryAt,
      },
    });
  }

  async countPermanentlyFailed(): Promise<number> {
    return this.prisma.failedNotification.count({
      where: { resolvedAt: null, retryCount: { gte: FAILED_NOTIFICATION_MAX_RETRIES } },
    });
  }
}
