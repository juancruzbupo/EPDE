import { Injectable } from '@nestjs/common';

import { HandlerContext } from '../handler-context.service';

/**
 * Notification handlers for property-level health changes. Today just
 * the ISV alert when a property's score drops — future "plan coverage
 * dropped" or "sector missed inspection" handlers land here.
 */
@Injectable()
export class PropertyHealthHandlers {
  constructor(private readonly ctx: HandlerContext) {}

  /** Alert user when their property ISV drops significantly. */
  async onISVAlert(payload: {
    propertyId: string;
    userId: string;
    address: string;
    previousScore: number;
    currentScore: number;
  }): Promise<void> {
    return this.ctx.withDLQ('handleISVAlert', payload as Record<string, unknown>, async () => {
      const drop = payload.previousScore - payload.currentScore;
      await this.ctx.notificationQueueService.enqueue({
        userId: payload.userId,
        type: 'SYSTEM',
        title: 'Salud de tu propiedad bajó',
        message: `El índice de salud de ${payload.address} bajó ${drop} puntos (de ${payload.previousScore} a ${payload.currentScore}). Revisá las tareas pendientes.`,
        data: { propertyId: payload.propertyId },
      });

      this.ctx.sendPush(
        [payload.userId],
        'Salud de tu propiedad bajó',
        `ISV de ${payload.address}: ${payload.currentScore}/100`,
        { propertyId: payload.propertyId },
      );
    });
  }
}
