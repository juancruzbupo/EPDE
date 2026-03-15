import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Standalone repository — does not extend BaseRepository because audit logs
 * are append-only (no pagination, soft-delete, or update needed). Injects
 * PrismaService directly for simple create/findMany operations on ServiceRequestAuditLog.
 *
 * `createAuditLog` is fire-and-forget safe — errors are caught and logged
 * internally to prevent unhandled rejections from `void` call sites.
 */
@Injectable()
export class ServiceRequestAuditLogRepository {
  private readonly logger = new Logger(ServiceRequestAuditLogRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAuditLog(
    serviceRequestId: string,
    userId: string,
    action: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) {
    try {
      return await this.prisma.serviceRequestAuditLog.create({
        data: {
          serviceRequestId,
          userId,
          action,
          before: before as Prisma.InputJsonValue,
          after: after as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create SR audit log for ${serviceRequestId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async findByServiceRequestId(serviceRequestId: string) {
    return this.prisma.serviceRequestAuditLog.findMany({
      where: { serviceRequestId },
      orderBy: { changedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }
}
