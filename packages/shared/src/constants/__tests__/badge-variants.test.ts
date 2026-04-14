import { describe, expect, it } from 'vitest';

import {
  BADGE_VARIANT_CLASSES,
  BUDGET_STATUS_VARIANT,
  CLIENT_STATUS_VARIANT,
  PLAN_STATUS_VARIANT,
  PRIORITY_VARIANT,
  SERVICE_STATUS_VARIANT,
  TASK_STATUS_VARIANT,
  URGENCY_VARIANT,
} from '../badge-variants';

/**
 * Exhaustiveness guardrail: every variant string produced by the enum→variant
 * maps must have a corresponding entry in BADGE_VARIANT_CLASSES, otherwise
 * web or mobile will fall back to `undefined` styles at runtime. The
 * `satisfies Record<..., BadgeVariant>` on each map catches TS-level typos,
 * but we still want a runtime assertion in case the test suite is the last
 * line of defense (e.g. someone narrows the satisfies away).
 */
describe('badge-variants: exhaustiveness', () => {
  const variantMaps = {
    TASK_STATUS_VARIANT,
    BUDGET_STATUS_VARIANT,
    SERVICE_STATUS_VARIANT,
    URGENCY_VARIANT,
    PRIORITY_VARIANT,
    CLIENT_STATUS_VARIANT,
    PLAN_STATUS_VARIANT,
  };

  it.each(Object.entries(variantMaps))(
    '%s only references variants defined in BADGE_VARIANT_CLASSES',
    (_name, map) => {
      for (const [enumKey, variant] of Object.entries(map)) {
        expect(BADGE_VARIANT_CLASSES).toHaveProperty(
          variant,
          expect.objectContaining({ bg: expect.any(String) }),
        );
        expect(variant, `variant for ${enumKey}`).toMatch(/^\w+$/);
      }
    },
  );

  it('BADGE_VARIANT_CLASSES entries declare bg, text, border keys', () => {
    for (const [variant, classes] of Object.entries(BADGE_VARIANT_CLASSES)) {
      expect(classes, `variant ${variant}`).toEqual(
        expect.objectContaining({
          bg: expect.any(String),
          text: expect.any(String),
          border: expect.any(String),
        }),
      );
    }
  });
});
