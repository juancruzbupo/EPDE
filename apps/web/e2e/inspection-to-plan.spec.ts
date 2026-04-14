/**
 * End-to-end coverage for the inspección ocular → plan de mantenimiento flow.
 *
 * Left as test.skip for now because the current seed does not create a
 * property without a maintenance plan that an admin can use as a fresh
 * inspection target (E2E_CLIENT's demo property already has a plan from
 * the seed). Wire this up once the seed exposes a 'property without plan'
 * fixture or the test creates one via API before the UI flow.
 *
 * What this spec will verify (manual QA checklist until automated):
 *   1. Admin can create a new inspection on a property without a plan
 *   2. Evaluating every item (OK / NEEDS_ATTENTION / NEEDS_PROFESSIONAL)
 *      unlocks the 'Generar Plan' CTA
 *   3. Generating the plan returns to a locked-checklist state with a
 *      banner showing completedAt
 *   4. Items become read-only (status buttons disabled)
 *   5. Attempting to patch an item via the API returns 403 Forbidden
 *   6. The generated plan is visible on /tasks and each task has a real
 *      nextDueDate (not null) consistent with its priority
 */
import { expect, test } from '@playwright/test';

import { E2E_ADMIN, login } from './fixtures';

test.describe('Inspection → Plan (Admin)', () => {
  test.skip('admin can complete an inspection and generate a plan', async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto('/properties');
    // Placeholder — needs a 'property without plan' fixture before this can run green.
    await expect(page.getByRole('heading', { name: /propiedades/i })).toBeVisible();
  });

  test.skip('items become read-only after plan is generated', async ({ page }) => {
    await login(page, E2E_ADMIN);
    // TODO: assert status buttons are disabled, 'Agregar observación' is hidden,
    // banner shows 'Inspección completada. El plan de mantenimiento fue generado el…'.
    await expect(page).toHaveURL(/.*/);
  });
});
