import { readdirSync, readFileSync, statSync } from 'fs';
import { resolve } from 'path';

import { QUERY_KEYS } from '../constants/query-keys';

/**
 * Verifies that every key defined in `QUERY_KEYS` is used at least once across
 * web or mobile, and — symmetrically — that apps don't reach for ad-hoc
 * `QUERY_KEYS.xxx` names that don't exist in the shared source of truth.
 *
 * Two classes of drift this catches:
 *   - Dead keys (defined but never read) that accumulate as features are
 *     removed or renamed.
 *   - Typos where a hook writes `QUERY_KEYS.budgetAuditLogs` (plural) while
 *     the constant is `budgetAuditLog` (singular) — TypeScript would normally
 *     catch this via the `as const`, but if someone bypasses with bracket
 *     access or a dynamic string this would slip past the compiler.
 */

const WEB_ROOT = resolve(__dirname, '../../../../apps/web/src');
const MOBILE_ROOT = resolve(__dirname, '../../../../apps/mobile/src');

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = `${dir}/${entry}`;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) files.push(full);
  }
  return files;
}

/** Accumulates the full source of every .ts/.tsx file under the given roots. */
function readAllSources(roots: string[]): string {
  return roots
    .flatMap((root) => walk(root))
    .map((file) => readFileSync(file, 'utf-8'))
    .join('\n');
}

describe('QUERY_KEYS parity', () => {
  const webSources = readAllSources([WEB_ROOT]);
  const mobileSources = readAllSources([MOBILE_ROOT]);
  const allSources = `${webSources}\n${mobileSources}`;

  describe('every defined key is used at least once', () => {
    const keys = Object.keys(QUERY_KEYS);

    it.each(keys)('QUERY_KEYS.%s is referenced in web or mobile', (key) => {
      const needle = `QUERY_KEYS.${key}`;
      expect(allSources).toContain(needle);
    });
  });

  it('apps do not reference QUERY_KEYS names that are not in the shared const', () => {
    const referencedKeys = new Set<string>();
    const regex = /QUERY_KEYS\.(\w+)/g;
    for (const match of allSources.matchAll(regex)) {
      referencedKeys.add(match[1]);
    }

    const definedKeys = new Set(Object.keys(QUERY_KEYS));
    const unknown = [...referencedKeys].filter((key) => !definedKeys.has(key));
    expect(unknown).toEqual([]);
  });
});
