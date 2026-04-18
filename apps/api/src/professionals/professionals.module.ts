import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsRepository } from './assignments.repository';
import { AssignmentsService } from './assignments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import { ProfessionalSubController } from './professional-sub.controller';
import { ProfessionalSubRepository } from './professional-sub.repository';
import { ProfessionalSubService } from './professional-sub.service';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsRepository } from './professionals.repository';
import { ProfessionalsService } from './professionals.service';

/**
 * Professionals directory — internal admin tool. See ADR-018.
 *
 * Services (per SIEMPRE #4): all data access goes through repositories.
 * - ProfessionalsRepository — entity CRUD + list/detail + stats aggregation
 * - ProfessionalSubRepository — ratings, notes, tags, attachments
 * - AssignmentsRepository — ServiceRequest <-> Professional linkage
 * - PaymentsRepository — per-professional payment records
 */
@Module({
  imports: [AuthModule],
  controllers: [
    ProfessionalsController,
    ProfessionalSubController,
    AssignmentsController,
    PaymentsController,
  ],
  providers: [
    ProfessionalsService,
    ProfessionalsRepository,
    ProfessionalSubService,
    ProfessionalSubRepository,
    AssignmentsService,
    AssignmentsRepository,
    PaymentsService,
    PaymentsRepository,
  ],
  exports: [ProfessionalsService, ProfessionalsRepository, AssignmentsService, PaymentsService],
})
export class ProfessionalsModule {}
