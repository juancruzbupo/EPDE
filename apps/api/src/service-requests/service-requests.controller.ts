import type {
  AddServiceRequestAttachmentsInput,
  CreateServiceRequestCommentInput,
  CreateServiceRequestInput,
  CurrentUser as CurrentUserPayload,
  EditServiceRequestInput,
  ServiceRequestFiltersInput,
  UpdateServiceStatusInput,
} from '@epde/shared';
import {
  addServiceRequestAttachmentsSchema,
  createServiceRequestCommentSchema,
  createServiceRequestSchema,
  editServiceRequestSchema,
  serviceRequestFiltersSchema,
  updateServiceStatusSchema,
  UserRole,
} from '@epde/shared';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ServiceRequestAttachmentsService } from './service-request-attachments.service';
import { ServiceRequestCommentsService } from './service-request-comments.service';
import { ServiceRequestsService } from './service-requests.service';

@ApiTags('Solicitudes de Servicio')
@ApiBearerAuth()
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
    private readonly serviceRequestCommentsService: ServiceRequestCommentsService,
    private readonly serviceRequestAttachmentsService: ServiceRequestAttachmentsService,
  ) {}

  @Get()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async listRequests(
    @Query(new ZodValidationPipe(serviceRequestFiltersSchema)) filters: ServiceRequestFiltersInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.serviceRequestsService.listRequests(filters, user);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.serviceRequestsService.getRequest(id, user);
    return { data };
  }

  @Get(':id/audit-log')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getAuditLog(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.serviceRequestsService.getAuditLog(id, user);
    return { data };
  }

  @Get(':id/comments')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.serviceRequestCommentsService.getComments(id, user);
    return { data };
  }

  @Post()
  @Roles(UserRole.CLIENT)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async createRequest(
    @Body(new ZodValidationPipe(createServiceRequestSchema)) dto: CreateServiceRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.serviceRequestsService.createRequest(dto, user.id);
    return { data, message: 'Solicitud de servicio creada' };
  }

  @Post(':id/comments')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createServiceRequestCommentSchema))
    dto: CreateServiceRequestCommentInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.serviceRequestCommentsService.addComment(id, dto, user);
    return { data, message: 'Comentario agregado' };
  }

  @Post(':id/attachments')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async addAttachments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(addServiceRequestAttachmentsSchema))
    dto: AddServiceRequestAttachmentsInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.serviceRequestAttachmentsService.addAttachments(id, dto, user);
    return { data, message: 'Adjuntos agregados' };
  }

  /** Edit service request — must be declared BEFORE :id/status to avoid route collision */
  @Patch(':id')
  @Roles(UserRole.CLIENT)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async editRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(editServiceRequestSchema)) dto: EditServiceRequestInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.serviceRequestsService.editServiceRequest(id, dto, user);
    return { data, message: 'Solicitud actualizada' };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateServiceStatusSchema)) dto: UpdateServiceStatusInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.serviceRequestsService.updateStatus(id, dto, user);
    return { data, message: 'Estado de la solicitud actualizado' };
  }
}
