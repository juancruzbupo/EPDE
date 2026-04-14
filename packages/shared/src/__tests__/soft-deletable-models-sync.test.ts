import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Drift guardrail: the list of soft-deletable Prisma models lives in two
 * places that can't cross-import.
 *
 *   - Runtime (API):   apps/api/src/prisma/prisma.service.ts → SOFT_DELETABLE_MODELS
 *   - Lint (ESLint):   eslint-rules/no-tx-without-soft-delete-filter.mjs → SOFT_DELETABLE_MODELS
 *
 * The ESLint rule runs in the lint phase where TypeScript source isn't
 * available, so it can't import the runtime constant. Both lists are
 * hand-maintained. This test parses both files with a regex and asserts
 * they match exactly — a new model added on one side without the other
 * fails CI instead of landing as a silent lint gap.
 *
 * If you ship a new soft-deletable model:
 *   1. Add it to SOFT_DELETABLE_MODELS in prisma.service.ts.
 *   2. Add it to SOFT_DELETABLE_MODELS in no-tx-without-soft-delete-filter.mjs.
 *   3. Run this test to confirm sync.
 */

const REPO_ROOT = resolve(__dirname, '../../../..');

function extractModelsFromFile(filePath: string, marker: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  // Find the block between `SOFT_DELETABLE_MODELS = [` (or `new Set([`)
  // and the closing `]`.
  const startIdx = content.indexOf(marker);
  if (startIdx === -1) {
    throw new Error(`Marker "${marker}" not found in ${filePath}`);
  }
  const slice = content.slice(startIdx);
  const endIdx = slice.indexOf(']');
  if (endIdx === -1) {
    throw new Error(`No closing bracket after "${marker}" in ${filePath}`);
  }
  const block = slice.slice(0, endIdx);
  // Pull every quoted string literal in the block.
  const matches = block.match(/'([a-zA-Z]+)'/g) ?? [];
  return matches.map((m) => m.slice(1, -1)).sort();
}

describe('SOFT_DELETABLE_MODELS sync between prisma service and eslint rule', () => {
  it('service list matches rule list', () => {
    const serviceList = extractModelsFromFile(
      resolve(REPO_ROOT, 'apps/api/src/prisma/prisma.service.ts'),
      'SOFT_DELETABLE_MODELS = [',
    );
    const ruleList = extractModelsFromFile(
      resolve(REPO_ROOT, 'eslint-rules/no-tx-without-soft-delete-filter.mjs'),
      'SOFT_DELETABLE_MODELS = new Set([',
    );

    expect(serviceList, 'prisma.service.ts SOFT_DELETABLE_MODELS').not.toHaveLength(0);
    expect(ruleList, 'eslint rule SOFT_DELETABLE_MODELS').not.toHaveLength(0);
    expect(ruleList).toEqual(serviceList);
  });
});
