import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { PropertiesModule } from '../properties/properties.module';
import { ServiceRequestAttachmentsRepository } from './service-request-attachments.repository';
import { ServiceRequestAuditLogRepository } from './service-request-audit-log.repository';
import { ServiceRequestCommentsRepository } from './service-request-comments.repository';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsRepository } from './service-requests.repository';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  imports: [NotificationsModule, PropertiesModule],
  controllers: [ServiceRequestsController],
  providers: [
    ServiceRequestsService,
    ServiceRequestsRepository,
    ServiceRequestAuditLogRepository,
    ServiceRequestCommentsRepository,
    ServiceRequestAttachmentsRepository,
  ],
  exports: [ServiceRequestsService, ServiceRequestsRepository, ServiceRequestAuditLogRepository],
})
export class ServiceRequestsModule {}
