import { Injectable, Logger } from '@nestjs/common';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { EmailQueueService } from '../email/email-queue.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationsService } from './notifications.service';

/**
 * Centralized extension point for domain side-effects (notifications, emails, etc.).
 *
 * ## Architecture rule
 * Domain services (BudgetsService, ServiceRequestsService, etc.) MUST inject THIS service
 * instead of NotificationQueueService or EmailQueueService directly.
 * Adding a new side-effect = add a method here — domain services never change.
 *
 * ## Usage pattern (fire-and-forget)
 * ```typescript
 * void this.notificationsHandler.handleBudgetCreated({ budgetId, title, requesterId, propertyId });
 * ```
 * Each method catches its own errors and logs them, so callers never need try/catch.
 *
 * ## Adding a new side-effect
 * 1. Add a `handleXxxYyy(payload: { ... }): Promise<void>` method here.
 * 2. Inject `NotificationsHandlerService` in the target domain service.
 * 3. Call `void this.notificationsHandler.handleXxxYyy(...)` after the DB write.
 */
@Injectable()
export class NotificationsHandlerService {
  private readonly logger = new Logger(NotificationsHandlerService.name);

  constructor(
    private readonly notificationQueueService: NotificationQueueService,
    private readonly notificationsService: NotificationsService,
    private readonly usersRepository: UserLookupRepository,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async handleBudgetCreated(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
    propertyId: string;
  }): Promise<void> {
    try {
      const adminIds = await this.usersRepository.findAdminIds();

      await this.notificationQueueService.enqueueBatch(
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

  async handleBudgetQuoted(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
    totalAmount: number;
  }): Promise<void> {
    try {
      await this.notificationQueueService.enqueue({
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

  async handleBudgetStatusChanged(payload: {
    budgetId: string;
    title: string;
    oldStatus: string;
    newStatus: string;
    requesterId: string;
  }): Promise<void> {
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
        await this.notificationQueueService.enqueueBatch(
          adminIds.map((adminId) => ({
            userId: adminId,
            type: 'BUDGET_UPDATE' as const,
            title: 'Actualización de presupuesto',
            message: `El presupuesto "${payload.title}" ${message}`,
            data: { budgetId: payload.budgetId },
          })),
        );
      } else {
        await this.notificationQueueService.enqueue({
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

  async handleServiceCreated(payload: {
    serviceRequestId: string;
    title: string;
    requesterId: string;
    urgency: string;
  }): Promise<void> {
    try {
      const adminIds = await this.usersRepository.findAdminIds();

      await this.notificationQueueService.enqueueBatch(
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

  async handleServiceStatusChanged(payload: {
    serviceRequestId: string;
    title: string;
    oldStatus: string;
    newStatus: string;
    requesterId: string;
  }): Promise<void> {
    try {
      const statusMessages: Record<string, string> = {
        IN_REVIEW: 'está en revisión',
        IN_PROGRESS: 'está en progreso',
        RESOLVED: 'fue resuelta',
        CLOSED: 'fue cerrada',
      };

      const message = statusMessages[payload.newStatus] ?? 'cambió de estado';

      await this.notificationQueueService.enqueue({
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

  /**
   * Bulk task reminder handler — used by TaskReminderService (scheduler).
   * Uses direct DB writes (NotificationsService) instead of BullMQ queue
   * for efficiency when processing hundreds of reminders at once.
   */
  async handleTaskReminders(payload: {
    notifications: Array<{
      userId: string;
      type: 'TASK_REMINDER';
      title: string;
      message: string;
      data: Record<string, unknown>;
    }>;
    emails: Array<{
      to: string;
      name: string;
      taskName: string;
      propertyAddress: string;
      dueDate: Date;
      categoryName: string;
      isOverdue: boolean;
    }>;
  }): Promise<{ notificationCount: number; failedEmails: number }> {
    try {
      const [notificationCount, emailResults] = await Promise.all([
        this.notificationsService.createNotifications(payload.notifications),
        Promise.allSettled(
          payload.emails.map((e) =>
            this.emailQueueService.enqueueTaskReminder(
              e.to,
              e.name,
              e.taskName,
              e.propertyAddress,
              e.dueDate,
              e.categoryName,
              e.isOverdue,
            ),
          ),
        ),
      ]);
      const failedEmails = emailResults.filter((r) => r.status === 'rejected').length;
      if (failedEmails > 0) {
        this.logger.error(
          `${failedEmails}/${emailResults.length} reminder email(s) failed to enqueue`,
        );
      }
      return { notificationCount, failedEmails };
    } catch (error) {
      this.logger.error(
        `Error handling task reminders: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return { notificationCount: 0, failedEmails: payload.emails.length };
    }
  }
}
