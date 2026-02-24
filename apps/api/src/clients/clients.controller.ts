import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientFiltersDto } from './dto/client-filters.dto';

@Controller('clients')
@Roles('ADMIN')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async listClients(@Query() filters: ClientFiltersDto) {
    return this.clientsService.listClients(filters);
  }

  @Get(':id')
  async getClient(@Param('id') id: string) {
    const data = await this.clientsService.getClient(id);
    return { data };
  }

  @Post()
  async createClient(@Body() dto: CreateClientDto) {
    const data = await this.clientsService.createClient(dto);
    return { data, message: 'Cliente creado e invitación enviada' };
  }

  @Patch(':id')
  async updateClient(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    const data = await this.clientsService.updateClient(id, dto);
    return { data };
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: string) {
    return this.clientsService.deleteClient(id);
  }
}
