import { BudgetStatus } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/node';

import { BudgetAuditLogRepository } from '../budgets/budget-audit-log.repository';
import { BudgetsRepository } from '../budgets/budgets.repository';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { DistributedLockService } from '../redis/distributed-lock.service';

@Injectable()
export class BudgetExpirationService {
  private readonly logger = new Logger(BudgetExpirationService.name);

  constructor(
    private readonly budgetsRepository: BudgetsRepository,
    private readonly auditLogRepository: BudgetAuditLogRepository,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  /**
   * Daily budget expiration check — 06:30 Argentina (09:30 UTC).
   * Transitions QUOTED budgets with validUntil in the past to EXPIRED.
   */
  @Cron('30 9 * * *', { name: 'budget-expiration-check' })
  async checkBudgetExpiry(): Promise<void> {
    const start = Date.now();
    try {
      await this.lockService.withLock('cron:budget-expiration-check', 300, async (signal) => {
        this.logger.log('Starting daily budget expiration check...');

        const expiredBudgets = await this.budgetsRepository.findExpiredQuotedBudgets();
        if (signal.lockLost) return;

        if (expiredBudgets.length === 0) {
          this.logger.log('No expired budgets found');
          return;
        }

        const ids = expiredBudgets.map((b) => b.id);
        const count = await this.budgetsRepository.expireBudgets(ids);
        if (signal.lockLost) return;

        // Log audit entries for each expired budget
        for (const budget of expiredBudgets) {
          void this.auditLogRepository.createAuditLog(
            budget.id,
            budget.requestedBy,
            'expired',
            { status: BudgetStatus.QUOTED },
            { status: BudgetStatus.EXPIRED },
          );

          void this.notificationsHandler.handleBudgetStatusChanged({
            budgetId: budget.id,
            title: budget.title,
            oldStatus: BudgetStatus.QUOTED,
            newStatus: BudgetStatus.EXPIRED,
            requesterId: budget.requestedBy,
          });
        }

        this.logger.log(`Budget expiration complete: ${count} budgets expired`);
      });
    } catch (error) {
      this.logger.error(`Cron failed: ${(error as Error).message}`, (error as Error).stack);
      Sentry.captureException(error);
    }
    this.metricsService.recordCronExecution('budget-expiration-check', Date.now() - start);
  }
}
