import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TasksRepository } from '../maintenance-plans/tasks.repository';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { getNextDueDate, recurrenceTypeToMonths } from '@epde/shared';

@Injectable()
export class TaskSafetyService {
  private readonly logger = new Logger(TaskSafetyService.name);

  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Safety sweep for stale completed tasks — 06:10 Argentina (09:10 UTC)
   *
   * Edge case: if a COMPLETED task somehow didn't get its nextDueDate advanced
   * (e.g., server crash mid-transaction), this fixes it.
   */
  @Cron('10 9 * * *', { name: 'task-safety-sweep' })
  async safetySweepCompletedTasks(): Promise<void> {
    await this.lockService.withLock('cron:task-safety-sweep', 300, async (signal) => {
      this.logger.log('Starting safety sweep for completed tasks...');

      const staleTasks = await this.tasksRepository.findStaleCompleted();

      if (staleTasks.length === 0) {
        this.logger.log('Safety sweep: no stale tasks found');
        return;
      }

      if (signal.lockLost) return;

      const BATCH_SIZE = 50;
      for (let i = 0; i < staleTasks.length; i += BATCH_SIZE) {
        if (signal.lockLost) return;
        const batch = staleTasks.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((task) => {
            const months =
              task.recurrenceMonths ?? recurrenceTypeToMonths(task.recurrenceType) ?? 12;
            if (!task.nextDueDate) return;
            const newDueDate = getNextDueDate(task.nextDueDate, months);
            return this.tasksRepository.updateDueDateAndStatus(task.id, newDueDate, 'PENDING');
          }),
        );
      }

      this.logger.log(`Safety sweep: fixed ${staleTasks.length} stale task(s)`);
    });
  }
}
