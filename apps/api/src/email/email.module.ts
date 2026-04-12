import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { EmailService } from './email.service';
import { EMAIL_QUEUE, EmailQueueProcessor } from './email-queue.processor';
import { EmailQueueService } from './email-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: false, // Keep failed jobs for inspection + DLQ monitoring
      },
    }),
  ],
  providers: [EmailService, EmailQueueService, EmailQueueProcessor],
  exports: [EmailQueueService],
})
export class EmailModule {}
