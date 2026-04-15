import { Injectable } from '@nestjs/common';

import { HandlerContext } from '../handler-context.service';

/**
 * Notification handlers for subscription lifecycle — admin-driven
 * changes (extended / suspended / unlimited) and cron-driven expiry
 * reminders.
 */
@Injectable()
export class SubscriptionHandlers {
  constructor(private readonly ctx: HandlerContext) {}

  async onSubscriptionChanged(payload: {
    userId: string;
    userName: string;
    action: 'extended' | 'suspended' | 'unlimited';
    newExpiresAt: Date | null;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleSubscriptionChanged',
      payload as unknown as Record<string, unknown>,
      async () => {
        let title: string;
        let message: string;

        switch (payload.action) {
          case 'extended': {
            const dateStr = payload.newExpiresAt
              ? new Date(payload.newExpiresAt).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : '';
            title = 'Tu suscripción fue extendida';
            message = `${payload.userName}, tu acceso a EPDE fue extendido hasta el ${dateStr}.`;
            break;
          }
          case 'suspended':
            title = 'Tu suscripción fue suspendida';
            message = `${payload.userName}, tu acceso a EPDE fue suspendido. Contactá al administrador para más información.`;
            break;
          case 'unlimited':
            title = 'Tu suscripción fue actualizada';
            message = `${payload.userName}, tu acceso a EPDE ahora es ilimitado.`;
            break;
        }

        await this.ctx.notificationsService.createNotification({
          userId: payload.userId,
          type: 'SYSTEM',
          title,
          message,
        });

        this.ctx.sendPush([payload.userId], title, message);
      },
    );
  }

  async onSubscriptionReminder(payload: {
    userId: string;
    userName: string;
    daysLeft: number;
    expiresAt: Date;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleSubscriptionReminder',
      payload as unknown as Record<string, unknown>,
      async () => {
        const daysText = payload.daysLeft === 1 ? 'mañana' : `en ${payload.daysLeft} días`;
        const title = 'Tu suscripción está por vencer';
        const message = `${payload.userName}, tu acceso a EPDE vence ${daysText}. Contactá al administrador para renovar.`;

        await this.ctx.notificationsService.createNotification({
          userId: payload.userId,
          type: 'SYSTEM',
          title,
          message,
        });

        this.ctx.sendPush([payload.userId], title, message);
      },
    );
  }
}
