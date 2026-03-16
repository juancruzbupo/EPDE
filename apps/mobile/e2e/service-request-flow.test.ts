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

describe('Service Request Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await loginAsClient();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should navigate to service requests list', async () => {
    // Navigate via profile or direct if tab exists
    await element(by.text(/inicio|dashboard/i)).tap();
    // Scroll down to find service requests section or navigate via menu
    await expect(element(by.text(/solicitud|servicio/i)).atIndex(0)).toBeVisible();
  });

  it('should show create button for service request', async () => {
    await expect(element(by.text(/nueva solicitud|crear/i))).toBeVisible();
  });

  it('should open create service request modal', async () => {
    await element(by.text(/nueva solicitud|crear/i)).tap();
    // Modal should show form fields
    await expect(element(by.text(/título|asunto|propiedad/i)).atIndex(0)).toBeVisible();
  });

  it('should close modal on cancel', async () => {
    await element(by.text(/cancelar|cerrar/i)).tap();
    await expect(element(by.text(/solicitud|servicio/i)).atIndex(0)).toBeVisible();
  });
});
