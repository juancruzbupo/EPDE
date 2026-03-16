import { by, device, element, expect } from 'detox';

describe('App Launch', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should show the login screen on first launch', async () => {
    await expect(element(by.text('Ingresá a tu cuenta'))).toBeVisible();
  });

  it('should show email and password fields', async () => {
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
  });

  it('should show login button', async () => {
    await expect(element(by.text('Ingresar'))).toBeVisible();
  });
});
