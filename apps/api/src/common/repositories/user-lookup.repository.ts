/**
 * UserLookupRepository — lightweight, read-only user queries for cross-module use.
 *
 * Lives in `common/repositories/` because it is consumed by the Scheduler and
 * Notifications subsystems, which must NOT import UsersModule (circular-dependency risk).
 * It intentionally exposes only the minimal projections each consumer needs.
 */
import { UserRole } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

const MAX_ADMIN_FETCH = 500;

@Injectable()
export class UserLookupRepository {
  private readonly logger = new Logger(UserLookupRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAdminIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, deletedAt: null },
      select: { id: true },
      take: MAX_ADMIN_FETCH,
    });
    // If we hit the cap, callers are silently missing admins. Surface it so it's
    // investigable before someone wonders why a notification didn't arrive.
    if (admins.length === MAX_ADMIN_FETCH) {
      this.logger.warn(
        `findAdminIds hit MAX_ADMIN_FETCH=${MAX_ADMIN_FETCH} — additional admins are being silently excluded`,
      );
    }
    return admins.map((a) => a.id);
  }

  async findEmailInfo(id: string): Promise<{ email: string; name: string } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true },
    });
  }
}
