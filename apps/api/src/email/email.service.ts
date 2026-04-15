import { DESIGN_TOKENS_LIGHT } from '@epde/shared';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/** Mask email for logging — shows first 3 chars + domain only. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${local?.slice(0, 3)}***@${domain ?? 'unknown'}`;
}

const BUDGET_STATUS_LABELS: Record<string, string> = {
  APPROVED: 'aprobado',
  REJECTED: 'rechazado',
  IN_PROGRESS: 'en progreso',
  COMPLETED: 'completado',
  QUOTED: 'cotizado',
  PENDING: 'pendiente',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
        <h2 style="color: ${DESIGN_TOKENS_LIGHT.primary};">EPDE</h2>
        ${content}
        <hr style="border: none; border-top: 1px solid ${DESIGN_TOKENS_LIGHT.border}; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px;">EPDE - Estudio Profesional de Diagnóstico Edilicio</p>
      </div>
    `;
  }

  private ctaButton(href: string, text: string): string {
    return `
      <p style="text-align: center; margin: 30px 0;">
        <a href="${escapeHtml(href)}" style="background-color: ${DESIGN_TOKENS_LIGHT.primary}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          ${escapeHtml(text)}
        </a>
      </p>
    `;
  }

  async sendInviteEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${this.frontendUrl}/set-password?token=${encodeURIComponent(token)}`;

    if (!this.resend) {
      this.logger.warn(
        `Email de invitación no enviado (RESEND_API_KEY no configurada). Destinatario: ${to}`,
      );
      return;
    }

    const safeName = escapeHtml(name);

    await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject: 'Bienvenido a EPDE - Configurá tu contraseña',
      html: this.wrapEmailHtml(`
        <p>Hola ${safeName},</p>
        <p>Fuiste invitado a la plataforma de mantenimiento preventivo EPDE.</p>
        <p>Para comenzar, configurá tu contraseña haciendo clic en el siguiente enlace:</p>
        ${this.ctaButton(link, 'Configurar contraseña')}
        <p style="color: #666; font-size: 14px;">Este enlace expira en 24 horas.</p>
        <p style="color: #666; font-size: 14px;">Podés ver la <a href="${this.frontendUrl}/guia" style="color: ${DESIGN_TOKENS_LIGHT.primary};">guía de uso</a> para conocer cómo funciona el sistema.</p>
      `),
    });

    this.logger.log(`Email de invitación enviado a ${maskEmail(to)}`);
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    if (!this.resend) {
      this.logger.warn(
        `Email de recuperación no enviado (RESEND_API_KEY no configurada). Destinatario: ${to}`,
      );
      return;
    }

    const safeName = escapeHtml(name);

    await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject: 'EPDE - Recuperá tu contraseña',
      html: this.wrapEmailHtml(`
        <p>Hola ${safeName},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Hacé clic en el siguiente enlace para crear una nueva contraseña:</p>
        ${this.ctaButton(link, 'Restablecer contraseña')}
        <p style="color: #666; font-size: 14px;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignorá este email.</p>
      `),
    });

    this.logger.log(`Email de recuperación enviado a ${maskEmail(to)}`);
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

    const safeName = escapeHtml(name);
    const safeTaskName = escapeHtml(taskName);
    const safeCategoryName = escapeHtml(categoryName);
    const safePropertyAddress = escapeHtml(propertyAddress);

    const subject = isOverdue
      ? `Tarea vencida: ${taskName}`
      : `Recordatorio: ${taskName} vence pronto`;

    const statusText = isOverdue
      ? `<p style="color: ${DESIGN_TOKENS_LIGHT.destructive}; font-weight: bold;">Esta tarea está vencida desde el ${formattedDate}.</p>`
      : `<p>Esta tarea vence el <strong>${formattedDate}</strong>.</p>`;

    await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject,
      html: this.wrapEmailHtml(`
        <p>Hola ${safeName},</p>
        ${statusText}
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Tarea</td>
            <td style="padding: 8px 0; font-weight: bold;">${safeTaskName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Categoría</td>
            <td style="padding: 8px 0;">${safeCategoryName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Propiedad</td>
            <td style="padding: 8px 0;">${safePropertyAddress}</td>
          </tr>
        </table>
        ${this.ctaButton(`${this.frontendUrl}/dashboard`, 'Ver en EPDE')}
      `),
    });

    this.logger.log(`Email de recordatorio enviado a ${maskEmail(to)} para tarea "${taskName}"`);
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

    const safeName = escapeHtml(name);
    const safeBudgetTitle = escapeHtml(budgetTitle);

    await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject: `Tu presupuesto "${budgetTitle}" fue cotizado`,
      html: this.wrapEmailHtml(`
        <p>Hola ${safeName},</p>
        <p>Tu presupuesto <strong>"${safeBudgetTitle}"</strong> fue cotizado por un monto total de:</p>
        <p style="font-size: 24px; font-weight: bold; text-align: center; color: ${DESIGN_TOKENS_LIGHT.primary}; margin: 20px 0;">${formattedAmount}</p>
        <p>Ingresá a la plataforma para revisar el detalle y aprobarlo o rechazarlo.</p>
        ${this.ctaButton(`${this.frontendUrl}/budgets/${encodeURIComponent(budgetId)}`, 'Ver presupuesto')}
      `),
    });

    this.logger.log(`Email de presupuesto cotizado enviado a ${maskEmail(to)}`);
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
    const safeName = escapeHtml(name);
    const safeBudgetTitle = escapeHtml(budgetTitle);

    await this.resend.emails.send({
      from: this.emailFrom,
      to,
      subject: `Actualización de presupuesto: ${budgetTitle}`,
      html: this.wrapEmailHtml(`
        <p>Hola ${safeName},</p>
        <p>Tu presupuesto <strong>"${safeBudgetTitle}"</strong> fue actualizado al estado: <strong>${escapeHtml(statusLabel)}</strong>.</p>
        <p>Ingresá a la plataforma para ver los detalles.</p>
        ${this.ctaButton(`${this.frontendUrl}/budgets/${encodeURIComponent(budgetId)}`, 'Ver presupuesto')}
      `),
    });

    this.logger.log(`Email de estado de presupuesto enviado a ${maskEmail(to)}`);
  }

  async sendWeeklySummaryEmail(data: {
    to: string;
    name: string;
    score: number;
    pendingTasks: number;
    overdueTasks: number;
    upcomingThisWeek: number;
    streak: number;
    nextTaskName: string | null;
    nextTaskDate: string | null;
  }): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email semanal no enviado (RESEND_API_KEY no configurada)`);
      return;
    }

    const safeName = escapeHtml(data.name);
    const totalPending = data.pendingTasks + data.overdueTasks;

    let statusLine: string;
    if (totalPending === 0) {
      statusLine = `<p style="color: ${DESIGN_TOKENS_LIGHT.success}; font-weight: bold;">Tu casa está al día. No tenés tareas pendientes.</p>`;
    } else if (data.overdueTasks > 0) {
      statusLine = `<p style="color: ${DESIGN_TOKENS_LIGHT.destructive}; font-weight: bold;">Tenés ${data.overdueTasks} tarea${data.overdueTasks > 1 ? 's' : ''} vencida${data.overdueTasks > 1 ? 's' : ''} que necesitan atención.</p>`;
    } else {
      statusLine = `<p>Tenés ${data.upcomingThisWeek} tarea${data.upcomingThisWeek > 1 ? 's' : ''} programada${data.upcomingThisWeek > 1 ? 's' : ''} esta semana.</p>`;
    }

    const streakLine =
      data.streak > 0
        ? `<p>🔥 Racha: <strong>${data.streak} ${data.streak === 1 ? 'mes' : 'meses'}</strong> sin tareas vencidas.</p>`
        : '';

    const nextTaskLine =
      data.nextTaskName && data.nextTaskDate
        ? `<p>Próxima tarea: <strong>${escapeHtml(data.nextTaskName)}</strong> — ${new Date(data.nextTaskDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' })}</p>`
        : '';

    await this.resend.emails.send({
      from: this.emailFrom,
      to: data.to,
      subject: `Tu casa esta semana — ISV ${data.score}/100`,
      html: this.wrapEmailHtml(`
        <p>Hola ${safeName},</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 16px; text-align: center; background-color: ${DESIGN_TOKENS_LIGHT.secondary}; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #666;">Índice de Salud de la Vivienda</p>
              <p style="margin: 8px 0 0; font-size: 36px; font-weight: bold; color: ${DESIGN_TOKENS_LIGHT.primary};">${data.score}<span style="font-size: 16px; color: #999;">/100</span></p>
            </td>
          </tr>
        </table>
        ${statusLine}
        ${nextTaskLine}
        ${streakLine}
        ${this.ctaButton(`${this.frontendUrl}/dashboard`, 'Ver mi dashboard')}
      `),
    });

    this.logger.log(`Email semanal enviado a ${maskEmail(data.to)}`);
  }

  /**
   * Referral milestone email. Sent to the referrer when their convertedCount
   * crosses 1, 2, 3, 5 or 10. Single template with conditional copy —
   * milestone 10 swaps to the "embajador" tone and Noelia gets a separate
   * admin alert (sendReferralMaxAdminEmail).
   */
  async sendReferralMilestoneEmail(data: {
    to: string;
    name: string;
    milestone: number;
    creditMonths: number;
    nextMilestone: number | null;
    hasAnnualDiagnosis: boolean;
    hasBiannualDiagnosis: boolean;
  }): Promise<void> {
    const firstName = data.name.split(/\s+/)[0] ?? data.name;
    const isFirst = data.milestone === 1;
    const isMax = data.milestone === 10;

    const subject = isFirst
      ? `🎉 ¡Ganaste tu primer mes gratis en EPDE!`
      : isMax
        ? `🏆 ¡Lo lograste, ${firstName}! 10 conversiones en EPDE`
        : `🚀 ¡${firstName}, llegaste a ${data.milestone} conversiones!`;

    const credits: string[] = [`${data.creditMonths} meses de suscripción`];
    if (data.hasAnnualDiagnosis) credits.push('re-diagnóstico anual');
    if (data.hasBiannualDiagnosis) credits.push('re-diagnóstico bianual');
    const creditLine = credits.join(' + ');

    const nextLine = data.nextMilestone
      ? `<p>Tu próximo hito está en <strong>${data.nextMilestone} conversiones</strong> — seguí compartiendo tu código.</p>`
      : `<p>Este es el tope del programa. <strong>Me pongo en contacto pronto</strong> para las condiciones especiales de embajador.</p>`;

    const bodyIntro = isFirst
      ? `<p>¡Felicitaciones, ${escapeHtml(firstName)}! Tu primera recomendación pagó el diagnóstico, así que ya podés disfrutar de tu primer mes extra de suscripción gratis.</p>`
      : isMax
        ? `<p>${escapeHtml(firstName)}, llegaste al tope del programa "Trae un amigo" con 10 conversiones. Eso significa <strong>1 año entero gratis</strong> y un re-diagnóstico bianual incluido.</p>`
        : `<p>${escapeHtml(firstName)}, una nueva persona que recomendaste pagó su diagnóstico. Ya vas por ${data.milestone} conversiones.</p>`;

    await this.resend?.emails.send({
      from: this.emailFrom,
      to: data.to,
      subject,
      html: this.wrapEmailHtml(`
        <h3>${escapeHtml(subject.replace(/^\p{Extended_Pictographic}\s*/u, ''))}</h3>
        ${bodyIntro}
        <p><strong>Crédito actual:</strong> ${escapeHtml(creditLine)}.</p>
        ${nextLine}
        ${this.ctaButton(`${this.frontendUrl}/profile#recomendaciones`, 'Ver mis recomendaciones')}
        <p style="margin-top: 24px; color: #666;">Arq. Noelia E. Yuskowich — EPDE</p>
      `),
    });

    this.logger.log(`Email hito recomendación ${data.milestone} enviado a ${maskEmail(data.to)}`);
  }

  /**
   * Admin alert — fires when any client hits 10 conversions. Noelia wants a
   * heads-up so she can reach out for custom ambassador conditions.
   */
  async sendReferralMaxAdminEmail(data: {
    to: string;
    clientName: string;
    clientEmail: string;
    clientId: string;
  }): Promise<void> {
    await this.resend?.emails.send({
      from: this.emailFrom,
      to: data.to,
      subject: `⚡ Alerta: ${data.clientName} alcanzó 10 conversiones`,
      html: this.wrapEmailHtml(`
        <h3>Un cliente llegó al tope del programa de recomendaciones</h3>
        <p><strong>${escapeHtml(data.clientName)}</strong> (${escapeHtml(data.clientEmail)}) acaba de cruzar las 10 conversiones del programa "Trae un amigo".</p>
        <p>Ya tiene el máximo crédito asignado (1 año + re-diagnóstico bianual). Cualquier recomendación adicional NO genera más recompensas automáticas.</p>
        <p><strong>Sugerido</strong>: contactarlo/a para condiciones de embajador.</p>
        ${this.ctaButton(`${this.frontendUrl}/clients/${data.clientId}`, 'Ver ficha del cliente')}
      `),
    });

    this.logger.log(`Email admin alerta max-conversiones enviado a ${maskEmail(data.to)}`);
  }

  async sendAnniversaryEmail(data: { to: string; name: string; taskCount: number }): Promise<void> {
    await this.resend?.emails.send({
      from: this.emailFrom,
      to: data.to,
      subject: '🎂 ¡1 año cuidando tu casa con EPDE!',
      html: this.wrapEmailHtml(`
        <h3>¡Felicitaciones, ${escapeHtml(data.name)}!</h3>
        <p>Hace un año empezaste a cuidar tu casa con EPDE. En este tiempo:</p>
        <table style="margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 16px; text-align: center; border: 1px solid ${DESIGN_TOKENS_LIGHT.border};">
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: ${DESIGN_TOKENS_LIGHT.primary};">${data.taskCount}</p>
              <p style="margin: 4px 0 0; color: #666; font-size: 14px;">inspecciones completadas</p>
            </td>
          </tr>
        </table>
        <p>Cada tarea que completaste fue un paso más para proteger tu patrimonio y evitar reparaciones costosas.</p>
        <p><strong>Gracias por confiar en EPDE. Seguimos cuidando tu casa.</strong></p>
        ${this.ctaButton(`${this.frontendUrl}/dashboard`, 'Ver mi dashboard')}
      `),
    });

    this.logger.log(`Email aniversario enviado a ${maskEmail(data.to)}`);
  }
}
