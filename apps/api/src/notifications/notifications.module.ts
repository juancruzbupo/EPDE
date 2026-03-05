import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsHandlerService } from './notifications-handler.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationQueueProcessor } from './notification-queue.processor';
import { NOTIFICATION_QUEUE } from './notification-queue.types';
import { UserLookupRepository } from '../common/repositories/user-lookup.repository';

import { EmailModule } from '../email/email.module';

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
  ],
  exports: [
    NotificationsService,
    NotificationQueueService,
    NotificationsHandlerService,
    NotificationsRepository,
    UserLookupRepository,
  ],
})
export class NotificationsModule {}
