import type { CurrentUser as CurrentUserType } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { LandingSettingsService } from './landing-settings.service';

@ApiTags('Landing Settings')
@Controller('landing-settings')
export class LandingSettingsController {
  constructor(private readonly service: LandingSettingsService) {}

  /** Public — landing page fetches this without auth. */
  @Public()
  @Get()
  async getAll() {
    const data = await this.service.getAll();
    return { data };
  }

  @Roles(UserRole.ADMIN)
  @Patch(':key')
  async update(
    @Param('key') key: 'pricing' | 'faq' | 'consequences' | 'general',
    @Body() body: { value: unknown },
    @CurrentUser() user: CurrentUserType,
  ) {
    const data = await this.service.update(key, body.value as Prisma.InputJsonValue, user);
    return { data, message: 'Configuración actualizada' };
  }
}
