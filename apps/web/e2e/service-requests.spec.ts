import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_CLIENT, login } from './fixtures';

test.describe('Service Requests (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto('/service-requests');
  });

  test('page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /servicio|solicitud/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('table or empty state renders', async ({ page }) => {
    await expect(page.locator('table').or(page.getByText(/sin resultados/i))).toBeVisible({
      timeout: 5000,
    });
  });

  test('status filter syncs to URL', async ({ page }) => {
    const statusFilter = page.getByRole('combobox').first();
    await expect(statusFilter).toBeVisible({ timeout: 5000 });
    await statusFilter.click();
    const option = page.getByRole('option').first();
    await expect(option).toBeVisible({ timeout: 3000 });
    await option.click();
    await expect(page).toHaveURL(/status=/, { timeout: 3000 });
  });

  test('search filters requests', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('urgente');
    await expect(page).toHaveURL(/search=urgente/i, { timeout: 3000 });
  });

  test('clicking a row navigates to detail', async ({ page }) => {
    const table = page.locator('table');
    const hasTable = await table.isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!hasTable, 'No table rendered — skipping row click test');
    const row = table.locator('tbody tr').first();
    await expect(row).toBeVisible({ timeout: 3000 });
    await row.click();
    await expect(page).toHaveURL(/service-requests\//, { timeout: 5000 });
  });
});

test.describe('Service Requests (Client)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_CLIENT);
    await page.goto('/service-requests');
  });

  test('client can view service requests', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /servicio|solicitud/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('client sees create button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /nueva solicitud/i })).toBeVisible();
  });
});
