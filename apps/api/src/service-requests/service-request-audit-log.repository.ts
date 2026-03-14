import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Standalone repository — does not extend BaseRepository because audit logs
 * are append-only (no pagination, soft-delete, or update needed). Injects
 * PrismaService directly for simple create/findMany operations on ServiceRequestAuditLog.
 */
@Injectable()
export class ServiceRequestAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAuditLog(
    serviceRequestId: string,
    userId: string,
    action: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) {
    return this.prisma.serviceRequestAuditLog.create({
      data: {
        serviceRequestId,
        userId,
        action,
        before: before as Prisma.InputJsonValue,
        after: after as Prisma.InputJsonValue,
      },
    });
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
