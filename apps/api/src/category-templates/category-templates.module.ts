import { Module } from '@nestjs/common';
import { CategoryTemplatesController } from './category-templates.controller';
import { CategoryTemplatesService } from './category-templates.service';
import { CategoryTemplatesRepository } from './category-templates.repository';

@Module({
  controllers: [CategoryTemplatesController],
  providers: [CategoryTemplatesService, CategoryTemplatesRepository],
  exports: [CategoryTemplatesService, CategoryTemplatesRepository],
})
export class CategoryTemplatesModule {}
