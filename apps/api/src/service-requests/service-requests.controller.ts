import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ServiceRequestsService } from './service-requests.service';
import {
  createServiceRequestSchema,
  updateServiceStatusSchema,
  serviceRequestFiltersSchema,
  UserRole,
} from '@epde/shared';
import type {
  CreateServiceRequestInput,
  UpdateServiceStatusInput,
  ServiceRequestFiltersInput,
} from '@epde/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Solicitudes de Servicio')
@ApiBearerAuth()
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  async listRequests(
    @Query(new ZodValidationPipe(serviceRequestFiltersSchema)) filters: ServiceRequestFiltersInput,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.serviceRequestsService.listRequests(filters, user);
  }

  @Get(':id')
  async getRequest(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    const data = await this.serviceRequestsService.getRequest(id, user);
    return { data };
  }

  @Post()
  @Roles(UserRole.CLIENT)
  async createRequest(
    @Body(new ZodValidationPipe(createServiceRequestSchema)) dto: CreateServiceRequestInput,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.serviceRequestsService.createRequest(dto, user.id);
    return { data, message: 'Solicitud de servicio creada' };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateServiceStatusSchema)) dto: UpdateServiceStatusInput,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const data = await this.serviceRequestsService.updateStatus(id, dto, user);
    return { data };
  }
}
