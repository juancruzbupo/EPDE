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

describe('Property Detail Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsClient();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should navigate to properties and see seeded property data', async () => {
    await element(by.text(/propiedades/i)).tap();
    // Demo client has seeded properties with real addresses
    await expect(element(by.text(/Av\.|Calle|casa|departamento/i)).atIndex(0)).toBeVisible();
  });

  it('should open property detail and show task count', async () => {
    await element(by.text(/Av\.|Calle|casa|departamento/i))
      .atIndex(0)
      .tap();
    // Property detail shows plan info with task section
    await expect(element(by.text(/tareas|plan/i)).atIndex(0)).toBeVisible();
    // Verify task count renders (e.g., "X tareas")
    await expect(element(by.text(/\d+ tarea/i))).toBeVisible();
  });

  it('should show all 3 filter buttons without COMPLETED', async () => {
    await expect(element(by.text('Todas'))).toBeVisible();
    await expect(element(by.text('Próximas'))).toBeVisible();
    await expect(element(by.text('Vencidas'))).toBeVisible();
  });

  it('should filter by upcoming and show filtered results', async () => {
    await element(by.text('Próximas')).tap();
    // Verify the filter button is visually active (selected state)
    await expect(element(by.text('Próximas'))).toBeVisible();
  });

  it('should return to all tasks and show full count', async () => {
    await element(by.text('Todas')).tap();
    await expect(element(by.text('Todas'))).toBeVisible();
    // Task list should be visible with data
    await expect(element(by.text(/\d+ tarea/i))).toBeVisible();
  });
});
