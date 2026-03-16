import type {
  CreatePropertyInput,
  CurrentUser as CurrentUserPayload,
  PropertyFiltersInput,
  UpdatePropertyInput,
} from '@epde/shared';
import {
  createPropertySchema,
  propertyFiltersSchema,
  updatePropertySchema,
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

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PropertiesService } from './properties.service';

@ApiTags('Propiedades')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async listProperties(
    @Query(new ZodValidationPipe(propertyFiltersSchema)) filters: PropertyFiltersInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.propertiesService.listProperties(filters, user);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.propertiesService.getProperty(id, user);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async createProperty(
    @Body(new ZodValidationPipe(createPropertySchema)) dto: CreatePropertyInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.propertiesService.createProperty(dto, user.id);
    return { data, message: 'Propiedad creada' };
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async updateProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updatePropertySchema)) dto: UpdatePropertyInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.propertiesService.updateProperty(id, dto, user);
    return { data, message: 'Propiedad actualizada' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async deleteProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.propertiesService.deleteProperty(id, user);
  }
}
