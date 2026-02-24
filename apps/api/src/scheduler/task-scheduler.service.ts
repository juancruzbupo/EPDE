import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { addDays } from 'date-fns';
import { getNextDueDate, recurrenceTypeToMonths } from '@epde/shared';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
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
    this.logger.log('Starting daily task status recalculation...');

    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    const overdueResult = await this.prisma.task.updateMany({
      where: {
        nextDueDate: { lt: now },
        status: { notIn: ['COMPLETED', 'OVERDUE'] },
        deletedAt: null,
      },
      data: { status: 'OVERDUE' },
    });

    const upcomingResult = await this.prisma.task.updateMany({
      where: {
        nextDueDate: { gte: now, lte: thirtyDaysFromNow },
        status: 'PENDING',
        deletedAt: null,
      },
      data: { status: 'UPCOMING' },
    });

    const resetResult = await this.prisma.task.updateMany({
      where: {
        nextDueDate: { gt: thirtyDaysFromNow },
        status: 'UPCOMING',
        deletedAt: null,
      },
      data: { status: 'PENDING' },
    });

    this.logger.log(
      `Status recalculation complete: ${overdueResult.count} overdue, ` +
        `${upcomingResult.count} upcoming, ${resetResult.count} reset to pending`,
    );
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
    this.logger.log('Starting upcoming task reminders...');

    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);

    const taskInclude = {
      category: true,
      maintenancePlan: {
        include: {
          property: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    } as const;

    const upcomingTasks = await this.prisma.task.findMany({
      where: {
        nextDueDate: { gte: now, lte: sevenDaysFromNow },
        status: { not: 'COMPLETED' },
        deletedAt: null,
      },
      include: taskInclude,
    });

    const overdueTasks = await this.prisma.task.findMany({
      where: {
        nextDueDate: { lt: now },
        status: 'OVERDUE',
        deletedAt: null,
      },
      include: taskInclude,
    });

    const allTasks = [...upcomingTasks, ...overdueTasks];

    if (allTasks.length === 0) {
      this.logger.log('No tasks to remind about');
      return;
    }

    // Check for today's existing reminders to avoid duplicates
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingReminders = await this.prisma.notification.findMany({
      where: {
        type: 'TASK_REMINDER',
        createdAt: { gte: todayStart },
      },
      select: { data: true },
    });

    const alreadyRemindedTaskIds = new Set(
      existingReminders
        .filter((n) => n.data && typeof n.data === 'object')
        .map((n) => (n.data as Record<string, unknown>).taskId as string)
        .filter(Boolean),
    );

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
        .catch((err) => this.logger.error(`Error enviando email de recordatorio: ${err.message}`));
      emailCount++;

      // Overdue tasks: also notify admins
      if (isOverdue) {
        const admins = await this.prisma.user.findMany({
          where: { role: 'ADMIN', deletedAt: null },
          select: { id: true },
        });
        for (const admin of admins) {
          await this.notificationsService.createNotification({
            userId: admin.id,
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
  }

  /**
   * Safety sweep for stale completed tasks — 06:10 Argentina (09:10 UTC)
   *
   * Edge case: if a COMPLETED task somehow didn't get its nextDueDate advanced
   * (e.g., server crash mid-transaction), this fixes it.
   */
  @Cron('10 9 * * *', { name: 'task-safety-sweep' })
  async safetySweepCompletedTasks(): Promise<void> {
    this.logger.log('Starting safety sweep for completed tasks...');

    const staleTasks = await this.prisma.task.findMany({
      where: {
        status: 'COMPLETED',
        nextDueDate: { lt: new Date() },
        deletedAt: null,
      },
    });

    if (staleTasks.length === 0) {
      this.logger.log('Safety sweep: no stale tasks found');
      return;
    }

    for (const task of staleTasks) {
      const months = task.recurrenceMonths ?? recurrenceTypeToMonths(task.recurrenceType);
      const newDueDate = getNextDueDate(task.nextDueDate, months);

      await this.prisma.task.update({
        where: { id: task.id },
        data: { nextDueDate: newDueDate, status: 'PENDING' },
      });
    }

    this.logger.log(`Safety sweep: fixed ${staleTasks.length} stale task(s)`);
  }
}
