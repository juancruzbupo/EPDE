import type {
  CreateQuoteTemplateInput,
  CurrentUser as CurrentUserPayload,
  UpdateQuoteTemplateInput,
} from '@epde/shared';
import { createQuoteTemplateSchema, updateQuoteTemplateSchema, UserRole } from '@epde/shared';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
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
    @Body(new ZodValidationPipe(createQuoteTemplateSchema)) dto: CreateQuoteTemplateInput,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const data = await this.service.create(dto, user);
    return { data, message: 'Plantilla creada' };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateQuoteTemplateSchema)) dto: UpdateQuoteTemplateInput,
  ) {
    const data = await this.service.update(id, dto);
    return { data, message: 'Plantilla actualizada' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(id);
  }
}
