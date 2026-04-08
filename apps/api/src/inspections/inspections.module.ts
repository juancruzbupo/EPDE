import { Module } from '@nestjs/common';

import { InspectionsController } from './inspections.controller';
import { InspectionsRepository } from './inspections.repository';
import { InspectionsService } from './inspections.service';

@Module({
  controllers: [InspectionsController],
  providers: [InspectionsService, InspectionsRepository],
  exports: [InspectionsService],
})
export class InspectionsModule {}
