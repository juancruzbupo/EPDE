import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { EmailModule } from '../email/email.module';
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
        removeOnFail: { count: 500 },
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
  ],
  exports: [
    NotificationsService,
    NotificationQueueService,
    NotificationsHandlerService,
    NotificationsRepository,
    UserLookupRepository,
    PushService,
  ],
})
export class NotificationsModule {}
