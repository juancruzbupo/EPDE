import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsRepository } from './professionals.repository';
import { ProfessionalsService } from './professionals.service';

/**
 * Professionals directory — internal admin tool. See ADR-018.
 *
 * Passive entity (no auth). Matrícula (registration) is recorded on the
 * Professional row itself; the supporting document (photo of matrícula)
 * is tracked via ProfessionalAttachment with type MATRICULA + expiresAt.
 * ServiceRequest assignments + payments live in their own controllers
 * (see PR-3 in ADR-018 rollout) to keep this module focused on CRUD.
 */
@Module({
  imports: [AuthModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, ProfessionalsRepository],
  exports: [ProfessionalsService, ProfessionalsRepository],
})
export class ProfessionalsModule {}
