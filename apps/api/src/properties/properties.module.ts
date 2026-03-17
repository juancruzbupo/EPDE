import { Module } from '@nestjs/common';

import { DashboardModule } from '../dashboard/dashboard.module';
import { PropertiesController } from './properties.controller';
import { PropertiesRepository } from './properties.repository';
import { PropertiesService } from './properties.service';

@Module({
  imports: [DashboardModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesRepository],
  exports: [PropertiesService, PropertiesRepository],
})
export class PropertiesModule {}
