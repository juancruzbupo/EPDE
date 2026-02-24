import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto';
import { ServiceRequestFiltersDto } from './dto/service-request-filters.dto';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  async listRequests(
    @Query() filters: ServiceRequestFiltersDto,
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
  @Roles('CLIENT')
  async createRequest(@Body() dto: CreateServiceRequestDto, @CurrentUser() user: { id: string }) {
    const data = await this.serviceRequestsService.createRequest(dto, user.id);
    return { data, message: 'Solicitud de servicio creada' };
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateServiceStatusDto) {
    const data = await this.serviceRequestsService.updateStatus(id, dto);
    return { data };
  }
}
