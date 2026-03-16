import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_CLIENT, login } from './fixtures';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_ADMIN);
  });

  test('dashboard loads with stats', async ({ page }) => {
    await expect(page.getByText(/propiedades|tareas|diagnósticos/i)).toBeVisible({ timeout: 5000 });
  });

  test('sidebar navigation works', async ({ page }) => {
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText(/clientes/i)).toBeVisible();
    await expect(sidebar.getByText(/categorías/i)).toBeVisible();
  });

  test('sidebar shows admin-only items', async ({ page }) => {
    const sidebar = page.locator('nav');
    await expect(sidebar.getByText(/clientes/i)).toBeVisible();
    await expect(sidebar.getByText(/plantillas/i)).toBeVisible();
  });
});

test.describe('Client Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_CLIENT);
  });

  test('dashboard loads for client', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
  });

  test('sidebar hides admin-only items', async ({ page }) => {
    const sidebar = page.locator('nav');
    await expect(sidebar.getByText(/clientes/i)).not.toBeVisible();
    await expect(sidebar.getByText(/categorías/i)).not.toBeVisible();
  });

  test('sidebar shows client-only items', async ({ page }) => {
    const sidebar = page.locator('nav');
    await expect(sidebar.getByText(/planes/i)).toBeVisible();
  });
});
