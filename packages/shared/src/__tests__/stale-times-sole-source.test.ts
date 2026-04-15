import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { STALE_TIME } from '../constants/stale-times';

// Drift guardrail: STALE_TIME lives only in @epde/shared/constants/stale-times.ts.
//
// Previously web and mobile each kept their own apps/*/src/hooks/query-stale-times.ts
// with the same shape. They drifted: tier docstrings diverged, and any one-off tweak
// on one platform (e.g. raising MEDIUM from 60s to 90s for slow APIs) wouldn't
// propagate. The two-source-of-truth pattern is the same risk the soft-deletable
// models test guards against.
//
// This test fails CI if any app re-defines the constant locally, forcing the
// import to come from @epde/shared.

const REPO_ROOT = resolve(__dirname, '../../../..');

function grepRepo(pattern: string): string[] {
  try {
    const out = execSync(
      `git -C ${REPO_ROOT} grep -ln "${pattern}" -- "apps/web/src/" "apps/mobile/src/"`,
      { encoding: 'utf-8' },
    );
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } catch {
    // grep exits 1 when no matches — that's the success case here.
    return [];
  }
}

describe('STALE_TIME single source of truth', () => {
  it('shared exports the expected tiers', () => {
    expect(STALE_TIME.VOLATILE).toBe(30_000);
    expect(STALE_TIME.MEDIUM).toBe(60_000);
    expect(STALE_TIME.SLOW).toBe(5 * 60_000);
  });

  it('no app re-declares `export const STALE_TIME`', () => {
    const offenders = grepRepo('export const STALE_TIME');
    expect(
      offenders,
      `STALE_TIME must be imported from @epde/shared, not redefined locally. Offenders: ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('no app keeps a query-stale-times.ts file', () => {
    const offenders = grepRepo('query-stale-times');
    // Allow this test file and rule docs to mention the term.
    const real = offenders.filter((p) => !p.endsWith('.test.ts') && !p.endsWith('.mjs'));
    expect(
      real,
      `query-stale-times.ts file detected — STALE_TIME has moved to @epde/shared. Delete the local file and import from there. Offenders: ${real.join(', ')}`,
    ).toEqual([]);
  });
});
