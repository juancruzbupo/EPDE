/**
 * Guard the soft-delete extension configuration against schema drift.
 *
 * The Prisma extension in prisma.service.ts auto-filters `deletedAt: null`
 * for the models listed in `SOFT_DELETABLE_MODELS`. Any model that carries
 * a `deletedAt` column but is missing from that list will silently return
 * soft-deleted rows from ordinary queries — a real correctness and
 * security hole.
 *
 * A handful of models intentionally opt out (they expose a `deletedAt`
 * column but want manual filtering at the call site): declaring them in
 * `INTENTIONALLY_UNMANAGED_SOFT_DELETES` keeps this test precise without
 * allowing accidental omissions to slip through.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { SOFT_DELETABLE_MODELS } from './prisma.service';

const SCHEMA_PATH = resolve(__dirname, '../../prisma/schema.prisma');

/**
 * Models that legitimately have `deletedAt` but are NOT in the extension
 * (e.g. lifecycle via status rather than soft-delete, or hand-filtered at
 * every call site). Today the list is empty — every model with `deletedAt`
 * is covered by the extension. Add a model here only when you have a
 * specific reason to hand-filter and have verified every findMany/findFirst
 * on that model carries `deletedAt: null` explicitly.
 */
const INTENTIONALLY_UNMANAGED_SOFT_DELETES = new Set<string>([]);

/** Parse schema.prisma and return every model name that declares a `deletedAt` field. */
function findModelsWithSoftDelete(): string[] {
  const source = readFileSync(SCHEMA_PATH, 'utf8');
  const out: string[] = [];
  const modelBlock = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let match: RegExpExecArray | null;
  while ((match = modelBlock.exec(source)) !== null) {
    const [, name, body] = match;
    if (!name || !body) continue;
    // Only count `deletedAt` declared as a field, not inside @@index([deletedAt]).
    if (/^\s*deletedAt\b/m.test(body)) out.push(name);
  }
  return out;
}

/** Convert Prisma model name (PascalCase) to Prisma client key (camelCase) to compare
 *  against SOFT_DELETABLE_MODELS. `InspectionChecklist` → `inspectionChecklist`. */
function toClientKey(modelName: string): string {
  return modelName[0]!.toLowerCase() + modelName.slice(1);
}

describe('soft-delete configuration consistency', () => {
  it('every soft-deletable model in schema is covered by the extension or explicitly opted out', () => {
    const schemaModels = findModelsWithSoftDelete();
    const managed = new Set<string>(SOFT_DELETABLE_MODELS);

    const orphans = schemaModels.filter((model) => {
      if (INTENTIONALLY_UNMANAGED_SOFT_DELETES.has(model)) return false;
      return !managed.has(toClientKey(model));
    });

    if (orphans.length > 0) {
      const details = orphans.map((m) => `  - ${m} (client key: ${toClientKey(m)})`).join('\n');
      throw new Error(
        `The following models have a \`deletedAt\` field but are neither registered in SOFT_DELETABLE_MODELS nor listed as intentionally unmanaged.\n\n${details}\n\nAdd each one to SOFT_DELETABLE_MODELS in prisma.service.ts (auto-filter), or to INTENTIONALLY_UNMANAGED_SOFT_DELETES in this spec plus soft-delete-include.ts (manual filter at call sites).`,
      );
    }

    expect(orphans).toEqual([]);
  });

  it('SOFT_DELETABLE_MODELS entries all exist in the schema', () => {
    const schemaModels = new Set(findModelsWithSoftDelete().map(toClientKey));
    const stale = [...SOFT_DELETABLE_MODELS].filter((m) => !schemaModels.has(m));
    expect(stale).toEqual([]);
  });

  it('INTENTIONALLY_UNMANAGED_SOFT_DELETES entries all exist in the schema', () => {
    const schemaModels = new Set(findModelsWithSoftDelete());
    const stale = [...INTENTIONALLY_UNMANAGED_SOFT_DELETES].filter((m) => !schemaModels.has(m));
    expect(stale).toEqual([]);
  });
});
