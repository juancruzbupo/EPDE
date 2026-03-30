import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LandingSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(key: string) {
    return this.prisma.landingSettings.findUnique({ where: { key } });
  }

  async findAll() {
    return this.prisma.landingSettings.findMany();
  }

  async upsert(key: string, value: Prisma.InputJsonValue, updatedBy: string) {
    return this.prisma.landingSettings.upsert({
      where: { key },
      update: { value, updatedBy },
      create: { key, value, updatedBy },
    });
  }
}
