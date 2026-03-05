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
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async listProperties(
    @Query(new ZodValidationPipe(propertyFiltersSchema)) filters: PropertyFiltersInput,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.propertiesService.listProperties(filters, user);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
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
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async updateProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updatePropertySchema)) dto: UpdatePropertyInput,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const data = await this.propertiesService.updateProperty(id, dto, user);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async deleteProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const data = await this.propertiesService.deleteProperty(id, user);
    return { data, message: 'Propiedad eliminada' };
  }
}
