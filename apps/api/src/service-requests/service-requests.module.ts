import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { PropertiesModule } from '../properties/properties.module';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsRepository } from './service-requests.repository';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  imports: [NotificationsModule, PropertiesModule],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, ServiceRequestsRepository],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
