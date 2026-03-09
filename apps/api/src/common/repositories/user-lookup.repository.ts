/**
 * UserLookupRepository — lightweight, read-only user queries for cross-module use.
 *
 * Lives in `common/repositories/` because it is consumed by the Scheduler and
 * Notifications subsystems, which must NOT import UsersModule (circular-dependency risk).
 * It intentionally exposes only the minimal projections each consumer needs.
 */
import { UserRole } from '@epde/shared';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

const MAX_ADMIN_FETCH = 500;

@Injectable()
export class UserLookupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, deletedAt: null },
      select: { id: true },
      take: MAX_ADMIN_FETCH,
    });
    return admins.map((a) => a.id);
  }

  async findEmailInfo(id: string): Promise<{ email: string; name: string } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true },
    });
  }
}
