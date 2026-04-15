import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// Drift guardrail: web and mobile each have an `invalidateDashboard(qc)`
// helper. They invalidate different sets of keys (web has admin+client,
// mobile is client-only) but the *minimum overlap* — the three client
// dashboard keys — must always match. Without this test, a renamed or
// removed client key on one platform silently breaks cache invalidation
// on the other for the same surface (e.g. dashboard activity feed shows
// stale tasks after completing one).
//
// We parse the helper files as plain text and extract the QUERY_KEYS.X
// references in their queryKey arrays. Then we assert that the client
// trio appears in both, and that web is a strict superset of mobile.

const REPO_ROOT = resolve(__dirname, '../../../..');
const WEB_HELPER = resolve(REPO_ROOT, 'apps/web/src/lib/invalidate-dashboard.ts');
const MOBILE_HELPER = resolve(REPO_ROOT, 'apps/mobile/src/lib/invalidate-dashboard.ts');

const REQUIRED_CLIENT_KEYS = [
  'dashboardClientStats',
  'dashboardClientUpcoming',
  'dashboardClientAnalytics',
] as const;

function extractInvalidatedKeys(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  // Match `QUERY_KEYS.<identifier>` inside `invalidateQueries({ ... queryKey: [...] })`
  const matches = content.matchAll(/QUERY_KEYS\.(\w+)/g);
  const set = new Set<string>();
  for (const m of matches) {
    // Skip the literal `QUERY_KEYS.dashboard` namespace entry that all keys share.
    if (m[1] !== 'dashboard') set.add(m[1]);
  }
  return [...set].sort();
}

describe('invalidateDashboard parity (web vs mobile)', () => {
  const webKeys = extractInvalidatedKeys(WEB_HELPER);
  const mobileKeys = extractInvalidatedKeys(MOBILE_HELPER);

  it('both helpers invalidate the three client dashboard keys', () => {
    for (const key of REQUIRED_CLIENT_KEYS) {
      expect(webKeys, `web missing ${key}`).toContain(key);
      expect(mobileKeys, `mobile missing ${key}`).toContain(key);
    }
  });

  it('web is a strict superset of mobile (mobile is client-only)', () => {
    const missing = mobileKeys.filter((k) => !webKeys.includes(k));
    expect(
      missing,
      `Keys in mobile but not web — either web is missing them or they shouldn't be in mobile: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('mobile invalidates ONLY client keys (no admin leak)', () => {
    const adminLeak = mobileKeys.filter((k) => !k.startsWith('dashboardClient'));
    expect(
      adminLeak,
      `Mobile is client-only but invalidates admin keys: ${adminLeak.join(', ')}. Move these to web's helper or rename.`,
    ).toEqual([]);
  });
});
