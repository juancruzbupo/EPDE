import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TasksRepository } from '../tasks/tasks.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class TaskStatusService {
  private readonly logger = new Logger(TaskStatusService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
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
    const start = Date.now();
    await this.lockService.withLock('cron:task-status-recalculation', 300, async (signal) => {
      this.logger.log('Starting daily task status recalculation...');

      if (signal.lockLost) return;

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
    this.metricsService.recordCronExecution('task-status-recalculation', Date.now() - start);
  }
}
