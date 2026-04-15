import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ReferralStatus } from '../types/entities/referral';
import {
  ActionTaken,
  BudgetStatus,
  ConditionFound,
  InspectionChecklistStatus,
  InspectionItemStatus,
  NotificationType,
  PlanStatus,
  ProfessionalRequirement,
  PropertySector,
  PropertyType,
  RecurrenceType,
  ServiceStatus,
  ServiceUrgency,
  TaskExecutor,
  TaskPriority,
  TaskResult,
  TaskStatus,
  TaskType,
  UserRole,
  UserStatus,
} from '../types/enums';

/**
 * Drift guardrail: Prisma enums and TypeScript enums in @epde/shared must
 * stay in sync. Prisma is the source of truth for the database column values;
 * the TS enums power both Zod validation (via X_VALUES arrays derived from
 * Object.values(X)) and all type-level usage across api/web/mobile.
 *
 * If Prisma adds a value the TS enum lacks, Zod will reject valid rows on
 * read. If the TS enum adds a value Prisma lacks, Zod will accept input
 * that the DB rejects at write time. Either drift is silent in CI without
 * this test.
 *
 * When you add or remove a Prisma enum value:
 *   1. Update `apps/api/prisma/schema.prisma`.
 *   2. Update the corresponding TS enum in either
 *      `packages/shared/src/types/enums.ts` or
 *      `packages/shared/src/types/entities/referral.ts`.
 *   3. Run this test — it asserts both sides match exactly.
 */

const REPO_ROOT = resolve(__dirname, '../../../..');
const PRISMA_SCHEMA = resolve(REPO_ROOT, 'apps/api/prisma/schema.prisma');

/**
 * Prisma enum name → runtime TS enum object. Add an entry when a new Prisma
 * enum ships. Missing entries fail the test with an explicit message.
 *
 * `ActivityType` is intentionally absent — it is a TS-only enum for the
 * dashboard activity feed and has no DB column.
 */
const ENUM_MAP: Record<string, Record<string, string>> = {
  UserRole,
  UserStatus,
  PropertyType,
  PlanStatus,
  TaskPriority,
  RecurrenceType,
  TaskStatus,
  BudgetStatus,
  ServiceUrgency,
  ServiceStatus,
  NotificationType,
  TaskType,
  ProfessionalRequirement,
  TaskResult,
  ConditionFound,
  TaskExecutor,
  ActionTaken,
  PropertySector,
  InspectionItemStatus,
  InspectionChecklistStatus,
  ReferralStatus,
};

function parsePrismaEnums(schemaPath: string): Map<string, string[]> {
  const content = readFileSync(schemaPath, 'utf-8');
  const enums = new Map<string, string[]>();
  const enumRegex = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  for (const match of content.matchAll(enumRegex)) {
    const [, name, body] = match;
    const values = body
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, '').trim())
      .filter((line) => line.length > 0 && /^[A-Z_]+$/.test(line))
      .sort();
    enums.set(name, values);
  }
  return enums;
}

describe('Prisma ↔ TS enum sync', () => {
  const prismaEnums = parsePrismaEnums(PRISMA_SCHEMA);

  it('every Prisma enum has a TS counterpart registered in ENUM_MAP', () => {
    const unmapped = [...prismaEnums.keys()].filter((name) => !(name in ENUM_MAP));
    expect(
      unmapped,
      `Prisma enums missing a TS counterpart in ENUM_MAP: ${unmapped.join(', ')}. ` +
        `Add the TS enum to packages/shared/src/types/enums.ts and register it here.`,
    ).toEqual([]);
  });

  it('every registered TS enum corresponds to a real Prisma enum', () => {
    const orphans = Object.keys(ENUM_MAP).filter((name) => !prismaEnums.has(name));
    expect(
      orphans,
      `ENUM_MAP entries with no matching Prisma enum: ${orphans.join(', ')}. ` +
        `Remove them from ENUM_MAP or add the enum to schema.prisma.`,
    ).toEqual([]);
  });

  for (const [name, tsEnum] of Object.entries(ENUM_MAP)) {
    it(`${name} values match between Prisma and TS`, () => {
      const prismaValues = prismaEnums.get(name);
      expect(prismaValues, `Prisma enum ${name} not found`).toBeDefined();
      const tsValues = Object.values(tsEnum).sort();
      expect(tsValues).toEqual(prismaValues);
    });
  }
});
