import { Module } from '@nestjs/common';

import { QuoteTemplatesController } from './quote-templates.controller';
import { QuoteTemplatesRepository } from './quote-templates.repository';
import { QuoteTemplatesService } from './quote-templates.service';

@Module({
  controllers: [QuoteTemplatesController],
  providers: [QuoteTemplatesService, QuoteTemplatesRepository],
  exports: [QuoteTemplatesService],
})
export class QuoteTemplatesModule {}
