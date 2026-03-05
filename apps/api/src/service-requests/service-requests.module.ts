import { Module } from '@nestjs/common';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsRepository } from './service-requests.repository';
import { PropertiesModule } from '../properties/properties.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule, PropertiesModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, ServiceRequestsRepository],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
