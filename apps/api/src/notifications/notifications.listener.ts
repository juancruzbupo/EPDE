import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsListener {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
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
