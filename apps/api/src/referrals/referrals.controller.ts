import type { CurrentUser as CurrentUserPayload } from '@epde/shared';
import { UserRole } from '@epde/shared';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ReferralsService } from './referrals.service';

/**
 * Self-serve referral state for the authenticated user. Returns the
 * full payload the profile page renders (code, stats, milestones,
 * history). Both CLIENT and ADMIN can read their own state.
 */
@ApiTags('Referrals')
@ApiBearerAuth()
@Controller('users/me/referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  async getMyReferrals(@CurrentUser() user: CurrentUserPayload) {
    const data = await this.referralsService.getReferralStateForUser(user.id);
    return { data };
  }
}
