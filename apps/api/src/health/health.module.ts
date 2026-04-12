import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { EMAIL_QUEUE } from '../email/email-queue.processor';
import { NOTIFICATION_QUEUE } from '../notifications/notification-queue.types';
import { RedisModule } from '../redis/redis.module';
import { HealthController } from './health.controller';
import { QueueHealthIndicator } from './queue.health';
import { RedisHealthIndicator } from './redis.health';

@Module({
  imports: [
    TerminusModule,
    RedisModule,
    BullModule.registerQueue({ name: EMAIL_QUEUE }, { name: NOTIFICATION_QUEUE }),
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, QueueHealthIndicator],
})
export class HealthModule {}
