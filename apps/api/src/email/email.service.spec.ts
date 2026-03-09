import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EmailService } from './email.service';

const mockSendEmail = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSendEmail },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  const configWithResend: Record<string, string> = {
    RESEND_API_KEY: 're_test_key_123',
    FRONTEND_URL: 'https://epde.test',
    EMAIL_FROM: 'Test <test@epde.test>',
  };

  describe('when Resend is configured', () => {
    beforeEach(async () => {
      mockSendEmail.mockReset();
      const configService = {
        get: jest.fn((key: string) => configWithResend[key]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService, { provide: ConfigService, useValue: configService }],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    describe('sendInviteEmail', () => {
      it('should send invite with correct subject and CTA link', async () => {
        mockSendEmail.mockResolvedValue({ id: 'email-1' });

        await service.sendInviteEmail('juan@test.com', 'Juan', 'token-abc');

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            from: 'Test <test@epde.test>',
            to: 'juan@test.com',
            subject: 'Bienvenido a EPDE - Configurá tu contraseña',
          }),
        );

        const html = mockSendEmail.mock.calls[0][0].html as string;
        expect(html).toContain('https://epde.test/set-password?token=token-abc');
        expect(html).toContain('Configurar contraseña');
      });

      it('should escape HTML in name parameter', async () => {
        mockSendEmail.mockResolvedValue({ id: 'email-2' });

        await service.sendInviteEmail('test@test.com', '<script>alert("xss")</script>', 'token');

        const html = mockSendEmail.mock.calls[0][0].html as string;
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
      });
    });

    describe('sendTaskReminderEmail', () => {
      const baseArgs = [
        'juan@test.com',
        'Juan',
        'Inspección de techo',
        'Av. Libertador 1234',
        new Date('2026-04-15'),
        'Techos',
      ] as const;

      it('should send reminder for upcoming task', async () => {
        mockSendEmail.mockResolvedValue({ id: 'email-3' });

        await service.sendTaskReminderEmail(...baseArgs, false);

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'juan@test.com',
            subject: 'Recordatorio: Inspección de techo vence pronto',
          }),
        );
      });

      it('should send overdue notice with different subject', async () => {
        mockSendEmail.mockResolvedValue({ id: 'email-4' });

        await service.sendTaskReminderEmail(...baseArgs, true);

        expect(mockSendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Tarea vencida: Inspección de techo',
          }),
        );

        const html = mockSendEmail.mock.calls[0][0].html as string;
        expect(html).toContain('vencida');
      });
    });

    describe('sendBudgetQuotedEmail', () => {
      it('should format amount in ARS currency', async () => {
        mockSendEmail.mockResolvedValue({ id: 'email-5' });

        await service.sendBudgetQuotedEmail(
          'juan@test.com',
          'Juan',
          'Reparación techo',
          150000,
          'budget-1',
        );

        const html = mockSendEmail.mock.calls[0][0].html as string;
        // ARS formatting includes $ symbol
        expect(html).toMatch(/\$\s*150[.,]000/);
      });

      it('should include budget link in CTA', async () => {
        mockSendEmail.mockResolvedValue({ id: 'email-6' });

        await service.sendBudgetQuotedEmail(
          'juan@test.com',
          'Juan',
          'Test Budget',
          5000,
          'budget-abc',
        );

        const html = mockSendEmail.mock.calls[0][0].html as string;
        expect(html).toContain('https://epde.test/budgets/budget-abc');
        expect(html).toContain('Ver presupuesto');
      });
    });

    describe('sendBudgetStatusEmail', () => {
      it('should map status to Spanish label', async () => {
        mockSendEmail.mockResolvedValue({ id: 'email-7' });

        await service.sendBudgetStatusEmail(
          'juan@test.com',
          'Juan',
          'Reparación',
          'APPROVED',
          'budget-1',
        );

        const html = mockSendEmail.mock.calls[0][0].html as string;
        expect(html).toContain('aprobado');
      });

      it('should use raw status when no label mapping exists', async () => {
        mockSendEmail.mockResolvedValue({ id: 'email-8' });

        await service.sendBudgetStatusEmail(
          'juan@test.com',
          'Juan',
          'Test',
          'UNKNOWN_STATUS',
          'budget-1',
        );

        const html = mockSendEmail.mock.calls[0][0].html as string;
        expect(html).toContain('UNKNOWN_STATUS');
      });
    });
  });

  describe('when Resend is NOT configured', () => {
    beforeEach(async () => {
      mockSendEmail.mockReset();
      const configService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService, { provide: ConfigService, useValue: configService }],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it('should log warning when Resend not configured (invite)', async () => {
      await service.sendInviteEmail('test@test.com', 'Test', 'token');

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should not send email when Resend not configured (reminder)', async () => {
      await service.sendTaskReminderEmail(
        'test@test.com',
        'Test',
        'Task',
        'Address',
        new Date(),
        'Category',
        false,
      );

      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });
});
