import { UserRole } from '@epde/shared';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Roles } from '../common/decorators/roles.decorator';
import { StrictAuth } from '../common/decorators/strict-auth.decorator';
import { StrictBlacklistGuard } from '../common/guards/strict-blacklist.guard';
import { ReferralsService } from './referrals.service';

/**
 * Admin-only referral operations. Both routes are mutations against
 * billing-adjacent state (subscription extension, denormalized counters)
 * so they're gated by `@StrictAuth()` + `StrictBlacklistGuard` — the
 * same fail-closed posture used elsewhere for destructive admin work.
 *
 * The `convert` route is the manual bridge while a real payment system
 * doesn't exist yet (see ADR-010). When the payment-confirmation flow
 * lands, it will call ReferralsService.convertReferral directly and
 * this endpoint becomes a backup for incident recovery.
 */
@ApiTags('Referrals (admin)')
@ApiBearerAuth()
@Controller('admin/referrals')
@UseGuards(StrictBlacklistGuard)
export class AdminReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /**
   * Read-only — returns the full referral state for any user. Used by the
   * admin client-detail page to show pending referrals + stats so the
   * operator knows which ones to convert. Mirrors `GET /users/me/referrals`
   * but keyed by an arbitrary userId (admin-only).
   */
  @Get('users/:userId')
  @Roles(UserRole.ADMIN)
  @StrictAuth()
  @Throttle({ medium: { limit: 60, ttl: 60_000 } })
  async getUserReferrals(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const data = await this.referralsService.getReferralStateForUser(userId);
    return { data };
  }

  /**
   * Marks a Referral as CONVERTED — bumps the referrer's convertedCount,
   * recomputes their absolute reward snapshot, and extends their
   * subscription by the delta months. Idempotent: re-calls return
   * `converted: false` without side effects.
   *
   * Body intentionally empty — admin identifies the referral by id alone.
   */
  @Post(':id/convert')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @StrictAuth()
  @Throttle({ medium: { limit: 30, ttl: 60_000 } })
  async markConverted(@Param('id', new ParseUUIDPipe()) id: string) {
    // The service uses `referredUserId` as the lookup key (its job is to
    // ack a payment). We translate the referral id into the referredUserId
    // here so the public admin URL stays referral-id-based (more intuitive
    // for the admin viewing a list of pending referrals).
    const result = await this.referralsService.markConvertedById(id);
    return { data: result };
  }

  /**
   * Drift recovery: rebuilds the referrer's `convertedCount` from the
   * Referral table and re-applies the absolute reward snapshot. No
   * notifications fired — this is reconciliation, not celebration.
   * Safe to call repeatedly.
   */
  @Post(':userId/recompute')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @StrictAuth()
  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  async recomputeReferrer(@Param('userId', new ParseUUIDPipe()) userId: string) {
    const result = await this.referralsService.recomputeReferrerState(userId);
    return { data: result };
  }
}
