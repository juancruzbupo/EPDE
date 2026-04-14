import { Module } from '@nestjs/common';

import { CategoryTemplatesModule } from '../category-templates/category-templates.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PropertiesModule } from '../properties/properties.module';
import { TaskTemplatesModule } from '../task-templates/task-templates.module';
import { InspectionChecklistRepository } from './inspection-checklist.repository';
import { InspectionItemRepository } from './inspection-item.repository';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';

@Module({
  imports: [
    TaskTemplatesModule,
    CategoryTemplatesModule,
    PropertiesModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [InspectionsController],
  providers: [InspectionsService, InspectionChecklistRepository, InspectionItemRepository],
  exports: [InspectionsService],
})
export class InspectionsModule {}
