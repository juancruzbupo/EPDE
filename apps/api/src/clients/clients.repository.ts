import { UserRole, UserStatus } from '@epde/shared';
import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsRepository extends BaseRepository<User, 'user'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user', true);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findFirst({ where: { email } });
  }

  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    return this.writeModel.findFirst({ where: { email } });
  }

  async findClients(params: {
    cursor?: string;
    take?: number;
    search?: string;
    status?: UserStatus;
  }): Promise<PaginatedResult<User>> {
    const where: Prisma.UserWhereInput = { role: UserRole.CLIENT };

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const findParams: FindManyParams = {
      cursor: params.cursor,
      take: params.take,
      where,
      include: { _count: { select: { properties: true } } },
      count: false,
    };

    return this.findMany(findParams);
  }
}
