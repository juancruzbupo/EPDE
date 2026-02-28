import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@epde/shared';

const MAX_ADMIN_FETCH = 500;

@Injectable()
export class UsersRepository {
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
