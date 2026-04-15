import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { EmailModule } from '../email/email.module';
import { FailedNotificationRepository } from './failed-notification.repository';
import { HandlerContext } from './handler-context.service';
import { AccountHandlers } from './handlers/account-handlers';
import { BudgetHandlers } from './handlers/budget-handlers';
import { PropertyHealthHandlers } from './handlers/property-health-handlers';
import { ReferralHandlers } from './handlers/referral-handlers';
import { ServiceRequestHandlers } from './handlers/service-request-handlers';
import { SubscriptionHandlers } from './handlers/subscription-handlers';
import { TaskHandlers } from './handlers/task-handlers';
import { NotificationQueueProcessor } from './notification-queue.processor';
import { NotificationQueueService } from './notification-queue.service';
import { NOTIFICATION_QUEUE } from './notification-queue.types';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsHandlerService } from './notifications-handler.service';
import { PushService } from './push.service';
import { PushTokensRepository } from './push-tokens.repository';

@Module({
  imports: [
    EmailModule,
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 200 },
        removeOnFail: false, // Keep failed jobs for inspection + DLQ monitoring
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsHandlerService,
    NotificationQueueService,
    NotificationQueueProcessor,
    UserLookupRepository,
    PushService,
    PushTokensRepository,
    FailedNotificationRepository,
    // Per-bounded-context handlers that the facade delegates to. Each one is
    // an @Injectable() with the same HandlerContext dependency so the core
    // DLQ / retry / sendPush wiring stays DRY.
    HandlerContext,
    BudgetHandlers,
    ServiceRequestHandlers,
    TaskHandlers,
    ReferralHandlers,
    SubscriptionHandlers,
    AccountHandlers,
    PropertyHealthHandlers,
  ],
  exports: [
    NotificationsService,
    NotificationQueueService,
    NotificationsHandlerService,
    NotificationsRepository,
    UserLookupRepository,
    PushService,
    FailedNotificationRepository,
  ],
})
export class NotificationsModule {}
