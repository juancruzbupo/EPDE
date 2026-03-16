import { by, device, element, expect } from 'detox';

const DEMO_CLIENT = {
  email: 'maria.gonzalez@demo.com',
  password: 'Demo123!',
};

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should show validation error for empty fields', async () => {
    await element(by.text('Ingresar')).tap();
    await expect(element(by.text(/obligatorio|requerido/i))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@test.com');
    await element(by.id('password-input')).typeText('WrongPass1!');
    await element(by.text('Ingresar')).tap();
    await expect(element(by.text(/credenciales|inválid|error/i))).toBeVisible();
  });

  it('should login with demo client credentials', async () => {
    await element(by.id('email-input')).clearText();
    await element(by.id('email-input')).typeText(DEMO_CLIENT.email);
    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText(DEMO_CLIENT.password);
    await element(by.text('Ingresar')).tap();

    // Should navigate to dashboard (tabs)
    await expect(element(by.text(/dashboard|inicio/i))).toBeVisible();
  });
});
