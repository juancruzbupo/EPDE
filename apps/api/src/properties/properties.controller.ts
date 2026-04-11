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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { StrictAuth } from '../common/decorators/strict-auth.decorator';
import { StrictBlacklistGuard } from '../common/guards/strict-blacklist.guard';
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

  @Get(':id/photos')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getPropertyPhotos(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.propertiesService.getPropertyPhotos(id, user);
    return { data };
  }

  @Get(':id/health-history')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getPropertyHealthHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.propertiesService.getPropertyHealthHistory(id, user);
    return { data };
  }

  @Get(':id/health-index')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getPropertyHealthIndex(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.propertiesService.getPropertyHealthIndex(id, user);
    return { data };
  }

  @Get(':id/problems')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getPropertyProblems(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.propertiesService.getPropertyProblems(id, user);
    return { data };
  }

  @Get(':id/expenses')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getPropertyExpenses(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.propertiesService.getPropertyExpenses(id, user);
    return { data };
  }

  @Get(':id/report-data')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getReportData(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.propertiesService.getReportData(id, user);
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
  @StrictAuth()
  @UseGuards(StrictBlacklistGuard)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async deleteProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.propertiesService.deleteProperty(id, user);
    return { data: null, message: 'Propiedad eliminada' };
  }
}
