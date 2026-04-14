import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

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
    try {
      await Sentry.withMonitor(
        'task-upcoming-reminders',
        () =>
          this.lockService.withLock('cron:task-upcoming-reminders', 300, async (signal) => {
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

            // Aggregate overdue tasks for an admin-digest notification emitted once per
            // admin at the end of the loop. Avoids an O(tasks × admins) fan-out that
            // floods both the Notification table and admin inboxes.
            const overdueAdminDigest: Array<{
              taskId: string;
              taskName: string;
              ownerName: string;
              propertyAddress: string;
              propertyId: string;
              planId: string;
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

              const title = isOverdue ? '⚠️ Tarea vencida' : '🔔 Tarea próxima';
              const message = isOverdue
                ? `"${task.name}" en ${property.address} está vencida. Tu ISV puede bajar si no la completás pronto.`
                : `"${task.name}" en ${property.address} vence en ${daysUntilDue} día(s). Completala para mantener tu racha 🔥`;

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
                overdueAdminDigest.push({
                  taskId: task.id,
                  taskName: task.name,
                  ownerName: owner.name,
                  propertyAddress: property.address,
                  propertyId: property.id,
                  planId: task.maintenancePlanId,
                });
              }
            }

            // One digest per admin instead of N per task × M admins
            if (overdueAdminDigest.length > 0 && adminIds.length > 0) {
              const total = overdueAdminDigest.length;
              const sample = overdueAdminDigest.slice(0, 3);
              const preview = sample
                .map((t) => `• "${t.taskName}" (${t.ownerName}, ${t.propertyAddress})`)
                .join('\n');
              const extra = total > sample.length ? `\n…y ${total - sample.length} más` : '';
              const title = total === 1 ? '⚠️ 1 tarea vencida' : `⚠️ ${total} tareas vencidas hoy`;
              const message = `${preview}${extra}`;

              for (const adminId of adminIds) {
                notifications.push({
                  userId: adminId,
                  type: 'TASK_REMINDER',
                  title,
                  message,
                  data: {
                    // digest=true marks this as an aggregate; consumers can render a
                    // link to /tasks?status=OVERDUE instead of drilling into one task.
                    digest: true,
                    count: total,
                    taskIds: overdueAdminDigest.map((t) => t.taskId),
                  },
                });
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
          }),
        { schedule: { type: 'crontab', value: '5 9 * * *' } },
      );
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('task-upcoming-reminders', Date.now() - start);
  }
}
