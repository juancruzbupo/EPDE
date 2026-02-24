import { Module } from '@nestjs/common';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsRepository } from './service-requests.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, ServiceRequestsRepository, PrismaService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
