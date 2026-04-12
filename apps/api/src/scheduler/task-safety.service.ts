import { getNextDueDate, recurrenceTypeToMonths, TaskStatus } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { MetricsService } from '../metrics/metrics.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { TasksRepository } from '../tasks/tasks.repository';

@Injectable()
export class TaskSafetyService {
  private readonly logger = new Logger(TaskSafetyService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Safety sweep for stale completed tasks — 06:10 Argentina (09:10 UTC)
   *
   * Edge case: if a COMPLETED task somehow didn't get its nextDueDate advanced
   * (e.g., server crash mid-transaction), this fixes it.
   */
  @Cron('10 9 * * *', { name: 'task-safety-sweep' })
  async safetySweepCompletedTasks(): Promise<void> {
    const start = Date.now();
    try {
      await this.lockService.withLock('cron:task-safety-sweep', 300, async (signal) => {
        this.logger.log('Starting safety sweep for completed tasks...');

        const staleTasks = await this.tasksRepository.findStaleCompleted();

        if (staleTasks.length === 0) {
          this.logger.log('Safety sweep: no stale tasks found');
          return;
        }

        if (signal.lockLost) return;

        const BATCH_SIZE = 50;
        let totalSuccess = 0;
        let totalFailed = 0;
        for (let i = 0; i < staleTasks.length; i += BATCH_SIZE) {
          if (signal.lockLost) return;
          const batch = staleTasks.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map((task) => {
              const months =
                task.recurrenceMonths ?? recurrenceTypeToMonths(task.recurrenceType) ?? 12;
              if (!task.nextDueDate) return Promise.resolve();
              const newDueDate = getNextDueDate(task.nextDueDate, months);
              return this.tasksRepository.updateDueDateAndStatus(
                task.id,
                newDueDate,
                TaskStatus.PENDING,
              );
            }),
          );
          const failed = results.filter((r) => r.status === 'rejected');
          if (failed.length > 0) {
            this.logger.error(
              `Safety sweep: ${failed.length}/${batch.length} tasks failed to update`,
              {
                failures: failed.map((r, i) => ({
                  taskId: batch[i]?.id,
                  reason: (r as PromiseRejectedResult).reason?.message,
                })),
              },
            );
          }
          const successCount = results.filter((r) => r.status === 'fulfilled').length;
          this.logger.log(
            `Safety sweep batch done: ${successCount} updated, ${failed.length} failed`,
          );
          totalSuccess += successCount;
          totalFailed += failed.length;
        }

        this.logger.log(
          `Safety sweep complete: ${totalSuccess} fixed, ${totalFailed} failed out of ${staleTasks.length} stale task(s)`,
        );
      });
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('task-safety-sweep', Date.now() - start);
  }
}
