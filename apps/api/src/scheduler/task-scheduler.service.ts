import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TasksRepository } from '../maintenance-plans/tasks.repository';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { UsersRepository } from '../common/repositories/users.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { getNextDueDate, recurrenceTypeToMonths } from '@epde/shared';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Daily status recalculation — 06:00 Argentina (09:00 UTC)
   *
   * PENDING → OVERDUE   (nextDueDate past)
   * PENDING → UPCOMING  (nextDueDate within 30 days)
   * UPCOMING → PENDING  (nextDueDate pushed beyond 30 days)
   */
  @Cron('0 9 * * *', { name: 'task-status-recalculation' })
  async recalculateTaskStatuses(): Promise<void> {
    await this.lockService.withLock('cron:task-status-recalculation', 300, async () => {
      this.logger.log('Starting daily task status recalculation...');

      const [overdueCount, upcomingCount, resetCount] = await Promise.all([
        this.tasksRepository.markOverdue(),
        this.tasksRepository.markUpcoming(),
        this.tasksRepository.resetUpcomingToPending(),
      ]);

      this.logger.log(
        `Status recalculation complete: ${overdueCount} overdue, ` +
          `${upcomingCount} upcoming, ${resetCount} reset to pending`,
      );
    });
  }

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
    await this.lockService.withLock('cron:task-upcoming-reminders', 300, async () => {
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

      const hasOverdue = overdueTasks.length > 0;

      // Fetch admins once (not inside loop) and dedup reminders in parallel
      const [alreadyRemindedTaskIds, adminIds] = await Promise.all([
        this.notificationsRepository.findTodayReminderTaskIds(),
        hasOverdue ? this.usersRepository.findAdminIds() : Promise.resolve([]),
      ]);

      let notificationCount = 0;
      let emailCount = 0;

      for (const task of allTasks) {
        if (alreadyRemindedTaskIds.has(task.id)) continue;

        const property = task.maintenancePlan.property;
        const owner = property.user;
        const daysUntilDue = Math.ceil(
          (task.nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        const isOverdue = daysUntilDue < 0;

        const title = isOverdue ? 'Tarea vencida' : 'Tarea próxima a vencer';
        const message = isOverdue
          ? `La tarea "${task.name}" en ${property.address} está vencida hace ${Math.abs(daysUntilDue)} día(s)`
          : `La tarea "${task.name}" en ${property.address} vence en ${daysUntilDue} día(s)`;

        // In-app notification for property owner
        await this.notificationsService.createNotification({
          userId: owner.id,
          type: 'TASK_REMINDER',
          title,
          message,
          data: { taskId: task.id, propertyAddress: property.address },
        });
        notificationCount++;

        // Email to property owner
        await this.emailService
          .sendTaskReminderEmail(
            owner.email,
            owner.name,
            task.name,
            property.address,
            task.nextDueDate,
            task.category.name,
            isOverdue,
          )
          .catch((err) =>
            this.logger.error(`Error enviando email de recordatorio: ${err.message}`),
          );
        emailCount++;

        // Overdue tasks: also notify admins (adminIds already fetched above)
        if (isOverdue) {
          for (const adminId of adminIds) {
            await this.notificationsService.createNotification({
              userId: adminId,
              type: 'TASK_REMINDER',
              title: 'Tarea vencida',
              message: `La tarea "${task.name}" (${owner.name} - ${property.address}) está vencida`,
              data: { taskId: task.id },
            });
          }
        }
      }

      this.logger.log(
        `Reminders complete: ${notificationCount} notifications, ${emailCount} emails sent`,
      );
    });
  }

  /**
   * Safety sweep for stale completed tasks — 06:10 Argentina (09:10 UTC)
   *
   * Edge case: if a COMPLETED task somehow didn't get its nextDueDate advanced
   * (e.g., server crash mid-transaction), this fixes it.
   */
  @Cron('10 9 * * *', { name: 'task-safety-sweep' })
  async safetySweepCompletedTasks(): Promise<void> {
    await this.lockService.withLock('cron:task-safety-sweep', 300, async () => {
      this.logger.log('Starting safety sweep for completed tasks...');

      const staleTasks = await this.tasksRepository.findStaleCompleted();

      if (staleTasks.length === 0) {
        this.logger.log('Safety sweep: no stale tasks found');
        return;
      }

      for (const task of staleTasks) {
        const months = task.recurrenceMonths ?? recurrenceTypeToMonths(task.recurrenceType);
        const newDueDate = getNextDueDate(task.nextDueDate, months);

        await this.tasksRepository.updateDueDateAndStatus(task.id, newDueDate, 'PENDING');
      }

      this.logger.log(`Safety sweep: fixed ${staleTasks.length} stale task(s)`);
    });
  }
}
