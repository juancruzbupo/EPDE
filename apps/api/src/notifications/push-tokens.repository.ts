import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

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
    });
  }
}
