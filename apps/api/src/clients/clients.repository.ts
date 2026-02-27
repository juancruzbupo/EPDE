import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BaseRepository,
  FindManyParams,
  PaginatedResult,
} from '../common/repositories/base.repository';
import { UserRole } from '@epde/shared';

@Injectable()
export class ClientsRepository extends BaseRepository<User> {
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
    status?: string;
  }): Promise<PaginatedResult<User>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { role: UserRole.CLIENT };

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
    };

    return this.findMany(findParams);
  }
}
