import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertiesRepository } from './properties.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesRepository, PrismaService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
