import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UserLookupRepository } from '../common/repositories/user-lookup.repository';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PropertiesController } from './properties.controller';
import { PropertiesRepository } from './properties.repository';
import { PropertiesService } from './properties.service';

@Module({
  imports: [DashboardModule, AuthModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, PropertiesRepository, UserLookupRepository],
  exports: [PropertiesService, PropertiesRepository],
})
export class PropertiesModule {}
