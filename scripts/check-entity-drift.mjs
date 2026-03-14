#!/usr/bin/env node
/**
 * check-entity-drift.mjs
 *
 * Detects drift between Prisma scalar fields and TypeScript entity interfaces.
 *
 * For each of the 6 main models it:
 *   1. Extracts scalar field names from schema.prisma (skips relation fields,
 *      @@-directives and comment lines).
 *   2. Reads the corresponding entity .ts file and extracts the property names
 *      declared on the primary interface (the one that matches the model name).
 *   3. Reports every field that exists in Prisma but is absent from the interface.
 *
 * Fields listed in KNOWN_OMISSIONS for a given model are intentional gaps and
 * are silently skipped.  Fields contributed by BaseEntity / SoftDeletable are
 * resolved automatically.
 *
 * Exits 0 when clean, 1 when drift is found.
 *
 * Run: node scripts/check-entity-drift.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ─── Paths ────────────────────────────────────────────────────────────────────

const SCHEMA_PATH = resolve(root, 'apps/api/prisma/schema.prisma');
const ENTITIES_DIR = resolve(root, 'packages/shared/src/types/entities');
const SHARED_TYPES_INDEX = resolve(root, 'packages/shared/src/types/index.ts');

// ─── Models to check ─────────────────────────────────────────────────────────

/**
 * Map of Prisma model name → entity file basename (without .ts).
 * Only the 6 core models that have a dedicated interface are checked.
 */
const MODEL_TO_FILE = {
  User: 'user',
  Property: 'property',
  Task: 'task',
  MaintenancePlan: 'maintenance-plan',
  BudgetRequest: 'budget',
  ServiceRequest: 'service-request',
};

/**
 * Fields that are intentionally absent from the TypeScript interface.
 * Key = Prisma model name, value = Set of field names to ignore.
 *
 * Add entries here whenever a field is deliberately excluded from the public
 * type (e.g. security-sensitive columns, internal audit columns).
 */
const KNOWN_OMISSIONS = {
  // passwordHash is stripped via UserPublic = Omit<User, 'passwordHash'>
  User: new Set(['passwordHash']),
};

// ─── Well-known mixin fields ──────────────────────────────────────────────────

/**
 * Fields contributed by BaseEntity.
 * Interfaces that extend BaseEntity implicitly declare these; they will never
 * appear as explicit property names in the source text.
 */
const BASE_ENTITY_FIELDS = new Set(['id', 'createdAt', 'updatedAt']);

/**
 * Fields contributed by SoftDeletable.
 */
const SOFT_DELETABLE_FIELDS = new Set(['deletedAt']);

// ─── Prisma scalar types ──────────────────────────────────────────────────────

/**
 * Prisma built-in scalar types (lowercase keywords used in field definitions).
 * A field is scalar when its type starts with one of these or is a known enum.
 */
const PRISMA_SCALARS = new Set([
  'String',
  'Int',
  'Float',
  'Boolean',
  'DateTime',
  'Decimal',
  'BigInt',
  'Bytes',
  'Json',
]);

// ─── Parse Prisma model ───────────────────────────────────────────────────────

const schemaText = readFileSync(SCHEMA_PATH, 'utf8');

/** Collect all enum names defined in the schema so we can recognise them as scalars. */
const prismaEnumNames = new Set(
  [...schemaText.matchAll(/^enum\s+(\w+)\s+\{/gm)].map((m) => m[1]),
);

/**
 * Extract all model blocks from schema.prisma.
 * Returns a Map<modelName, rawBlockText>.
 */
function extractModelBlocks(text) {
  const blocks = new Map();
  // Match `model Foo {` … closing `}` at column 0.
  const modelRe = /^model\s+(\w+)\s+\{([^}]+)\}/gm;
  let m;
  while ((m = modelRe.exec(text)) !== null) {
    blocks.set(m[1], m[2]);
  }
  return blocks;
}

/**
 * Given the body text of a Prisma model block, return the scalar field names.
 *
 * Rules applied:
 *   - Skip blank lines and comment lines (`//`).
 *   - Skip `@@`-directive lines.
 *   - Skip relation fields: lines whose type token resolves to another model
 *     (not a built-in scalar and not a known enum), e.g. `user User`.
 */
function extractPrismaScalarFields(blockText, allModelNames) {
  const fields = [];

  for (const raw of blockText.split('\n')) {
    const line = raw.trim();

    // Skip blanks, comments, block-level attributes
    if (!line || line.startsWith('//') || line.startsWith('@@')) continue;

    // Field line format: `fieldName TypeName[?|[]] @...`
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;

    const fieldName = parts[0];
    // Remove optional (`?`) and array (`[]`) modifiers for type comparison
    const rawType = parts[1].replace(/[?\[\]]/g, '');

    const isScalar = PRISMA_SCALARS.has(rawType) || prismaEnumNames.has(rawType);
    const isRelation = allModelNames.has(rawType);

    if (isScalar && !isRelation) {
      fields.push(fieldName);
    }
    // Ignore fields that are neither scalar nor relation (shouldn't occur in valid schemas)
  }

  return fields;
}

