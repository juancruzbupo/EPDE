import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, token: string, platform: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  async remove(token: string) {
    return this.prisma.pushToken.delete({ where: { token } }).catch(() => null);
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
