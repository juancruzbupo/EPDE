import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.softDelete.user.findFirst({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.softDelete.user.findFirst({ where: { id } });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findMany(params?: { skip?: number; take?: number; where?: Prisma.UserWhereInput }) {
    return this.prisma.softDelete.user.findMany({
      where: params?.where,
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
