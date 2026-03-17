import { Module } from '@nestjs/common';

import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';
import { ISVSnapshotRepository } from './isv-snapshot.repository';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, ISVSnapshotRepository],
  exports: [DashboardRepository, ISVSnapshotRepository],
})
export class DashboardModule {}
