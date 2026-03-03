#!/usr/bin/env node
/**
 * check-schema-drift.mjs
 *
 * Compares Prisma model names against @epde/shared Zod schema files.
 * Exits with code 1 and lists any Prisma models that lack a corresponding
 * schema file, so CI can catch drift early (continue-on-error: true in CI
 * so it is advisory rather than blocking).
 *
 * Run: node scripts/check-schema-drift.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// 1. Parse Prisma schema for model names
// ---------------------------------------------------------------------------
const schemaPath = resolve(root, 'apps/api/prisma/schema.prisma');
const schemaText = readFileSync(schemaPath, 'utf8');
const modelNames = [...schemaText.matchAll(/^model\s+(\w+)\s+\{/gm)].map((m) => m[1]);

// ---------------------------------------------------------------------------
// 2. Map each model to the expected @epde/shared schema file(s).
//    Models that share a file are grouped explicitly; the default rule
//    converts PascalCase → kebab-case.
// ---------------------------------------------------------------------------
const sharedSchemasDir = resolve(root, 'packages/shared/src/schemas');

/** Convert PascalCase to kebab-case: "MaintenancePlan" → "maintenance-plan" */
function toKebab(name) {
  return name
    .replace(/([A-Z])/g, (match, _p1, offset) => (offset > 0 ? '-' : '') + match.toLowerCase());
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

// ---------------------------------------------------------------------------
// 3. Check each model
// ---------------------------------------------------------------------------
const missing = [];

for (const model of modelNames) {
  if (SCHEMA_EXEMPT_MODELS.has(model)) continue;
  const fileBase = MODEL_TO_SCHEMA_FILE[model] ?? toKebab(model);
  const filePath = resolve(sharedSchemasDir, `${fileBase}.ts`);
  if (!existsSync(filePath)) {
    missing.push({ model, expectedFile: `packages/shared/src/schemas/${fileBase}.ts` });
  }
}

// ---------------------------------------------------------------------------
// 4. Report
// ---------------------------------------------------------------------------
console.log(`\nSchema drift check — ${modelNames.length} Prisma models vs @epde/shared schemas\n`);

if (missing.length === 0) {
  console.log('✓ No drift detected. All Prisma models have a corresponding schema file.\n');
  process.exit(0);
} else {
  console.error(`⚠ Drift detected — ${missing.length} model(s) without a schema file:\n`);
  for (const { model, expectedFile } of missing) {
    console.error(`  • ${model}  →  expected: ${expectedFile}`);
  }
  console.error(
    '\nAdd the missing schema file(s) or update the MODEL_TO_SCHEMA_FILE map in scripts/check-schema-drift.mjs.\n',
  );
  process.exit(1);
}
