import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_CLIENT, login } from './fixtures';

test.describe('Properties (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto('/properties');
  });

  test('properties page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /propiedades/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('properties table renders data', async ({ page }) => {
    await expect(page.locator('table').or(page.getByText(/sin resultados/i))).toBeVisible({
      timeout: 5000,
    });
  });

  test('search filters properties', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Casa');
    // URL should sync with search param
    await expect(page).toHaveURL(/search=Casa/i, { timeout: 3000 });
  });

  test('create property button visible for admin', async ({ page }) => {
    await expect(page.getByRole('button', { name: /nueva propiedad/i })).toBeVisible();
  });
});

test.describe('Properties (Client)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_CLIENT);
    await page.goto('/properties');
  });

  test('client can view properties', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /propiedades/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('create button hidden for client', async ({ page }) => {
    await expect(page.getByRole('button', { name: /nueva propiedad/i })).not.toBeVisible();
  });
});
