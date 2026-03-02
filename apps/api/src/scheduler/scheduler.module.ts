import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskSchedulerService } from './task-scheduler.service';
import { TasksRepository } from '../maintenance-plans/tasks.repository';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificationsModule, EmailModule],
  providers: [
    TaskSchedulerService,
    TasksRepository,
    NotificationsRepository,
    UserLookupRepository,
    PrismaService,
  ],
})
export class SchedulerModule {}
