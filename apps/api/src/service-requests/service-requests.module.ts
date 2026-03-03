import { Module } from '@nestjs/common';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsRepository } from './service-requests.repository';
import { PropertiesRepository } from '../properties/properties.repository';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, ServiceRequestsRepository, PropertiesRepository],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
