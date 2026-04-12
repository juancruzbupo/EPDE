import type { ClientFiltersInput, CreateClientInput, UpdateClientInput } from '@epde/shared';
import {
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
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Roles } from '../common/decorators/roles.decorator';
import { StrictAuth } from '../common/decorators/strict-auth.decorator';
import { StrictBlacklistGuard } from '../common/guards/strict-blacklist.guard';
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
  @HttpCode(HttpStatus.CREATED)
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
  @StrictAuth()
  @UseGuards(StrictBlacklistGuard)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async deleteClient(@Param('id', ParseUUIDPipe) id: string) {
    await this.clientsService.deleteClient(id);
    return { data: null, message: 'Cliente eliminado' };
  }
}
