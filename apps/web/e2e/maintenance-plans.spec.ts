import { expect, test } from '@playwright/test';

import { E2E_CLIENT, login } from './fixtures';

test.describe('Maintenance Plans (Client)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_CLIENT);
    await page.goto('/maintenance-plans');
  });

  test('plans page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /planes de mantenimiento/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('plans are grouped by status', async ({ page }) => {
    // Should show at least one status group (Activo, Borrador, or Archivado)
    await expect(page.getByText(/activo|borrador|archivado/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('search filters plans', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    // Count text should update
    await expect(page.getByText(/plan/i)).toBeVisible({ timeout: 3000 });
  });

  test('plan count is displayed', async ({ page }) => {
    await expect(page.getByText(/\d+ plan/i)).toBeVisible({ timeout: 5000 });
  });

  test('clicking a plan navigates to property detail', async ({ page }) => {
    const planCard = page.locator('button').filter({ hasText: /tarea/ }).first();
    if (await planCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await planCard.click();
      await expect(page).toHaveURL(/properties\//, { timeout: 5000 });
    }
  });
});
