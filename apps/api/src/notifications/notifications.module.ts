import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsListener } from './notifications.listener';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationQueueProcessor } from './notification-queue.processor';
import { NOTIFICATION_QUEUE } from './notification-queue.types';
import { UsersRepository } from '../common/repositories/users.repository';
import { PrismaService } from '../prisma/prisma.service';
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
    NotificationsListener,
    NotificationQueueService,
    NotificationQueueProcessor,
    UsersRepository,
    PrismaService,
  ],
  exports: [NotificationsService, NotificationQueueService],
})
export class NotificationsModule {}
