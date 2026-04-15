import { Module } from '@nestjs/common';

import { ReferralsRepository } from './referrals.repository';
import { ReferralsService } from './referrals.service';

/**
 * ReferralsModule owns the Trae un amigo program: code generation,
 * referral registration, conversion, reward recalculation, and the
 * read endpoint for the profile UI.
 *
 * Exports the service so UsersModule can call `assignReferralCodeTo`
 * and `registerReferral` during signup.
 */
@Module({
  providers: [ReferralsService, ReferralsRepository],
  exports: [ReferralsService],
})
export class ReferralsModule {}
