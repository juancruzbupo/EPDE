import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AdminReferralsController } from './admin-referrals.controller';
import { ReferralsController } from './referrals.controller';
import { ReferralsRepository } from './referrals.repository';
import { ReferralsService } from './referrals.service';

/**
 * ReferralsModule owns the Trae un amigo program: code generation,
 * referral registration, conversion, reward recalculation, the user-
 * facing read endpoint, and the admin convert/recompute endpoints.
 *
 * Imports:
 *   - AuthModule — StrictBlacklistGuard on the admin controller.
 *   - NotificationsModule — post-conversion milestone + admin-alert
 *     handlers (see ReferralsService.convertReferral).
 *   - UsersModule — `UsersRepository.setReferralCode / findByReferralCode /
 *     findForReferralNotification / findReferralCounter /
 *     applyReferralCounters / findReferralState`. Data access for the User
 *     side of the referral flow lives in UsersRepository because the
 *     underlying entity is User (SIEMPRE #4).
 *
 * Exports the service so ClientsModule can call `assignReferralCodeTo`
 * and `registerReferral` during signup.
 */
@Module({
  imports: [AuthModule, NotificationsModule, UsersModule],
  controllers: [ReferralsController, AdminReferralsController],
  providers: [ReferralsService, ReferralsRepository],
  exports: [ReferralsService],
})
export class ReferralsModule {}
