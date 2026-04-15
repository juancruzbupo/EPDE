import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * PushTokensRepository — device push registration table. Not extending
 * BaseRepository: primary write is `upsert by token`, primary read is
 * `findMany by userId` (never paginated — tokens per user are bounded),
 * and there's no soft-delete (a revoked device deletes the row). See
 * ADR-011 (append-only / upsert-centric).
 */
@Injectable()
export class PushTokensRepository {
  private readonly logger = new Logger(PushTokensRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, token: string, platform: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  async remove(token: string) {
    return this.prisma.pushToken.delete({ where: { token } }).catch((err) => {
      this.logger.warn(`Failed to remove push token: ${err}`);
      return null;
    });
  }

  async removeAllForUser(userId: string) {
    return this.prisma.pushToken.deleteMany({ where: { userId } });
  }

  async findByUserIds(userIds: string[]) {
    return this.prisma.pushToken.findMany({
      where: { userId: { in: userIds } },
      select: { token: true, userId: true },
      take: 50_000,
    });
  }
}
