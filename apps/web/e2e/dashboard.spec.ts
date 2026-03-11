import { expect, test } from '@playwright/test';

import { E2E_ADMIN } from './fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(E2E_ADMIN.email);
    await page.getByLabel(/contraseña/i).fill(E2E_ADMIN.password);
    await page.getByRole('button', { name: /iniciar/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('dashboard loads with stats', async ({ page }) => {
    await expect(page.getByText(/propiedades|tareas|diagnósticos/i)).toBeVisible({ timeout: 5000 });
  });

  test('sidebar navigation works', async ({ page }) => {
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
  });
});
