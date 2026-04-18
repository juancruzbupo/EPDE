import type {
  CreateProfessionalInput,
  CurrentUser as CurrentUserPayload,
  ProfessionalFiltersInput,
  UpdateAvailabilityInput,
  UpdateProfessionalInput,
  UpdateTierInput,
} from '@epde/shared';
import {
  createProfessionalSchema,
  professionalFiltersSchema,
  updateAvailabilitySchema,
  updateProfessionalSchema,
  updateTierSchema,
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

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { StrictAuth } from '../common/decorators/strict-auth.decorator';
import { StrictBlacklistGuard } from '../common/guards/strict-blacklist.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ProfessionalsService } from './professionals.service';

@ApiTags('Profesionales')
@ApiBearerAuth()
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly service: ProfessionalsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async list(
    @Query(new ZodValidationPipe(professionalFiltersSchema)) filters: ProfessionalFiltersInput,
  ) {
    return this.service.list(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.get(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createProfessionalSchema)) dto: CreateProfessionalInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.service.create(dto, user.id);
    return { data, message: 'Profesional creado' };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @Throttle({ medium: { limit: 20, ttl: 60_000 } })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateProfessionalSchema)) dto: UpdateProfessionalInput,
  ) {
    const data = await this.service.update(id, dto);
    return { data, message: 'Profesional actualizado' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @StrictAuth()
  @UseGuards(StrictBlacklistGuard)
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id);
    return { data: null, message: 'Profesional eliminado' };
  }

  @Patch(':id/tier')
  @Roles(UserRole.ADMIN)
  async updateTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTierSchema)) dto: UpdateTierInput,
  ) {
    const data = await this.service.updateTier(id, dto);
    return { data, message: 'Tier actualizado' };
  }

  @Patch(':id/availability')
  @Roles(UserRole.ADMIN)
  async updateAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAvailabilitySchema)) dto: UpdateAvailabilityInput,
  ) {
    const data = await this.service.updateAvailability(id, dto);
    return { data, message: 'Disponibilidad actualizada' };
  }
}
