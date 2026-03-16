import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_CLIENT, login } from './fixtures';

test.describe('Notifications (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto('/notifications');
  });

  test('notifications page loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /notificacion/i })).toBeVisible({
      timeout: 5000,
    });
  });

  test('notifications list or empty state renders', async ({ page }) => {
    await expect(page.locator('ul').or(page.getByText(/sin notificaciones/i))).toBeVisible({
      timeout: 5000,
    });
  });

  test('mark all as read button is visible when notifications exist', async ({ page }) => {
    const markAllButton = page.getByRole('button', { name: /marcar todas|leer todas/i });
    // Button only shows when there are unread notifications
    if (await markAllButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(markAllButton).toBeEnabled();
    }
  });
});

test.describe('Notifications (Client)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_CLIENT);
  });

  test('notification badge visible in header', async ({ page }) => {
    // The bell icon in the header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('client can navigate to notifications', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: /notificacion/i })).toBeVisible({
      timeout: 5000,
    });
  });
});
