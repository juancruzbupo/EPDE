import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AdminReferralsController } from './admin-referrals.controller';
import { ReferralsController } from './referrals.controller';
import { ReferralsRepository } from './referrals.repository';
import { ReferralsService } from './referrals.service';

/**
 * ReferralsModule owns the Trae un amigo program: code generation,
 * referral registration, conversion, reward recalculation, the user-
 * facing read endpoint, and the admin convert/recompute endpoints.
 *
 * Exports the service so ClientsModule can call `assignReferralCodeTo`
 * and `registerReferral` during signup. Imports AuthModule so the
 * StrictBlacklistGuard on the admin controller has its dependencies
 * resolved.
 */
@Module({
  imports: [AuthModule],
  controllers: [ReferralsController, AdminReferralsController],
  providers: [ReferralsService, ReferralsRepository],
  exports: [ReferralsService],
})
export class ReferralsModule {}
