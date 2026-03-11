#!/usr/bin/env node
/**
 * check-schema-drift.mjs
 *
 * Compares Prisma model names and enum values against @epde/shared.
 * - Models: checks that each Prisma model has a corresponding Zod schema file
 * - Enums: checks that each Prisma enum exists in enums.ts with matching values
 *
 * Exits with code 1 and lists any drift, so CI catches it as a hard failure.
 *
 * Run: node scripts/check-schema-drift.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const schemaPath = resolve(root, 'apps/api/prisma/schema.prisma');
const schemaText = readFileSync(schemaPath, 'utf8');

// ===========================================================================
// 1. MODEL DRIFT — Prisma models vs @epde/shared schema files
// ===========================================================================
const modelNames = [...schemaText.matchAll(/^model\s+(\w+)\s+\{/gm)].map((m) => m[1]);
const sharedSchemasDir = resolve(root, 'packages/shared/src/schemas');

/** Convert PascalCase to kebab-case: "MaintenancePlan" → "maintenance-plan" */
function toKebab(name) {
  return name.replace(/([A-Z])/g, (match, _p1, offset) =>
    (offset > 0 ? '-' : '') + match.toLowerCase(),
  );
}

/**
 * Explicit overrides: models whose schema lives in a non-default file.
 * Key = Prisma model name, value = schema file basename (without .ts).
 */
const MODEL_TO_SCHEMA_FILE = {
  BudgetRequest: 'budget',
  BudgetLineItem: 'budget',
  BudgetResponse: 'budget',
  ServiceRequestPhoto: 'service-request',
  CategoryTemplate: 'task-template',
  TaskTemplate: 'task-template',
  TaskLog: 'task-log',
  TaskNote: 'task-note',
  MaintenancePlan: 'maintenance-plan',
};

/**
 * Models that are intentionally schema-less in @epde/shared.
 * These are internal/derived models that are never validated from user input.
 */
const SCHEMA_EXEMPT_MODELS = new Set(['Notification', 'TaskAuditLog', 'AuthAuditLog']);

const missingModels = [];

for (const model of modelNames) {
  if (SCHEMA_EXEMPT_MODELS.has(model)) continue;
  const fileBase = MODEL_TO_SCHEMA_FILE[model] ?? toKebab(model);
  const filePath = resolve(sharedSchemasDir, `${fileBase}.ts`);
  if (!existsSync(filePath)) {
    missingModels.push({ model, expectedFile: `packages/shared/src/schemas/${fileBase}.ts` });
  }
}

// ===========================================================================
// 2. ENUM DRIFT — Prisma enum values vs @epde/shared enums.ts values
// ===========================================================================
const enumsFilePath = resolve(root, 'packages/shared/src/types/enums.ts');
const enumsText = existsSync(enumsFilePath) ? readFileSync(enumsFilePath, 'utf8') : '';

/** Parse Prisma enums: { EnumName: ['VALUE1', 'VALUE2', ...] } */
function parsePrismaEnums(text) {
  const enums = {};
  const enumRegex = /^enum\s+(\w+)\s+\{([^}]+)\}/gm;
  let match;
  while ((match = enumRegex.exec(text)) !== null) {
    const name = match[1];
    const values = match[2]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//'));
    enums[name] = values;
  }
  return enums;
}

/**
 * Parse @epde/shared enums.ts: extract `as const` object values.
 * Matches pattern: `export const EnumName = { KEY: 'VALUE', ... } as const;`
 */
function parseSharedEnums(text) {
  const enums = {};
  const constRegex = /export\s+const\s+(\w+)\s*=\s*\{([^}]+)\}\s*as\s+const/g;
  let match;
  while ((match = constRegex.exec(text)) !== null) {
    const name = match[1];
    const body = match[2];
    // Extract values from `KEY: 'VALUE'` pairs
    const values = [...body.matchAll(/(\w+)\s*:\s*'(\w+)'/g)].map((m) => m[2]);
    if (values.length > 0) {
      enums[name] = values;
    }
  }
  return enums;
}

const prismaEnums = parsePrismaEnums(schemaText);
const sharedEnums = parseSharedEnums(enumsText);

const enumDrift = [];

for (const [enumName, prismaValues] of Object.entries(prismaEnums)) {
  const sharedValues = sharedEnums[enumName];
  if (!sharedValues) {
    enumDrift.push({ enum: enumName, issue: 'missing in @epde/shared enums.ts' });
    continue;
  }

  const prismaSet = new Set(prismaValues);
  const sharedSet = new Set(sharedValues);

  const inPrismaOnly = prismaValues.filter((v) => !sharedSet.has(v));
  const inSharedOnly = sharedValues.filter((v) => !prismaSet.has(v));

  if (inPrismaOnly.length > 0) {
    enumDrift.push({
      enum: enumName,
      issue: `values in Prisma but NOT in shared: ${inPrismaOnly.join(', ')}`,
    });
  }
  if (inSharedOnly.length > 0) {
    enumDrift.push({
      enum: enumName,
      issue: `values in shared but NOT in Prisma: ${inSharedOnly.join(', ')}`,
    });
  }
}

// ===========================================================================
// 3. Report
// ===========================================================================
const prismaEnumCount = Object.keys(prismaEnums).length;
const sharedEnumCount = Object.keys(sharedEnums).length;
const totalIssues = missingModels.length + enumDrift.length;

console.log(
  `\nSchema drift check — ${modelNames.length} models, ${prismaEnumCount} Prisma enums vs ${sharedEnumCount} shared enums\n`,
);

if (missingModels.length > 0) {
  console.error(`⚠ Model drift — ${missingModels.length} model(s) without a schema file:\n`);
  for (const { model, expectedFile } of missingModels) {
    console.error(`  • ${model}  →  expected: ${expectedFile}`);
  }
  console.error('');
}

if (enumDrift.length > 0) {
  console.error(`⚠ Enum drift — ${enumDrift.length} issue(s):\n`);
  for (const { enum: name, issue } of enumDrift) {
    console.error(`  • ${name}: ${issue}`);
  }
  console.error('');
}

if (totalIssues === 0) {
  console.log('✓ No drift detected. All Prisma models and enums match @epde/shared.\n');
  process.exit(0);
} else {
  console.error(
    'Fix the drift above: add missing schema files, update MODEL_TO_SCHEMA_FILE, or sync enum values.\n',
  );
  process.exit(1);
}
