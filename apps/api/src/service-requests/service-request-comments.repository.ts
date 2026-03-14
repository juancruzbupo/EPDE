import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Standalone repository — append-only comment storage for service requests.
 */
@Injectable()
export class ServiceRequestCommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createComment(serviceRequestId: string, userId: string, content: string) {
    return this.prisma.serviceRequestComment.create({
      data: { serviceRequestId, userId, content },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async findByServiceRequestId(serviceRequestId: string) {
    return this.prisma.serviceRequestComment.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true } } },
    });
  }
}
