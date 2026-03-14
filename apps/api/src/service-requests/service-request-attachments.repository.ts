import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Standalone repository — append-only attachment storage for service requests.
 */
@Injectable()
export class ServiceRequestAttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addAttachments(serviceRequestId: string, attachments: { url: string; fileName: string }[]) {
    await this.prisma.serviceRequestAttachment.createMany({
      data: attachments.map((a) => ({ serviceRequestId, ...a })),
    });
    return this.findByServiceRequestId(serviceRequestId);
  }

  async findByServiceRequestId(serviceRequestId: string) {
    return this.prisma.serviceRequestAttachment.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
