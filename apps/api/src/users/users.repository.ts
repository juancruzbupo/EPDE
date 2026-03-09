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
}
