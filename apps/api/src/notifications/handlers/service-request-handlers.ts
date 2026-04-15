import { ServiceStatus, type ServiceUrgency } from '@epde/shared';
import { Injectable } from '@nestjs/common';

import { HandlerContext } from '../handler-context.service';

/**
 * Notification handlers for the ServiceRequest domain: request creation,
 * status transitions (linear state machine), and new comments.
 */
@Injectable()
export class ServiceRequestHandlers {
  constructor(private readonly ctx: HandlerContext) {}

  async onServiceCreated(payload: {
    serviceRequestId: string;
    title: string;
    requesterId: string;
    urgency: ServiceUrgency;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleServiceCreated',
      payload as Record<string, unknown>,
      async () => {
        const adminIds = await this.ctx.usersRepository.findAdminIds();

        await this.ctx.notificationQueueService.enqueueBatch(
          adminIds.map((adminId) => ({
            userId: adminId,
            type: 'SERVICE_UPDATE' as const,
            title: 'Nueva solicitud de servicio',
            message: `Se creó una solicitud: "${payload.title}" (${payload.urgency})`,
            data: { serviceRequestId: payload.serviceRequestId },
          })),
        );
      },
    );
  }

  async onServiceStatusChanged(payload: {
    serviceRequestId: string;
    title: string;
    oldStatus: ServiceStatus;
    newStatus: ServiceStatus;
    requesterId: string;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleServiceStatusChanged',
      payload as Record<string, unknown>,
      async () => {
        const statusMessages: Partial<Record<ServiceStatus, string>> = {
          IN_REVIEW: 'está en revisión',
          IN_PROGRESS: 'está en progreso',
          RESOLVED: 'fue resuelta',
          CLOSED: 'fue cerrada',
        };

        const message = statusMessages[payload.newStatus] ?? 'cambió de estado';

        await this.ctx.notificationQueueService.enqueue({
          userId: payload.requesterId,
          type: 'SERVICE_UPDATE',
          title: 'Actualización de servicio',
          message: `Tu solicitud "${payload.title}" ${message}`,
          data: { serviceRequestId: payload.serviceRequestId },
        });
      },
    );
  }

  async onServiceCommentAdded(payload: {
    serviceRequestId: string;
    title: string;
    commentAuthorId: string;
    requesterId: string;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleServiceCommentAdded',
      payload as Record<string, unknown>,
      async () => {
        const adminIds = await this.ctx.usersRepository.findAdminIds();
        const isAdminComment = adminIds.includes(payload.commentAuthorId);
        const author = await this.ctx.usersRepository.findEmailInfo(payload.commentAuthorId);
        const authorName = author?.name ?? 'Un usuario';

        const recipients = isAdminComment ? [payload.requesterId] : adminIds;

        const notifTitle = 'Nuevo comentario en solicitud';
        const notifMsg = `${authorName} comentó en "${payload.title}"`;

        await this.ctx.notificationQueueService.enqueueBatch(
          recipients.map((userId) => ({
            userId,
            type: 'SERVICE_UPDATE' as const,
            title: notifTitle,
            message: notifMsg,
            data: { serviceRequestId: payload.serviceRequestId },
          })),
        );

        this.ctx.sendPush(recipients, notifTitle, notifMsg, {
          serviceRequestId: payload.serviceRequestId,
        });
      },
    );
  }
}
