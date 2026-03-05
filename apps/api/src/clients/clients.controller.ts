import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ClientsService } from './clients.service';
import {
  createClientSchema,
  updateClientSchema,
  clientFiltersSchema,
  UserRole,
} from '@epde/shared';
import type { CreateClientInput, UpdateClientInput, ClientFiltersInput } from '@epde/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

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
  async createClient(@Body(new ZodValidationPipe(createClientSchema)) dto: CreateClientInput) {
    const data = await this.clientsService.createClient(dto);
    return { data, message: 'Cliente creado e invitación enviada' };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateClient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateClientSchema)) dto: UpdateClientInput,
  ) {
    const data = await this.clientsService.updateClient(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteClient(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.clientsService.deleteClient(id);
    return { data, message: 'Cliente eliminado' };
  }
}
