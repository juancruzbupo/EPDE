import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { TasksRepository } from '../tasks/tasks.repository';

@Injectable()
export class TaskReminderService {
  private readonly logger = new Logger(TaskReminderService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersRepository: UserLookupRepository,
    private readonly notificationsHandler: NotificationsHandlerService,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Upcoming task reminders — 06:05 Argentina (09:05 UTC)
   *
   * For tasks due within 7 days + overdue tasks:
   * - Create TASK_REMINDER in-app notification for property owner
   * - Send reminder email
   * - Overdue tasks also notify admins
   *
   * Deduplication: skip tasks that already have a TASK_REMINDER created today.
   */
  @Cron('5 9 * * *', { name: 'task-upcoming-reminders' })
  async sendUpcomingTaskReminders(): Promise<void> {
    const start = Date.now();
    await this.lockService.withLock('cron:task-upcoming-reminders', 300, async (signal) => {
      this.logger.log('Starting upcoming task reminders...');

      const now = new Date();

      const [upcomingTasks, overdueTasks] = await Promise.all([
        this.tasksRepository.findUpcomingWithOwners(7),
        this.tasksRepository.findOverdueWithOwners(),
      ]);

      const allTasks = [...upcomingTasks, ...overdueTasks];

      if (allTasks.length === 0) {
        this.logger.log('No tasks to remind about');
        return;
      }

      if (signal.lockLost) return;

      const hasOverdue = overdueTasks.length > 0;

      // Fetch admins once (not inside loop) and dedup reminders in parallel
      const [alreadyRemindedTaskIds, adminIds] = await Promise.all([
        this.notificationsRepository.findTodayReminderTaskIds(),
        hasOverdue ? this.usersRepository.findAdminIds() : Promise.resolve([]),
      ]);

      const notifications: Array<{
        userId: string;
        type: 'TASK_REMINDER';
        title: string;
        message: string;
        data: Record<string, unknown>;
      }> = [];
      const emails: Array<{
        to: string;
        name: string;
        taskId: string;
        taskName: string;
        propertyAddress: string;
        dueDate: Date;
        categoryName: string;
        isOverdue: boolean;
      }> = [];

      for (const task of allTasks) {
        if (alreadyRemindedTaskIds.has(task.id)) continue;

        const property = task.maintenancePlan.property;
        const owner = property.user;
        if (!task.nextDueDate) continue;
        const daysUntilDue = Math.ceil(
          (task.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        const isOverdue = daysUntilDue < 0;

        const title = isOverdue ? 'Tarea vencida' : 'Tarea próxima a vencer';
        const message = isOverdue
          ? `La tarea "${task.name}" en ${property.address} está vencida hace ${Math.abs(daysUntilDue)} día(s)`
          : `La tarea "${task.name}" en ${property.address} vence en ${daysUntilDue} día(s)`;

        notifications.push({
          userId: owner.id,
          type: 'TASK_REMINDER',
          title,
          message,
          data: {
            taskId: task.id,
            planId: task.maintenancePlanId,
            propertyId: property.id,
            propertyAddress: property.address,
          },
        });

        emails.push({
          to: owner.email,
          name: owner.name,
          taskId: task.id,
          taskName: task.name,
          propertyAddress: property.address,
          dueDate: task.nextDueDate,
          categoryName: task.category.name,
          isOverdue,
        });

        if (isOverdue) {
          for (const adminId of adminIds) {
            notifications.push({
              userId: adminId,
              type: 'TASK_REMINDER',
              title: 'Tarea vencida',
              message: `La tarea "${task.name}" (${owner.name} - ${property.address}) está vencida`,
              data: { taskId: task.id, planId: task.maintenancePlanId, propertyId: property.id },
            });
          }
        }
      }

      if (signal.lockLost) return;

      const result = await this.notificationsHandler.handleTaskReminders({
        notifications,
        emails,
      });

      this.logger.log(
        `Reminders complete: ${result.notificationCount} notifications, ${emails.length - result.failedEmails} emails enqueued, ${result.failedEmails} failed`,
      );
    });
    this.metricsService.recordCronExecution('task-upcoming-reminders', Date.now() - start);
  }
}
