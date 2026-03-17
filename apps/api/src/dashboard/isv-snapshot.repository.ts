import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ISVSnapshotRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Upsert a monthly snapshot for a property. */
  async createSnapshot(
    propertyId: string,
    snapshotDate: Date,
    data: {
      score: number;
      label: string;
      compliance: number;
      condition: number;
      coverage: number;
      investment: number;
      trend: number;
      sectorScores: Prisma.InputJsonValue;
    },
  ) {
    return this.prisma.iSVSnapshot.upsert({
      where: { propertyId_snapshotDate: { propertyId, snapshotDate } },
      create: { propertyId, snapshotDate, ...data },
      update: data,
    });
  }

  /** Get the latest N snapshots for a property (most recent first). */
  async findByProperty(propertyId: string, limit = 12) {
    return this.prisma.iSVSnapshot.findMany({
      where: { propertyId },
      orderBy: { snapshotDate: 'desc' },
      take: limit,
    });
  }

  /** Get the previous snapshot for a property (for comparison). */
  async findPrevious(propertyId: string, beforeDate: Date) {
    return this.prisma.iSVSnapshot.findFirst({
      where: { propertyId, snapshotDate: { lt: beforeDate } },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  /** Get the latest snapshot per property (for table column). */
  async findLatestForProperties(propertyIds: string[]) {
    if (propertyIds.length === 0) return [];

    // Get most recent snapshot per property using distinct
    const snapshots = await this.prisma.iSVSnapshot.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: { snapshotDate: 'desc' },
      distinct: ['propertyId'],
      select: { propertyId: true, score: true, label: true },
    });

    return snapshots;
  }

  /** Portfolio average ISV score. */
  async getPortfolioAverage(): Promise<number | null> {
    const result = await this.prisma.iSVSnapshot.aggregate({
      _avg: { score: true },
      where: {
        snapshotDate: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // last 60 days
        },
      },
    });
    return result._avg.score ? Math.round(result._avg.score) : null;
  }
}
