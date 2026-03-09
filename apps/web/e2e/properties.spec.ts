import { test, expect } from '@playwright/test';

test.describe('Properties', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@epde.com');
    await page.getByLabel(/contraseña/i).fill('Admin123!');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('properties page loads', async ({ page }) => {
    await page.goto('/properties');
    await expect(page.getByRole('heading', { name: /propiedades/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('properties table renders', async ({ page }) => {
    await page.goto('/properties');
    await expect(page.locator('table').or(page.getByText(/sin resultados/i))).toBeVisible({
      timeout: 5000,
    });
  });
});
