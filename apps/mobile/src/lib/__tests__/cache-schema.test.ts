import { CACHE_SCHEMA_VERSION, SENSITIVE_PERSIST_DENY } from '../query-persister';

/**
 * Fingerprint guardrail for the mobile persisted query cache.
 *
 * When either of the values below changes, this test fails — the
 * committed expected values must be updated in the same commit. That
 * forces an explicit review decision:
 *   - `CACHE_SCHEMA_VERSION` bumped → confirm the shape change is
 *     intentional and that old caches should be invalidated on next
 *     launch (see JSDoc in query-persister.ts).
 *   - `SENSITIVE_PERSIST_DENY` changed → adding a domain is safe
 *     (stops persisting); REMOVING a domain means new queries start
 *     persisting, which is a shape commitment that usually wants
 *     CACHE_SCHEMA_VERSION bumped too.
 */

describe('cache schema fingerprint', () => {
  it('CACHE_SCHEMA_VERSION is the locked value', () => {
    expect(CACHE_SCHEMA_VERSION).toBe(1);
  });

  it('SENSITIVE_PERSIST_DENY is the locked list', () => {
    expect([...SENSITIVE_PERSIST_DENY].sort()).toEqual(
      [
        'budgets',
        'clients',
        'inspections',
        'maintenancePlans',
        'plans',
        'properties',
        'serviceRequests',
        'tasks',
      ].sort(),
    );
  });
});
