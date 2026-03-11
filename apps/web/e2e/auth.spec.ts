import { expect, test } from '@playwright/test';

import { E2E_ADMIN } from './fixtures';

test.describe('Authentication', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@test.com');
    await page.getByLabel(/contraseña/i).fill('WrongPass1!');
    await page.getByRole('button', { name: /iniciar/i }).click();
    await expect(page.getByText(/credenciales|inválid|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(E2E_ADMIN.email);
    await page.getByLabel(/contraseña/i).fill(E2E_ADMIN.password);
    await page.getByRole('button', { name: /iniciar/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
  });

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
