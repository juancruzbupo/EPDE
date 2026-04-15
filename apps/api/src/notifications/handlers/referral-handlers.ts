import { Injectable } from '@nestjs/common';

import { HandlerContext } from '../handler-context.service';

/**
 * Notification handlers for the referral program (ADR-010):
 *   - milestone reached (email + in-app to the referrer),
 *   - max (10) reached (admin alert email).
 */
@Injectable()
export class ReferralHandlers {
  constructor(private readonly ctx: HandlerContext) {}

  /**
   * Fires after ReferralsService.convertReferral crosses a new milestone
   * (the reward delta is > 0). Emails the referrer with celebration copy.
   * The BullMQ jobId is milestone-scoped so re-calls for the same milestone
   * collapse to a single send.
   */
  async onMilestoneReached(payload: {
    userId: string;
    userEmail: string;
    userName: string;
    milestone: number;
    creditMonths: number;
    nextMilestone: number | null;
    hasAnnualDiagnosis: boolean;
    hasBiannualDiagnosis: boolean;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleReferralMilestoneReached',
      payload as Record<string, unknown>,
      async () => {
        await Promise.all([
          this.ctx.emailQueueService.enqueueReferralMilestone({
            to: payload.userEmail,
            name: payload.userName,
            milestone: payload.milestone,
            creditMonths: payload.creditMonths,
            nextMilestone: payload.nextMilestone,
            hasAnnualDiagnosis: payload.hasAnnualDiagnosis,
            hasBiannualDiagnosis: payload.hasBiannualDiagnosis,
          }),
          // Also surface the milestone in-app so the user sees it next time
          // they open the dashboard, not just in their inbox.
          this.ctx.notificationQueueService.enqueue({
            userId: payload.userId,
            type: 'SYSTEM',
            title: `¡Llegaste a ${payload.milestone} recomendaciones!`,
            message:
              payload.milestone === 10
                ? 'Llegaste al tope del programa. Te contactamos pronto.'
                : `Ya tenés ${payload.creditMonths} meses de crédito en tu suscripción.`,
            data: { milestone: String(payload.milestone) },
          }),
        ]);
      },
    );
  }

  /**
   * Fires exactly once when any client hits 10 conversions — alerts the
   * admin so she can reach out with ambassador conditions. BullMQ jobId
   * is keyed by clientId so repeated firings are collapsed.
   */
  async onMaxReached(payload: {
    adminEmail: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleReferralMaxReached',
      payload as Record<string, unknown>,
      async () => {
        await this.ctx.emailQueueService.enqueueReferralMaxAdmin({
          to: payload.adminEmail,
          clientName: payload.clientName,
          clientEmail: payload.clientEmail,
          clientId: payload.clientId,
        });
      },
    );
  }
}
