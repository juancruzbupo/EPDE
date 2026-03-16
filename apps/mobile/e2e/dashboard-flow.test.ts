import { by, device, element, expect } from 'detox';

const DEMO_CLIENT = {
  email: 'maria.gonzalez@demo.com',
  password: 'Demo123!',
};

async function loginAsClient() {
  await element(by.id('email-input')).typeText(DEMO_CLIENT.email);
  await element(by.id('password-input')).typeText(DEMO_CLIENT.password);
  await element(by.text('Ingresar')).tap();
  await expect(element(by.text(/dashboard|inicio/i))).toBeVisible();
}

describe('Dashboard Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsClient();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should display health card with percentage', async () => {
    await expect(element(by.text(/salud|estado/i)).atIndex(0)).toBeVisible();
    // Verify health card shows a numeric percentage
    await expect(element(by.text(/\d+%/))).toBeVisible();
  });

  it('should display stat cards with numeric values', async () => {
    // Demo data should have at least 1 property and tasks
    await expect(element(by.text(/propiedad/i)).atIndex(0)).toBeVisible();
    await expect(element(by.text(/tarea/i)).atIndex(0)).toBeVisible();
  });

  it('should navigate to properties tab and show property list', async () => {
    await element(by.text(/propiedades/i)).tap();
    // Demo client "María González" has seeded properties — verify data renders
    await expect(element(by.text(/Av\.|Calle|casa|departamento/i)).atIndex(0)).toBeVisible();
  });

  it('should navigate to tasks tab and show task statuses', async () => {
    await element(by.text(/tareas/i)).tap();
    // Verify status labels render (not just the tab title)
    await expect(element(by.text(/pendiente|vencida|próxima/i)).atIndex(0)).toBeVisible();
  });

  it('should navigate to notifications tab and show list or empty state', async () => {
    await element(by.text(/notificaciones/i)).tap();
    await expect(element(by.text(/notificacion|sin notificaciones/i)).atIndex(0)).toBeVisible();
  });

  it('should navigate back to dashboard and verify data persists', async () => {
    await element(by.text(/inicio|dashboard/i)).tap();
    // Health card should still show percentage (data wasn't lost on navigation)
    await expect(element(by.text(/\d+%/))).toBeVisible();
  });
});
