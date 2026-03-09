import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';
import { TaskReminderService } from './task-reminder.service';
import { TaskSafetyService } from './task-safety.service';
import { TaskStatusService } from './task-status.service';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule, EmailModule, TasksModule],
  providers: [TaskStatusService, TaskReminderService, TaskSafetyService],
})
export class SchedulerModule {}
