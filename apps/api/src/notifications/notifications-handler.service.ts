import { BudgetStatus, ServiceStatus, type ServiceUrgency } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { EmailQueueService } from '../email/email-queue.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

/**
 * Centralized extension point for domain side-effects (notifications, emails, etc.).
 *
 * This service acts as a **type-safe event bus**: domain services call handler methods
 * instead of emitting string-keyed events, preserving compile-time safety and IDE
 * traceability. See {@link docs/adr/006-notification-handler-vs-events.md} for the
 * architectural decision record explaining why this pattern was chosen over
 * `EventEmitter2` or a custom RxJS event bus.
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
    private readonly pushService: PushService,
  ) {}

  /** Send push notification to specific users (fire-and-forget, catches errors). */
  private sendPush(userIds: string[], title: string, body: string, data?: Record<string, string>) {
    void this.pushService.sendToUsers(userIds, { title, body, data }).catch((err) => {
      this.logger.error(`Push notification failed: ${err}`);
    });
  }

  async handleBudgetCreated(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
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
      const notifTitle = 'Presupuesto cotizado';
      const notifMsg = `Tu presupuesto "${payload.title}" fue cotizado por $${payload.totalAmount.toLocaleString('es-AR')}`;

      await this.notificationQueueService.enqueue({
        userId: payload.requesterId,
        type: 'BUDGET_UPDATE',
        title: notifTitle,
        message: notifMsg,
        data: { budgetId: payload.budgetId },
      });

      this.sendPush([payload.requesterId], notifTitle, notifMsg, {
        budgetId: payload.budgetId,
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
    oldStatus: BudgetStatus;
    newStatus: BudgetStatus;
    requesterId: string;
  }): Promise<void> {
    try {
      const statusMessages: Partial<Record<BudgetStatus, string>> = {
        APPROVED: 'fue aprobado',
        REJECTED: 'fue rechazado',
        IN_PROGRESS: 'está en progreso',
        COMPLETED: 'fue completado',
      };

      const message = statusMessages[payload.newStatus] ?? 'cambió de estado';

      if (
        payload.newStatus === BudgetStatus.APPROVED ||
        payload.newStatus === BudgetStatus.REJECTED
      ) {
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
    urgency: ServiceUrgency;
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
    oldStatus: ServiceStatus;
    newStatus: ServiceStatus;
    requesterId: string;
  }): Promise<void> {
    try {
      const statusMessages: Partial<Record<ServiceStatus, string>> = {
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

  async handleClientInvited(payload: {
    email: string;
    name: string;
    token: string;
  }): Promise<void> {
    try {
      await this.emailQueueService.enqueueInvite(payload.email, payload.name, payload.token);
    } catch (error) {
      this.logger.error(
        `Error handling client.invited for ${payload.email}: ${(error as Error).message}`,
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
      taskId: string;
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
          payload.emails.map((e) => this.emailQueueService.enqueueTaskReminder(e)),
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

  /** Notify the other party when a comment is added to a budget. */
  async handleBudgetCommentAdded(payload: {
    budgetId: string;
    title: string;
    commentAuthorId: string;
    requesterId: string;
  }): Promise<void> {
    try {
      const adminIds = await this.usersRepository.findAdminIds();
      const isAdminComment = adminIds.includes(payload.commentAuthorId);
      const author = await this.usersRepository.findEmailInfo(payload.commentAuthorId);
      const authorName = author?.name ?? 'Un usuario';

      const recipients = isAdminComment ? [payload.requesterId] : adminIds;

      const notifTitle = 'Nuevo comentario en presupuesto';
      const notifMsg = `${authorName} comentó en "${payload.title}"`;

      await this.notificationQueueService.enqueueBatch(
        recipients.map((userId) => ({
          userId,
          type: 'BUDGET_UPDATE' as const,
          title: notifTitle,
          message: notifMsg,
          data: { budgetId: payload.budgetId },
        })),
      );

      this.sendPush(recipients, notifTitle, notifMsg, { budgetId: payload.budgetId });
    } catch (error) {
      this.logger.error(
        `Error handling budget comment for ${payload.budgetId}: ${(error as Error).message}`,
      );
    }
  }

  /** Notify the other party when a comment is added to a service request. */
  async handleServiceCommentAdded(payload: {
    serviceRequestId: string;
    title: string;
    commentAuthorId: string;
    requesterId: string;
  }): Promise<void> {
    try {
      const adminIds = await this.usersRepository.findAdminIds();
      const isAdminComment = adminIds.includes(payload.commentAuthorId);
      const author = await this.usersRepository.findEmailInfo(payload.commentAuthorId);
      const authorName = author?.name ?? 'Un usuario';

      const recipients = isAdminComment ? [payload.requesterId] : adminIds;

      const notifTitle = 'Nuevo comentario en solicitud';
      const notifMsg = `${authorName} comentó en "${payload.title}"`;

      await this.notificationQueueService.enqueueBatch(
        recipients.map((userId) => ({
          userId,
          type: 'SERVICE_UPDATE' as const,
          title: notifTitle,
          message: notifMsg,
          data: { serviceRequestId: payload.serviceRequestId },
        })),
      );

      this.sendPush(recipients, notifTitle, notifMsg, {
        serviceRequestId: payload.serviceRequestId,
      });
    } catch (error) {
      this.logger.error(
        `Error handling service comment for ${payload.serviceRequestId}: ${(error as Error).message}`,
      );
    }
  }

  /** Alert user when their property ISV drops significantly. */
  async handleISVAlert(payload: {
    propertyId: string;
    userId: string;
    address: string;
    previousScore: number;
    currentScore: number;
  }): Promise<void> {
    try {
      const drop = payload.previousScore - payload.currentScore;
      await this.notificationQueueService.enqueue({
        userId: payload.userId,
        type: 'SYSTEM',
        title: 'Salud de tu propiedad bajó',
        message: `El índice de salud de ${payload.address} bajó ${drop} puntos (de ${payload.previousScore} a ${payload.currentScore}). Revisá las tareas pendientes.`,
        data: { propertyId: payload.propertyId },
      });

      this.sendPush(
        [payload.userId],
        'Salud de tu propiedad bajó',
        `ISV de ${payload.address}: ${payload.currentScore}/100`,
        { propertyId: payload.propertyId },
      );
    } catch (error) {
      this.logger.error(
        `Error handling ISV alert for property ${payload.propertyId}: ${(error as Error).message}`,
      );
    }
  }

  /** Notify admins when a task completion reveals a POOR/CRITICAL condition. */
  async handleProblemDetected(payload: {
    taskName: string;
    propertyAddress: string;
    propertyId: string;
    conditionLabel: string;
  }): Promise<void> {
    try {
      const adminIds = await this.usersRepository.findAdminIds();
      if (adminIds.length === 0) return;

      const title = `Problema detectado: ${payload.taskName}`;
      const message = `Se detectó un problema (${payload.conditionLabel}) en ${payload.propertyAddress}. Considerá generar un presupuesto o servicio.`;

      await this.notificationQueueService.enqueueBatch(
        adminIds.map((userId) => ({
          userId,
          type: 'SYSTEM' as const,
          title,
          message,
          data: { propertyId: payload.propertyId },
        })),
      );

      this.sendPush(adminIds, title, message, { propertyId: payload.propertyId });
    } catch (error) {
      this.logger.error(
        `Error handling problem detection for ${payload.taskName}: ${(error as Error).message}`,
      );
    }
  }

  async handleSubscriptionChanged(payload: {
    userId: string;
    userName: string;
    action: 'extended' | 'suspended' | 'unlimited';
    newExpiresAt: Date | null;
  }) {
    try {
      let title: string;
      let message: string;

      switch (payload.action) {
        case 'extended': {
          const dateStr = payload.newExpiresAt
            ? payload.newExpiresAt.toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '';
          title = 'Tu suscripción fue extendida';
          message = `${payload.userName}, tu acceso a EPDE fue extendido hasta el ${dateStr}.`;
          break;
        }
        case 'suspended':
          title = 'Tu suscripción fue suspendida';
          message = `${payload.userName}, tu acceso a EPDE fue suspendido. Contactá al administrador para más información.`;
          break;
        case 'unlimited':
          title = 'Tu suscripción fue actualizada';
          message = `${payload.userName}, tu acceso a EPDE ahora es ilimitado.`;
          break;
      }

      await this.notificationsService.createNotification({
        userId: payload.userId,
        type: 'SYSTEM',
        title,
        message,
      });

      this.sendPush([payload.userId], title, message);
    } catch (error) {
      this.logger.error(
        `Error sending subscription change for ${payload.userId}: ${(error as Error).message}`,
      );
    }
  }

  async handleSubscriptionReminder(payload: {
    userId: string;
    userName: string;
    daysLeft: number;
    expiresAt: Date;
  }) {
    try {
      const daysText = payload.daysLeft === 1 ? 'mañana' : `en ${payload.daysLeft} días`;
      const title = 'Tu suscripción está por vencer';
      const message = `${payload.userName}, tu acceso a EPDE vence ${daysText}. Contactá al administrador para renovar.`;

      await this.notificationsService.createNotification({
        userId: payload.userId,
        type: 'SYSTEM',
        title,
        message,
      });

      this.sendPush([payload.userId], title, message);
    } catch (error) {
      this.logger.error(
        `Error sending subscription reminder for ${payload.userId}: ${(error as Error).message}`,
      );
    }
  }
}
