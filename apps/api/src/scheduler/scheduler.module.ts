import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskStatusService } from './task-status.service';
import { TaskReminderService } from './task-reminder.service';
import { TaskSafetyService } from './task-safety.service';
import { TasksModule } from '../tasks/tasks.module';

import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule, EmailModule, TasksModule],
  providers: [TaskStatusService, TaskReminderService, TaskSafetyService],
})
export class SchedulerModule {}