// ─── Parse TypeScript interface ───────────────────────────────────────────────

/**
 * Given the text of a TypeScript entity file and the expected interface name,
 * return the set of property names declared directly on that interface.
 *
 * Strategy: locate `interface ModelName [extends ...] {` then collect every
 * `  propertyName` line until the closing `}`.  This is intentionally naive —
 * it does not need to handle generics or complex union types, only the flat
 * entity interfaces in this codebase.
 *
 * Fields contributed via `extends BaseEntity` / `extends SoftDeletable` are
 * NOT present as explicit text; they are handled by the caller via the mixin
 * field sets above.
 */
function extractInterfaceFields(fileText, interfaceName) {
  // Match the interface declaration line
  const startRe = new RegExp(`interface\\s+${interfaceName}\\b[^{]*\\{`);
  const startMatch = startRe.exec(fileText);
  if (!startMatch) return null;

  const bodyStart = startMatch.index + startMatch[0].length;
  let depth = 1;
  let i = bodyStart;
  let bodyText = '';

  while (i < fileText.length && depth > 0) {
    const ch = fileText[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
    bodyText += ch;
    i++;
  }

  const fields = [];
  for (const raw of bodyText.split('\n')) {
    const line = raw.trim();
    // Skip blank lines and comments
    if (!line || line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;

    // Property declaration: `fieldName[?]: type;`
    const propMatch = line.match(/^(\w+)\??:/);
    if (propMatch) {
      fields.push(propMatch[1]);
    }
  }

  return new Set(fields);
}

/**
 * Determine whether a TypeScript interface file extends BaseEntity and/or
 * SoftDeletable by scanning the `extends` clause.
 */
function detectMixins(fileText, interfaceName) {
  const declRe = new RegExp(`interface\\s+${interfaceName}\\b([^{]*)`);
  const m = declRe.exec(fileText);
  if (!m) return { hasBase: false, hasSoftDeletable: false };
  const clause = m[1];
  return {
    hasBase: /BaseEntity/.test(clause),
    hasSoftDeletable: /SoftDeletable/.test(clause),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const modelBlocks = extractModelBlocks(schemaText);
const allModelNames = new Set(modelBlocks.keys());

const issues = [];

for (const [modelName, entityFile] of Object.entries(MODEL_TO_FILE)) {
  const block = modelBlocks.get(modelName);
  if (!block) {
    issues.push({ model: modelName, problem: 'Model not found in schema.prisma' });
    continue;
  }

  const filePath = resolve(ENTITIES_DIR, `${entityFile}.ts`);
  let fileText;
  try {
    fileText = readFileSync(filePath, 'utf8');
  } catch {
    issues.push({
      model: modelName,
      problem: `Entity file not found: packages/shared/src/types/entities/${entityFile}.ts`,
    });
    continue;
  }

  const prismaFields = extractPrismaScalarFields(block, allModelNames);

  const interfaceFields = extractInterfaceFields(fileText, modelName);
  if (!interfaceFields) {
    issues.push({
      model: modelName,
      problem: `Could not locate 'interface ${modelName}' in ${entityFile}.ts`,
    });
    continue;
  }

  // Expand fields contributed by mixins
  const { hasBase, hasSoftDeletable } = detectMixins(fileText, modelName);
  if (hasBase) BASE_ENTITY_FIELDS.forEach((f) => interfaceFields.add(f));
  if (hasSoftDeletable) SOFT_DELETABLE_FIELDS.forEach((f) => interfaceFields.add(f));

  const omissions = KNOWN_OMISSIONS[modelName] ?? new Set();

  const missing = prismaFields.filter(
    (f) => !interfaceFields.has(f) && !omissions.has(f),
  );

  if (missing.length > 0) {
    issues.push({
      model: modelName,
      problem: `Fields in Prisma but missing from interface ${modelName}: ${missing.join(', ')}`,
    });
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const modelCount = Object.keys(MODEL_TO_FILE).length;

console.log(`\nEntity drift check — ${modelCount} models checked\n`);

if (issues.length === 0) {
  console.log('✓ No drift detected. All Prisma scalar fields present in entity interfaces.\n');
  process.exit(0);
} else {
  console.error(`⚠ Entity drift — ${issues.length} issue(s) found:\n`);
  for (const { model, problem } of issues) {
    console.error(`  • ${model}: ${problem}`);
  }
  console.error(
    '\nFix: add the missing fields to the entity interface, or add them to KNOWN_OMISSIONS if the omission is intentional.\n',
  );
  process.exit(1);
}
