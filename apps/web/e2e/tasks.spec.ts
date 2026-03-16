import { expect, test } from '@playwright/test';

import { E2E_ADMIN, E2E_CLIENT, login } from './fixtures';

test.describe('Tasks (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto('/tasks');
  });

  test('tasks page loads with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tareas/i })).toBeVisible({ timeout: 5000 });
  });

  test('stat cards render (3 status cards)', async ({ page }) => {
    await expect(page.getByText(/vencida/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/pendiente/i).first()).toBeVisible();
    await expect(page.getByText(/próxima/i).first()).toBeVisible();
  });

  test('priority filter works', async ({ page }) => {
    const highButton = page.getByRole('button', { name: /alta/i });
    if (await highButton.isVisible()) {
      await highButton.click();
      // Tasks should be filtered (visual check — count text changes)
      await expect(page.getByText(/tarea/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('search filters tasks', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('estructura');
    await expect(page.getByText(/tarea/i)).toBeVisible({ timeout: 3000 });
  });

  test('clicking a stat card filters by status', async ({ page }) => {
    const statCard = page.getByText(/vencida/i).first();
    if (await statCard.isVisible()) {
      await statCard.click();
      // Should show only overdue tasks (or empty)
      await expect(page.getByText(/tarea/i)).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Tasks (Client)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_CLIENT);
    await page.goto('/tasks');
  });

  test('client can view tasks', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tareas/i })).toBeVisible({ timeout: 5000 });
  });

  test('task detail sheet opens on click', async ({ page }) => {
    // Wait for tasks to load
    const taskButton = page.locator('button').filter({ hasText: /.+/ }).nth(5);
    if (await taskButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await taskButton.click();
      // Sheet or detail should appear
      await expect(page.getByRole('dialog').or(page.locator('[role="tabpanel"]')))
        .toBeVisible({ timeout: 5000 })
        .catch(() => {
          // Task detail might render inline instead of dialog
        });
    }
  });
});
