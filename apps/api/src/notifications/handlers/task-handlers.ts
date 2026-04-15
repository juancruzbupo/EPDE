import { Injectable, Logger } from '@nestjs/common';

import { HandlerContext } from '../handler-context.service';

/**
 * Notification handlers for the Task + maintenance-plan domain:
 *   - plan generated from an inspection,
 *   - bulk task reminders driven by the scheduler,
 *   - problem detected when a task completion reveals POOR/CRITICAL condition.
 */
@Injectable()
export class TaskHandlers {
  private readonly logger = new Logger(TaskHandlers.name);

  constructor(private readonly ctx: HandlerContext) {}

  /**
   * Fires after an inspection checklist is converted into a maintenance plan.
   * Sends an in-app SYSTEM notification to the property owner so they learn the
   * plan is ready without having to check the app. Intentionally in-app only —
   * the plan-ready flow surfaces on the dashboard too, no need to add email noise.
   */
  async onPlanGenerated(payload: {
    userId: string;
    planId: string;
    propertyId: string;
    propertyAddress: string;
  }): Promise<void> {
    return this.ctx.withDLQ('handlePlanGenerated', payload as Record<string, unknown>, async () => {
      await this.ctx.notificationQueueService.enqueue({
        userId: payload.userId,
        type: 'SYSTEM',
        title: 'Tu plan de mantenimiento está listo',
        message: `Ya podés ver el plan generado para ${payload.propertyAddress}.`,
        data: { planId: payload.planId, propertyId: payload.propertyId },
      });
    });
  }

  /**
   * Bulk task reminder handler — used by TaskReminderService (scheduler).
   * Uses direct DB writes (NotificationsService) instead of BullMQ queue for
   * efficiency when processing hundreds of reminders at once. Returns a result
   * object rather than going through DLQ because the scheduler surfaces batch
   * failure counts directly.
   */
  async onTaskReminders(payload: {
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
        this.ctx.notificationsService.createNotifications(payload.notifications),
        Promise.allSettled(
          payload.emails.map((e) => this.ctx.emailQueueService.enqueueTaskReminder(e)),
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

  /** Notify admins when a task completion reveals a POOR/CRITICAL condition. */
  async onProblemDetected(payload: {
    taskName: string;
    propertyAddress: string;
    propertyId: string;
    conditionLabel: string;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleProblemDetected',
      payload as Record<string, unknown>,
      async () => {
        const adminIds = await this.ctx.usersRepository.findAdminIds();
        if (adminIds.length === 0) return;

        const title = `Problema detectado: ${payload.taskName}`;
        const message = `Se detectó un problema (${payload.conditionLabel}) en ${payload.propertyAddress}. Considerá generar un presupuesto o servicio.`;

        await this.ctx.notificationQueueService.enqueueBatch(
          adminIds.map((userId) => ({
            userId,
            type: 'SYSTEM' as const,
            title,
            message,
            data: { propertyId: payload.propertyId },
          })),
        );

        this.ctx.sendPush(adminIds, title, message, { propertyId: payload.propertyId });
      },
    );
  }
}
