import { Module } from '@nestjs/common';

import { CategoryTemplatesController } from './category-templates.controller';
import { CategoryTemplatesRepository } from './category-templates.repository';
import { CategoryTemplatesService } from './category-templates.service';

@Module({
  controllers: [CategoryTemplatesController],
  providers: [CategoryTemplatesService, CategoryTemplatesRepository],
  exports: [CategoryTemplatesService, CategoryTemplatesRepository],
})
export class CategoryTemplatesModule {}
