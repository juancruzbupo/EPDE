import type { CurrentUser as CurrentUserPayload } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { QuoteTemplatesService } from './quote-templates.service';

@ApiTags('Plantillas de Cotización')
@ApiBearerAuth()
@Controller('quote-templates')
@Roles(UserRole.ADMIN)
export class QuoteTemplatesController {
  constructor(private readonly service: QuoteTemplatesService) {}

  @Get()
  async findAll() {
    const data = await this.service.findAll();
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.findById(id);
    return { data };
  }

  @Post()
  async create(
    @Body()
    dto: { name: string; items: { description: string; quantity: number; unitPrice: number }[] },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.service.create(dto, user);
    return { data, message: 'Plantilla creada' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    dto: { name?: string; items?: { description: string; quantity: number; unitPrice: number }[] },
  ) {
    const data = await this.service.update(id, dto);
    return { data, message: 'Plantilla actualizada' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(id);
  }
}
