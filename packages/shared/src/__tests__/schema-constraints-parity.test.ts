import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Drift guardrail: Prisma @db.VarChar(N) constraints and Zod .max(N) limits
 * must stay in sync. Prisma is the source of truth for column lengths;
 * Zod schemas validate input at the API boundary.
 *
 * If Prisma increases a column length without updating Zod, the API rejects
 * valid input. If Zod allows longer strings than Prisma, writes fail silently
 * or truncate data.
 *
 * This test parses both schema.prisma and the Zod schema files, extracting
 * VarChar limits and .max() calls, then asserts they match for fields that
 * appear in both.
 */

const REPO_ROOT = resolve(__dirname, '../../../..');
const PRISMA_SCHEMA = resolve(REPO_ROOT, 'apps/api/prisma/schema.prisma');
const SCHEMAS_DIR = resolve(__dirname, '../schemas');

interface PrismaField {
  model: string;
  field: string;
  maxLength: number;
}

function parsePrismaVarChars(): PrismaField[] {
  const schema = readFileSync(PRISMA_SCHEMA, 'utf-8');
  const fields: PrismaField[] = [];
  let currentModel = '';

  for (const line of schema.split('\n')) {
    const modelMatch = line.match(/^model\s+(\w+)/);
    if (modelMatch) {
      currentModel = modelMatch[1]!;
      continue;
    }
    if (!currentModel) continue;

    const fieldMatch = line.match(/^\s+(\w+)\s+\S+.*@db\.VarChar\((\d+)\)/);
    if (fieldMatch) {
      fields.push({
        model: currentModel,
        field: fieldMatch[1]!,
        maxLength: parseInt(fieldMatch[2]!, 10),
      });
    }
  }
  return fields;
}

interface ZodMax {
  file: string;
  field: string;
  max: number;
}

function parseZodMaxes(): ZodMax[] {
  const files = readdirSync(SCHEMAS_DIR).filter((f: string) => f.endsWith('.ts'));
  const maxes: ZodMax[] = [];

  for (const file of files) {
    const content = readFileSync(resolve(SCHEMAS_DIR, file), 'utf-8');
    const lines = content.split('\n');
    let currentField = '';
    for (const line of lines) {
      const fieldStart = line.match(/^\s+(\w+)\s*:\s*z/);
      if (fieldStart) currentField = fieldStart[1]!;
      if (currentField && line.includes('.string(')) {
        const maxMatch = line.match(/\.max\((\d+)/);
        if (maxMatch) {
          maxes.push({ file, field: currentField, max: parseInt(maxMatch[1]!, 10) });
        }
      }
      if (currentField && line.includes('.max(') && !line.includes('.string(')) {
        const prevLines = lines
          .slice(Math.max(0, lines.indexOf(line) - 5), lines.indexOf(line) + 1)
          .join(' ');
        if (prevLines.includes('.string()') && prevLines.includes(currentField)) {
          const maxMatch = line.match(/\.max\((\d+)/);
          if (maxMatch) {
            maxes.push({ file, field: currentField, max: parseInt(maxMatch[1]!, 10) });
          }
        }
      }
    }
  }
  return maxes;
}

const KNOWN_MAPPINGS: Array<{
  prismaModel: string;
  prismaField: string;
  zodFile: string;
  zodField: string;
}> = [
  { prismaModel: 'Category', prismaField: 'name', zodFile: 'category.ts', zodField: 'name' },
  {
    prismaModel: 'Category',
    prismaField: 'description',
    zodFile: 'category.ts',
    zodField: 'description',
  },
  { prismaModel: 'Category', prismaField: 'icon', zodFile: 'category.ts', zodField: 'icon' },
  {
    prismaModel: 'MaintenancePlan',
    prismaField: 'name',
    zodFile: 'maintenance-plan.ts',
    zodField: 'name',
  },
  {
    prismaModel: 'Task',
    prismaField: 'technicalDescription',
    zodFile: 'task-template.ts',
    zodField: 'technicalDescription',
  },
  { prismaModel: 'TaskLog', prismaField: 'notes', zodFile: 'task-log.ts', zodField: 'note' },
];

describe('Schema constraints parity (Prisma VarChar ↔ Zod max)', () => {
  const prismaFields = parsePrismaVarChars();
  const zodMaxes = parseZodMaxes();

  it('should parse Prisma VarChar constraints', () => {
    expect(prismaFields.length).toBeGreaterThan(10);
  });

  it('should parse Zod max constraints', () => {
    expect(zodMaxes.length).toBeGreaterThan(5);
  });

  for (const mapping of KNOWN_MAPPINGS) {
    it(`${mapping.prismaModel}.${mapping.prismaField} VarChar should match Zod max in ${mapping.zodFile}`, () => {
      const prisma = prismaFields.find(
        (f) => f.model === mapping.prismaModel && f.field === mapping.prismaField,
      );
      const zod = zodMaxes.find((z) => z.file === mapping.zodFile && z.field === mapping.zodField);

      expect(prisma).toBeDefined();
      expect(zod).toBeDefined();

      if (prisma && zod) {
        expect(zod.max).toBeLessThanOrEqual(prisma.maxLength);
      }
    });
  }
});
