import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskStatusService } from './task-status.service';
import { TaskReminderService } from './task-reminder.service';
import { TaskSafetyService } from './task-safety.service';
import { TasksRepository } from '../tasks/tasks.repository';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { UserLookupRepository } from '../common/repositories/user-lookup.repository';

import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule, EmailModule, RedisModule],
  providers: [
    TaskStatusService,
    TaskReminderService,
    TaskSafetyService,
    TasksRepository,
    NotificationsRepository,
    UserLookupRepository,
  ],
})
export class SchedulerModule {}
