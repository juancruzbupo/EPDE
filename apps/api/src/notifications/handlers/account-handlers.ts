import { Injectable } from '@nestjs/common';

import { HandlerContext } from '../handler-context.service';

/**
 * Notification handlers for account-lifecycle events. Today just the
 * client-invited email — future welcome / password-reset / email-change
 * handlers land here.
 */
@Injectable()
export class AccountHandlers {
  constructor(private readonly ctx: HandlerContext) {}

  async onClientInvited(payload: { email: string; name: string; token: string }): Promise<void> {
    return this.ctx.withDLQ('handleClientInvited', payload as Record<string, unknown>, async () => {
      await this.ctx.emailQueueService.enqueueInvite(payload.email, payload.name, payload.token);
    });
  }
}
