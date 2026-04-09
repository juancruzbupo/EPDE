import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { BaseRepository } from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository extends BaseRepository<User, 'user'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user', true);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findFirst({ where: { email } });
  }

  /** Find active clients whose subscription expires within the given time window. */
  async findExpiringSubscriptions(
    windowStart: Date,
    windowEnd: Date,
    take = 500,
  ): Promise<Pick<User, 'id' | 'name' | 'email' | 'subscriptionExpiresAt'>[]> {
    return this.model.findMany({
      where: {
        role: 'CLIENT',
        status: 'ACTIVE',
        subscriptionExpiresAt: { gte: windowStart, lte: windowEnd },
        deletedAt: null,
      },
      select: { id: true, name: true, email: true, subscriptionExpiresAt: true },
      take,
    });
  }

  /** All active clients with non-expired subscriptions (for weekly push summaries). Cap at 10K. */
  async findActiveClients() {
    return this.prisma.softDelete.user.findMany({
      where: {
        role: 'CLIENT',
        status: 'ACTIVE',
        OR: [{ subscriptionExpiresAt: { gte: new Date() } }, { subscriptionExpiresAt: null }],
      },
      select: { id: true, name: true, email: true },
      take: 10_000,
    });
  }
}
