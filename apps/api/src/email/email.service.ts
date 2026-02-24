import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendInviteEmail(to: string, name: string, token: string): Promise<void> {
    const baseUrl = this.configService.get<string>('FRONTEND_URL')!;
    const link = `${baseUrl}/set-password?token=${token}`;

    if (!this.resend) {
      this.logger.warn(
        `Email no enviado (RESEND_API_KEY no configurada). Link de invitación: ${link}`,
      );
      return;
    }

    await this.resend.emails.send({
      from: 'EPDE <no-reply@epde.com>',
      to,
      subject: 'Bienvenido a EPDE - Configurá tu contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C4704B;">Bienvenido a EPDE</h2>
          <p>Hola ${name},</p>
          <p>Fuiste invitado a la plataforma de mantenimiento preventivo EPDE.</p>
          <p>Para comenzar, configurá tu contraseña haciendo clic en el siguiente enlace:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #C4704B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Configurar contraseña
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">Este enlace expira en 24 horas.</p>
          <hr style="border: none; border-top: 1px solid #E8DDD3; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">EPDE - Estudio Profesional de Diagnóstico Edilicio</p>
        </div>
      `,
    });

    this.logger.log(`Email de invitación enviado a ${to}`);
  }
}
