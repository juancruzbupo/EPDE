import type {
  BulkIdsInput,
  ClientFiltersInput,
  CreateClientInput,
  UpdateClientInput,
} from '@epde/shared';
import {
  bulkIdsSchema,
  clientFiltersSchema,
  createClientSchema,
  updateClientSchema,
  UserRole,
} from '@epde/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ClientsService } from './clients.service';

@ApiTags('Clientes')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async listClients(
    @Query(new ZodValidationPipe(clientFiltersSchema)) filters: ClientFiltersInput,
  ) {
    return this.clientsService.listClients(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getClient(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.clientsService.getClient(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async createClient(@Body(new ZodValidationPipe(createClientSchema)) dto: CreateClientInput) {
    const data = await this.clientsService.createClient(dto);
    return { data, message: 'Cliente creado e invitación enviada' };
  }

  @Post(':id/reinvite')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async reinviteClient(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.clientsService.reinviteClient(id);
    return { data, message: 'Invitación reenviada' };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async updateClient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateClientSchema)) dto: UpdateClientInput,
  ) {
    const data = await this.clientsService.updateClient(id, dto);
    return { data, message: 'Cliente actualizado' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async deleteClient(@Param('id', ParseUUIDPipe) id: string) {
    await this.clientsService.deleteClient(id);
    return { data: null, message: 'Cliente eliminado' };
  }

  @Post('bulk-reinvite')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async bulkReinvite(@Body(new ZodValidationPipe(bulkIdsSchema)) body: BulkIdsInput) {
    const results = await Promise.allSettled(
      body.ids.map((id) => this.clientsService.reinviteClient(id)),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    return {
      data: { succeeded, total: body.ids.length },
      message: `${succeeded} invitaciones reenviadas`,
    };
  }

  @Post('bulk-delete')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async bulkDelete(@Body(new ZodValidationPipe(bulkIdsSchema)) body: BulkIdsInput) {
    const results = await Promise.allSettled(
      body.ids.map((id) => this.clientsService.deleteClient(id)),
    );
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    return {
      data: { succeeded, total: body.ids.length },
      message: `${succeeded} clientes eliminados`,
    };
  }
}
