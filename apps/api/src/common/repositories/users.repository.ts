import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@epde/shared';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN, deletedAt: null },
      select: { id: true },
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
