import { ServiceStatus } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { MetricsService } from '../metrics/metrics.service';
import { NotificationsHandlerService } from '../notifications/notifications-handler.service';
import { DistributedLockService } from '../redis/distributed-lock.service';
import { ServiceRequestAuditLogRepository } from '../service-requests/service-request-audit-log.repository';
import { ServiceRequestsRepository } from '../service-requests/service-requests.repository';

/** Auto-close RESOLVED service requests after 7 days of inactivity. */
const AUTO_CLOSE_DAYS = 7;

@Injectable()
export class ServiceRequestAutoCloseService {
  private readonly logger = new Logger(ServiceRequestAutoCloseService.name);

  constructor(
    private readonly serviceRequestsRepository: ServiceRequestsRepository,
    private readonly auditLogRepository: ServiceRequestAuditLogRepository,
    private readonly lockService: DistributedLockService,
    private readonly metricsService: MetricsService,
    private readonly notificationsHandler: NotificationsHandlerService,
  ) {}

  /**
   * Daily auto-close check — 07:00 Argentina (10:00 UTC).
   * Transitions RESOLVED requests with updatedAt older than 7 days to CLOSED.
   */
  @Cron('0 10 * * *', { name: 'service-request-auto-close' })
  async checkAutoClose(): Promise<void> {
    const start = Date.now();
    await this.lockService.withLock('cron:service-request-auto-close', 300, async (signal) => {
      this.logger.log('Starting daily service request auto-close check...');

      const olderThan = new Date(Date.now() - AUTO_CLOSE_DAYS * 24 * 60 * 60 * 1000);
      const staleRequests =
        await this.serviceRequestsRepository.findStaleResolvedRequests(olderThan);
      if (signal.lockLost) return;

      if (staleRequests.length === 0) {
        this.logger.log('No stale resolved service requests found');
        return;
      }

      const ids = staleRequests.map((r) => r.id);
      const { count } = await this.serviceRequestsRepository.closeRequests(ids);
      if (signal.lockLost) return;

      for (const request of staleRequests) {
        void this.auditLogRepository.createAuditLog(
          request.id,
          request.requestedBy,
          'closed',
          { status: ServiceStatus.RESOLVED },
          { status: ServiceStatus.CLOSED, reason: 'auto-close after 7 days' },
        );

        void this.notificationsHandler.handleServiceStatusChanged({
          serviceRequestId: request.id,
          title: request.title,
          oldStatus: ServiceStatus.RESOLVED,
          newStatus: ServiceStatus.CLOSED,
          requesterId: request.requestedBy,
        });
      }

      this.logger.log(`Service request auto-close complete: ${count} requests closed`);
    });
    this.metricsService.recordCronExecution('service-request-auto-close', Date.now() - start);
  }
}
