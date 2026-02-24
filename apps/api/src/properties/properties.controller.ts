import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyFiltersDto } from './dto/property-filters.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async listProperties(
    @Query() filters: PropertyFiltersDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.propertiesService.listProperties(filters, user);
  }

  @Get(':id')
  async getProperty(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    const data = await this.propertiesService.getProperty(id, user);
    return { data };
  }

  @Post()
  @Roles('ADMIN')
  async createProperty(@Body() dto: CreatePropertyDto) {
    const data = await this.propertiesService.createProperty(dto);
    return { data, message: 'Propiedad creada' };
  }

  @Patch(':id')
  async updateProperty(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const data = await this.propertiesService.updateProperty(id, dto, user);
    return { data };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async deleteProperty(@Param('id') id: string) {
    return this.propertiesService.deleteProperty(id);
  }
}
