import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PropertiesModule } from '../properties/properties.module';
import { UsersModule } from '../users/users.module';
import { TechnicalInspectionsController } from './technical-inspections.controller';
import { TechnicalInspectionsRepository } from './technical-inspections.repository';
import { TechnicalInspectionsService } from './technical-inspections.service';

/**
 * Technical Inspections — paid professional service (ADR-019).
 *
 * Distinct from Certificate of Maintenance (automatic, free, historical)
 * and from ServiceRequest (general maintenance work assigned to third-party
 * professionals). Technical inspections are executed directly by Noelia with
 * her matrícula, produce a signed PDF deliverable, and have a fixed price
 * structure with client discount.
 *
 * Depends on:
 * - PropertiesModule for ownership validation
 * - UsersModule for subscription-active checks (client must have active plan)
 */
@Module({
  imports: [AuthModule, PropertiesModule, UsersModule],
  controllers: [TechnicalInspectionsController],
  providers: [TechnicalInspectionsService, TechnicalInspectionsRepository],
  exports: [TechnicalInspectionsService, TechnicalInspectionsRepository],
})
export class TechnicalInspectionsModule {}
