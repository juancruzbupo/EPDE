import { BudgetStatus } from '@epde/shared';
import { Injectable } from '@nestjs/common';

import { HandlerContext } from '../handler-context.service';

/**
 * Notification handlers for the Budget domain: request submitted, quote
 * delivered, status transitions (APPROVED/REJECTED/IN_PROGRESS/COMPLETED),
 * and new comments. Each method mirrors a BudgetsService side-effect.
 */
@Injectable()
export class BudgetHandlers {
  constructor(private readonly ctx: HandlerContext) {}

  async onBudgetCreated(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
  }): Promise<void> {
    return this.ctx.withDLQ('handleBudgetCreated', payload as Record<string, unknown>, async () => {
      const adminIds = await this.ctx.usersRepository.findAdminIds();

      await this.ctx.notificationQueueService.enqueueBatch(
        adminIds.map((adminId) => ({
          userId: adminId,
          type: 'BUDGET_UPDATE' as const,
          title: 'Nuevo presupuesto solicitado',
          message: `Se solicitó un presupuesto: "${payload.title}"`,
          data: { budgetId: payload.budgetId },
        })),
      );
    });
  }

  async onBudgetQuoted(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
    totalAmount: number;
  }): Promise<void> {
    return this.ctx.withDLQ('handleBudgetQuoted', payload as Record<string, unknown>, async () => {
      const notifTitle = 'Presupuesto cotizado';
      const notifMsg = `Tu presupuesto "${payload.title}" fue cotizado por $${payload.totalAmount.toLocaleString('es-AR')}`;

      await this.ctx.notificationQueueService.enqueue({
        userId: payload.requesterId,
        type: 'BUDGET_UPDATE',
        title: notifTitle,
        message: notifMsg,
        data: { budgetId: payload.budgetId },
      });

      this.ctx.sendPush([payload.requesterId], notifTitle, notifMsg, {
        budgetId: payload.budgetId,
      });

      const requester = await this.ctx.usersRepository.findEmailInfo(payload.requesterId);
      if (requester) {
        await this.ctx.emailQueueService.enqueueBudgetQuoted(
          requester.email,
          requester.name,
          payload.title,
          payload.totalAmount,
          payload.budgetId,
        );
      }
    });
  }

  async onBudgetStatusChanged(payload: {
    budgetId: string;
    title: string;
    oldStatus: BudgetStatus;
    newStatus: BudgetStatus;
    requesterId: string;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleBudgetStatusChanged',
      payload as Record<string, unknown>,
      async () => {
        const statusMessages: Partial<Record<BudgetStatus, string>> = {
          APPROVED: 'fue aprobado',
          REJECTED: 'fue rechazado',
          IN_PROGRESS: 'está en progreso',
          COMPLETED: 'fue completado',
        };

        const message = statusMessages[payload.newStatus] ?? 'cambió de estado';

        if (
          payload.newStatus === BudgetStatus.APPROVED ||
          payload.newStatus === BudgetStatus.REJECTED
        ) {
          const adminIds = await this.ctx.usersRepository.findAdminIds();
          await this.ctx.notificationQueueService.enqueueBatch(
            adminIds.map((adminId) => ({
              userId: adminId,
              type: 'BUDGET_UPDATE' as const,
              title: 'Actualización de presupuesto',
              message: `El presupuesto "${payload.title}" ${message}`,
              data: { budgetId: payload.budgetId },
            })),
          );
        } else {
          await this.ctx.notificationQueueService.enqueue({
            userId: payload.requesterId,
            type: 'BUDGET_UPDATE',
            title: 'Actualización de presupuesto',
            message: `Tu presupuesto "${payload.title}" ${message}`,
            data: { budgetId: payload.budgetId },
          });

          const requester = await this.ctx.usersRepository.findEmailInfo(payload.requesterId);
          if (requester) {
            await this.ctx.emailQueueService.enqueueBudgetStatus(
              requester.email,
              requester.name,
              payload.title,
              payload.newStatus,
              payload.budgetId,
            );
          }
        }
      },
    );
  }

  async onBudgetCommentAdded(payload: {
    budgetId: string;
    title: string;
    commentAuthorId: string;
    requesterId: string;
  }): Promise<void> {
    return this.ctx.withDLQ(
      'handleBudgetCommentAdded',
      payload as Record<string, unknown>,
      async () => {
        const adminIds = await this.ctx.usersRepository.findAdminIds();
        const isAdminComment = adminIds.includes(payload.commentAuthorId);
        const author = await this.ctx.usersRepository.findEmailInfo(payload.commentAuthorId);
        const authorName = author?.name ?? 'Un usuario';

        const recipients = isAdminComment ? [payload.requesterId] : adminIds;

        const notifTitle = 'Nuevo comentario en presupuesto';
        const notifMsg = `${authorName} comentó en "${payload.title}"`;

        await this.ctx.notificationQueueService.enqueueBatch(
          recipients.map((userId) => ({
            userId,
            type: 'BUDGET_UPDATE' as const,
            title: notifTitle,
            message: notifMsg,
            data: { budgetId: payload.budgetId },
          })),
        );

        this.ctx.sendPush(recipients, notifTitle, notifMsg, { budgetId: payload.budgetId });
      },
    );
  }
}
