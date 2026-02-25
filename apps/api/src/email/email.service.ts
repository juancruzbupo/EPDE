import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

const BUDGET_STATUS_LABELS: Record<string, string> = {
  APPROVED: 'aprobado',
  REJECTED: 'rechazado',
  IN_PROGRESS: 'en progreso',
  COMPLETED: 'completado',
  QUOTED: 'cotizado',
  PENDING: 'pendiente',
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private readonly frontendUrl: string;
  private readonly emailFrom: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    this.emailFrom = this.configService.get<string>('EMAIL_FROM') ?? 'EPDE <onboarding@resend.dev>';
  }

  private wrapEmailHtml(content: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C4704B;">EPDE</h2>
        ${content}
        <hr style="border: none; border-top: 1px solid #E8DDD3; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">EPDE - Estudio Profesional de Diagnóstico Edilicio</p>
      </div>
    `;
  }

  private ctaButton(href: string, text: string): string {
    return `
      <p style="text-align: center; margin: 30px 0;">
        <a href="${href}" style="background-color: #C4704B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          ${text}
        </a>
      </p>
    `;
  }

  async sendInviteEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${this.frontendUrl}/set-password?token=${token}`;

    if (!this.resend) {
      this.logger.warn(
        `Email no enviado (RESEND_API_KEY no configurada). Link de invitación: ${link}`,
      );
      return;
    }

    await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject: 'Bienvenido a EPDE - Configurá tu contraseña',
      html: this.wrapEmailHtml(`
        <p>Hola ${name},</p>
        <p>Fuiste invitado a la plataforma de mantenimiento preventivo EPDE.</p>
        <p>Para comenzar, configurá tu contraseña haciendo clic en el siguiente enlace:</p>
        ${this.ctaButton(link, 'Configurar contraseña')}
        <p style="color: #666; font-size: 14px;">Este enlace expira en 24 horas.</p>
      `),
    });

    this.logger.log(`Email de invitación enviado a ${to}`);
  }

  async sendTaskReminderEmail(
    to: string,
    name: string,
    taskName: string,
    propertyAddress: string,
    dueDate: Date,
    categoryName: string,
    isOverdue: boolean,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email de recordatorio no enviado (RESEND_API_KEY no configurada)`);
      return;
    }

    const formattedDate = dueDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const subject = isOverdue
      ? `Tarea vencida: ${taskName}`
      : `Recordatorio: ${taskName} vence pronto`;

    const statusText = isOverdue
      ? `<p style="color: #dc2626; font-weight: bold;">Esta tarea está vencida desde el ${formattedDate}.</p>`
      : `<p>Esta tarea vence el <strong>${formattedDate}</strong>.</p>`;

    await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject,
      html: this.wrapEmailHtml(`
        <p>Hola ${name},</p>
        ${statusText}
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Tarea</td>
            <td style="padding: 8px 0; font-weight: bold;">${taskName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Categoría</td>
            <td style="padding: 8px 0;">${categoryName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Propiedad</td>
            <td style="padding: 8px 0;">${propertyAddress}</td>
          </tr>
        </table>
        ${this.ctaButton(`${this.frontendUrl}/dashboard`, 'Ver en EPDE')}
      `),
    });

    this.logger.log(`Email de recordatorio enviado a ${to} para tarea "${taskName}"`);
  }

  async sendBudgetQuotedEmail(
    to: string,
    name: string,
    budgetTitle: string,
    totalAmount: number,
    budgetId: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email de presupuesto no enviado (RESEND_API_KEY no configurada)`);
      return;
    }

    const formattedAmount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(totalAmount);

    await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject: `Tu presupuesto "${budgetTitle}" fue cotizado`,
      html: this.wrapEmailHtml(`
        <p>Hola ${name},</p>
        <p>Tu presupuesto <strong>"${budgetTitle}"</strong> fue cotizado por un monto total de:</p>
        <p style="font-size: 24px; font-weight: bold; text-align: center; color: #C4704B; margin: 20px 0;">${formattedAmount}</p>
        <p>Ingresá a la plataforma para revisar el detalle y aprobarlo o rechazarlo.</p>
        ${this.ctaButton(`${this.frontendUrl}/budgets/${budgetId}`, 'Ver presupuesto')}
      `),
    });

    this.logger.log(`Email de presupuesto cotizado enviado a ${to}`);
  }

  async sendBudgetStatusEmail(
    to: string,
    name: string,
    budgetTitle: string,
    newStatus: string,
    budgetId: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email de estado no enviado (RESEND_API_KEY no configurada)`);
      return;
    }

    const statusLabel = BUDGET_STATUS_LABELS[newStatus] ?? newStatus;

    await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject: `Actualización de presupuesto: ${budgetTitle}`,
      html: this.wrapEmailHtml(`
        <p>Hola ${name},</p>
        <p>Tu presupuesto <strong>"${budgetTitle}"</strong> fue actualizado al estado: <strong>${statusLabel}</strong>.</p>
        <p>Ingresá a la plataforma para ver los detalles.</p>
        ${this.ctaButton(`${this.frontendUrl}/budgets/${budgetId}`, 'Ver presupuesto')}
      `),
    });

    this.logger.log(`Email de estado de presupuesto enviado a ${to}`);
  }
}
