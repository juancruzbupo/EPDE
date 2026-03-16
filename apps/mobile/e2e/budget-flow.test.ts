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

describe('Budget Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsClient();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should navigate to budgets tab', async () => {
    await element(by.text(/presupuestos/i)).tap();
    await expect(element(by.text(/presupuesto/i)).atIndex(0)).toBeVisible();
  });

  it('should display budget list or empty state', async () => {
    await expect(element(by.text(/pendiente|aprobado|sin presupuestos/i)).atIndex(0)).toBeVisible();
  });

  it('should show create budget button', async () => {
    await expect(element(by.text(/nuevo presupuesto|solicitar/i))).toBeVisible();
  });

  it('should open create budget modal', async () => {
    await element(by.text(/nuevo presupuesto|solicitar/i)).tap();
    await expect(element(by.text(/propiedad|título|descripción/i)).atIndex(0)).toBeVisible();
  });

  it('should close modal on cancel', async () => {
    await element(by.text(/cancelar|cerrar/i)).tap();
    await expect(element(by.text(/presupuesto/i)).atIndex(0)).toBeVisible();
  });
});
