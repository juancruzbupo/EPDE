import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/**
 * LandingSettingsRepository
 *
 * Intentionally bypasses BaseRepository because:
 * 1. Key-value store pattern — LandingSettings is a flat key-value table, not a domain entity
 *    with ID-based pagination or soft-delete semantics.
 * 2. No cursor pagination — settings are fetched all at once (bounded by take: 50).
 * 3. Upsert-centric — the primary write operation is upsert by key, not create/update by ID.
 * If LandingSettings grows to require versioning or audit trail, add deletedAt + migrate then.
 */
@Injectable()
export class LandingSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(key: string) {
    return this.prisma.landingSettings.findUnique({ where: { key } });
  }

  async findAll() {
    return this.prisma.landingSettings.findMany({
      orderBy: { key: 'asc' },
      take: 50,
    });
  }

  async upsert(key: string, value: Prisma.InputJsonValue, updatedBy: string) {
    return this.prisma.landingSettings.upsert({
      where: { key },
      update: { value, updatedBy },
      create: { key, value, updatedBy },
    });
  }
}
