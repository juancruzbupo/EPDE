import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @OnEvent('budget.created')
  async handleBudgetCreated(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
    propertyId: string;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', deletedAt: null },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationsService.createNotification({
        userId: admin.id,
        type: 'BUDGET_UPDATE',
        title: 'Nuevo presupuesto solicitado',
        message: `Se solicitó un presupuesto: "${payload.title}"`,
        data: { budgetId: payload.budgetId },
      });
    }
  }

  @OnEvent('budget.quoted')
  async handleBudgetQuoted(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
    totalAmount: number;
  }) {
    await this.notificationsService.createNotification({
      userId: payload.requesterId,
      type: 'BUDGET_UPDATE',
      title: 'Presupuesto cotizado',
      message: `Tu presupuesto "${payload.title}" fue cotizado por $${payload.totalAmount.toLocaleString('es-AR')}`,
      data: { budgetId: payload.budgetId },
    });

    // Send email to requester
    const requester = await this.prisma.user.findUnique({
      where: { id: payload.requesterId },
      select: { email: true, name: true },
    });
    if (requester) {
      await this.emailService
        .sendBudgetQuotedEmail(
          requester.email,
          requester.name,
          payload.title,
          payload.totalAmount,
          payload.budgetId,
        )
        .catch((err) => this.logger.error(`Error enviando email de cotización: ${err.message}`));
    }
  }

  @OnEvent('budget.statusChanged')
  async handleBudgetStatusChanged(payload: {
    budgetId: string;
    title: string;
    oldStatus: string;
    newStatus: string;
    requesterId: string;
  }) {
    const statusMessages: Record<string, string> = {
      APPROVED: 'fue aprobado',
      REJECTED: 'fue rechazado',
      IN_PROGRESS: 'está en progreso',
      COMPLETED: 'fue completado',
    };

    const message = statusMessages[payload.newStatus] ?? 'cambió de estado';

    if (['APPROVED', 'REJECTED'].includes(payload.newStatus)) {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN', deletedAt: null },
        select: { id: true },
      });
      for (const admin of admins) {
        await this.notificationsService.createNotification({
          userId: admin.id,
          type: 'BUDGET_UPDATE',
          title: 'Actualización de presupuesto',
          message: `El presupuesto "${payload.title}" ${message}`,
          data: { budgetId: payload.budgetId },
        });
      }
    } else {
      await this.notificationsService.createNotification({
        userId: payload.requesterId,
        type: 'BUDGET_UPDATE',
        title: 'Actualización de presupuesto',
        message: `Tu presupuesto "${payload.title}" ${message}`,
        data: { budgetId: payload.budgetId },
      });

      // Send email to requester for IN_PROGRESS/COMPLETED
      const requester = await this.prisma.user.findUnique({
        where: { id: payload.requesterId },
        select: { email: true, name: true },
      });
      if (requester) {
        await this.emailService
          .sendBudgetStatusEmail(
            requester.email,
            requester.name,
            payload.title,
            payload.newStatus,
            payload.budgetId,
          )
          .catch((err) => this.logger.error(`Error enviando email de estado: ${err.message}`));
      }
    }
  }

  @OnEvent('service.created')
  async handleServiceCreated(payload: {
    serviceRequestId: string;
    title: string;
    requesterId: string;
    urgency: string;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', deletedAt: null },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationsService.createNotification({
        userId: admin.id,
        type: 'SERVICE_UPDATE',
        title: 'Nueva solicitud de servicio',
        message: `Se creó una solicitud: "${payload.title}" (${payload.urgency})`,
        data: { serviceRequestId: payload.serviceRequestId },
      });
    }
  }

  @OnEvent('service.statusChanged')
  async handleServiceStatusChanged(payload: {
    serviceRequestId: string;
    title: string;
    oldStatus: string;
    newStatus: string;
    requesterId: string;
  }) {
    const statusMessages: Record<string, string> = {
      IN_REVIEW: 'está en revisión',
      IN_PROGRESS: 'está en progreso',
      RESOLVED: 'fue resuelta',
      CLOSED: 'fue cerrada',
    };

    const message = statusMessages[payload.newStatus] ?? 'cambió de estado';

    await this.notificationsService.createNotification({
      userId: payload.requesterId,
      type: 'SERVICE_UPDATE',
      title: 'Actualización de servicio',
      message: `Tu solicitud "${payload.title}" ${message}`,
      data: { serviceRequestId: payload.serviceRequestId },
    });
  }
}
