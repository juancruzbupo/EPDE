/**
 * Shared E2E test fixtures — credentials and common data.
 * Avoids hardcoding in individual spec files.
 */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const E2E_ADMIN = {
  email: 'admin@epde.com',
  password: 'Admin123!',
} as const;

export const E2E_CLIENT = {
  email: 'maria.gonzalez@demo.com',
  password: 'Demo123!',
} as const;

/** Login helper — navigates to /login, fills credentials, waits for /dashboard. */
export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/contraseña/i).fill(user.password);
  await page.getByRole('button', { name: /iniciar/i }).click();
  await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
}
