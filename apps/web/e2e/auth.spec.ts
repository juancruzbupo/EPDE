import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_CLIENT, login } from './fixtures';

test.describe('Authentication', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /ingres/i })).toBeVisible();
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

  test('admin login redirects to dashboard', async ({ page }) => {
    await login(page, E2E_ADMIN);
    await expect(page.getByText(/propiedades|tareas|diagnósticos/i)).toBeVisible({ timeout: 5000 });
  });

  test('client login redirects to dashboard', async ({ page }) => {
    await login(page, E2E_CLIENT);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
