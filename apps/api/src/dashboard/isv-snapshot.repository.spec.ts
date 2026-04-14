import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ISVSnapshotRepository } from './isv-snapshot.repository';

/**
 * Guardrail: historical ISVSnapshots created before commit 43f624b store
 * `trend = 50` (legacy neutral value — see docs/adr/004-isv-health-index.md
 * and isv-snapshot.service.ts for the full story).
 *
 * No current caller reads the `trend` field from these batch lookups. If a
 * future dev adds `trend: true` to either select, old snapshots silently
 * expose wrong values. These tests fail fast when that happens so the dev
 * has to look at the docs and decide whether to do a time-machine backfill
 * or scope around the legacy rows.
 */
describe('ISVSnapshotRepository — dimension-field exposure guardrail', () => {
  let repository: ISVSnapshotRepository;
  let findManyMock: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    findManyMock = jest.fn().mockResolvedValue([]);
    const module = await Test.createTestingModule({
      providers: [
        ISVSnapshotRepository,
        {
          provide: PrismaService,
          useValue: {
            iSVSnapshot: { findMany: findManyMock },
          },
        },
      ],
    }).compile();

    repository = module.get(ISVSnapshotRepository);
  });

  const DIMENSION_FIELDS = ['compliance', 'condition', 'coverage', 'investment', 'trend'];

  it('findLatestForProperties selects only propertyId/score/label', async () => {
    await repository.findLatestForProperties(['p1', 'p2']);

    expect(findManyMock).toHaveBeenCalledTimes(1);
    const args = findManyMock.mock.calls[0]![0] as { select: Record<string, unknown> };
    expect(args.select).toEqual({ propertyId: true, score: true, label: true });

    for (const field of DIMENSION_FIELDS) {
      expect(args.select).not.toHaveProperty(field);
    }
  });

  it('findPreviousForProperties selects only propertyId/score', async () => {
    await repository.findPreviousForProperties(['p1'], new Date('2026-01-01'));

    expect(findManyMock).toHaveBeenCalledTimes(1);
    const args = findManyMock.mock.calls[0]![0] as { select: Record<string, unknown> };
    expect(args.select).toEqual({ propertyId: true, score: true });

    for (const field of DIMENSION_FIELDS) {
      expect(args.select).not.toHaveProperty(field);
    }
  });

  it('findLatestForProperties returns empty array for empty input (no DB hit)', async () => {
    const result = await repository.findLatestForProperties([]);
    expect(result).toEqual([]);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it('findPreviousForProperties returns empty Map for empty input (no DB hit)', async () => {
    const result = await repository.findPreviousForProperties([], new Date());
    expect(result.size).toBe(0);
    expect(findManyMock).not.toHaveBeenCalled();
  });
});
