import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PropertiesService } from './properties.service';
import {
  createPropertySchema,
  updatePropertySchema,
  propertyFiltersSchema,
  UserRole,
} from '@epde/shared';
import type { CreatePropertyInput, UpdatePropertyInput, PropertyFiltersInput } from '@epde/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('Propiedades')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async listProperties(
    @Query(new ZodValidationPipe(propertyFiltersSchema)) filters: PropertyFiltersInput,
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
  @Roles(UserRole.ADMIN)
  async createProperty(
    @Body(new ZodValidationPipe(createPropertySchema)) dto: CreatePropertyInput,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.propertiesService.createProperty(dto, user.id);
    return { data, message: 'Propiedad creada' };
  }

  @Patch(':id')
  async updateProperty(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePropertySchema)) dto: UpdatePropertyInput,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const data = await this.propertiesService.updateProperty(id, dto, user);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteProperty(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.propertiesService.deleteProperty(id, user);
  }
}
