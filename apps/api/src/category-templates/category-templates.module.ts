import { Module } from '@nestjs/common';
import { CategoryTemplatesController } from './category-templates.controller';
import { CategoryTemplatesService } from './category-templates.service';
import { CategoryTemplatesRepository } from './category-templates.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CategoryTemplatesController],
  providers: [CategoryTemplatesService, CategoryTemplatesRepository, PrismaService],
  exports: [CategoryTemplatesService, CategoryTemplatesRepository],
})
export class CategoryTemplatesModule {}
