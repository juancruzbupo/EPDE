import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UsersRepository } from '../common/repositories/users.repository';
import { NotificationsService } from './notifications.service';
import { EmailQueueService } from '../email/email-queue.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersRepository: UsersRepository,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  @OnEvent('budget.created')
  async handleBudgetCreated(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
    propertyId: string;
  }) {
    try {
      const adminIds = await this.usersRepository.findAdminIds();

      await this.notificationsService.createNotifications(
        adminIds.map((adminId) => ({
          userId: adminId,
          type: 'BUDGET_UPDATE' as const,
          title: 'Nuevo presupuesto solicitado',
          message: `Se solicitó un presupuesto: "${payload.title}"`,
          data: { budgetId: payload.budgetId },
        })),
      );
    } catch (error) {
      this.logger.error(
        `Error handling budget.created for ${payload.budgetId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  @OnEvent('budget.quoted')
  async handleBudgetQuoted(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
    totalAmount: number;
  }) {
    try {
      await this.notificationsService.createNotification({
        userId: payload.requesterId,
        type: 'BUDGET_UPDATE',
        title: 'Presupuesto cotizado',
        message: `Tu presupuesto "${payload.title}" fue cotizado por $${payload.totalAmount.toLocaleString('es-AR')}`,
        data: { budgetId: payload.budgetId },
      });

      const requester = await this.usersRepository.findEmailInfo(payload.requesterId);
      if (requester) {
        await this.emailQueueService.enqueueBudgetQuoted(
          requester.email,
          requester.name,
          payload.title,
          payload.totalAmount,
          payload.budgetId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error handling budget.quoted for ${payload.budgetId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
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
    try {
      const statusMessages: Record<string, string> = {
        APPROVED: 'fue aprobado',
        REJECTED: 'fue rechazado',
        IN_PROGRESS: 'está en progreso',
        COMPLETED: 'fue completado',
      };

      const message = statusMessages[payload.newStatus] ?? 'cambió de estado';

      if (['APPROVED', 'REJECTED'].includes(payload.newStatus)) {
        const adminIds = await this.usersRepository.findAdminIds();
        await this.notificationsService.createNotifications(
          adminIds.map((adminId) => ({
            userId: adminId,
            type: 'BUDGET_UPDATE' as const,
            title: 'Actualización de presupuesto',
            message: `El presupuesto "${payload.title}" ${message}`,
            data: { budgetId: payload.budgetId },
          })),
        );
      } else {
        await this.notificationsService.createNotification({
          userId: payload.requesterId,
          type: 'BUDGET_UPDATE',
          title: 'Actualización de presupuesto',
          message: `Tu presupuesto "${payload.title}" ${message}`,
          data: { budgetId: payload.budgetId },
        });

        const requester = await this.usersRepository.findEmailInfo(payload.requesterId);
        if (requester) {
          await this.emailQueueService.enqueueBudgetStatus(
            requester.email,
            requester.name,
            payload.title,
            payload.newStatus,
            payload.budgetId,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error handling budget.statusChanged for ${payload.budgetId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  @OnEvent('service.created')
  async handleServiceCreated(payload: {
    serviceRequestId: string;
    title: string;
    requesterId: string;
    urgency: string;
  }) {
    try {
      const adminIds = await this.usersRepository.findAdminIds();

      await this.notificationsService.createNotifications(
        adminIds.map((adminId) => ({
          userId: adminId,
          type: 'SERVICE_UPDATE' as const,
          title: 'Nueva solicitud de servicio',
          message: `Se creó una solicitud: "${payload.title}" (${payload.urgency})`,
          data: { serviceRequestId: payload.serviceRequestId },
        })),
      );
    } catch (error) {
      this.logger.error(
        `Error handling service.created for ${payload.serviceRequestId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
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
    try {
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
    } catch (error) {
      this.logger.error(
        `Error handling service.statusChanged for ${payload.serviceRequestId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
