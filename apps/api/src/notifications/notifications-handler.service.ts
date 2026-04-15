import { BudgetStatus, ServiceStatus, type ServiceUrgency } from '@epde/shared';
import { Injectable } from '@nestjs/common';

import { HandlerContext } from './handler-context.service';
import {
  AccountHandlers,
  BudgetHandlers,
  PropertyHealthHandlers,
  ReferralHandlers,
  ServiceRequestHandlers,
  SubscriptionHandlers,
  TaskHandlers,
} from './handlers';

/**
 * Facade for domain side-effects (notifications, emails, push). This file is
 * the public seam: domain services inject `NotificationsHandlerService` and
 * call a method on it. Each method delegates to a per-domain handler class
 * under `./handlers/*` so this file stays a flat dispatch table — adding a
 * new side-effect inside a domain touches its handler file, not this one.
 *
 * See {@link docs/adr/006-notification-handler-vs-events.md} for why this
 * is a typed facade instead of an EventEmitter / RxJS bus.
 *
 * ## Architecture rule
 * Domain services MUST inject THIS service instead of NotificationQueueService
 * or EmailQueueService directly. The facade gives them a type-safe, IDE-
 * traceable surface without coupling them to the underlying transport.
 *
 * ## Usage pattern (fire-and-forget)
 * ```typescript
 * void this.notificationsHandler.handleBudgetCreated({ budgetId, title, requesterId });
 * ```
 * Every handler goes through `HandlerContext.withDLQ` — callers never need
 * try/catch; failures are logged and persisted to `FailedNotification` for
 * hourly retry by `NotificationRetryService`.
 *
 * ## Adding a new side-effect
 * 1. Add `onXxxYyy(payload)` to the relevant handler class under `./handlers/`.
 *    If no existing class fits the bounded context, create a new one and
 *    register it in `NotificationsModule`.
 * 2. Add the matching `handleXxxYyy` delegator method here.
 * 3. Inject `NotificationsHandlerService` in the target domain service and
 *    call `void this.notificationsHandler.handleXxxYyy(...)` after the DB write.
 */
@Injectable()
export class NotificationsHandlerService {
  constructor(
    private readonly ctx: HandlerContext,
    private readonly budget: BudgetHandlers,
    private readonly service: ServiceRequestHandlers,
    private readonly task: TaskHandlers,
    private readonly referral: ReferralHandlers,
    private readonly subscription: SubscriptionHandlers,
    private readonly account: AccountHandlers,
    private readonly propertyHealth: PropertyHealthHandlers,
  ) {}

  // ─── Budget ──────────────────────────────────────────────────────────────

  handleBudgetCreated(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
  }): Promise<void> {
    return this.budget.onBudgetCreated(payload);
  }

  handleBudgetQuoted(payload: {
    budgetId: string;
    title: string;
    requesterId: string;
    totalAmount: number;
  }): Promise<void> {
    return this.budget.onBudgetQuoted(payload);
  }

  handleBudgetStatusChanged(payload: {
    budgetId: string;
    title: string;
    oldStatus: BudgetStatus;
    newStatus: BudgetStatus;
    requesterId: string;
  }): Promise<void> {
    return this.budget.onBudgetStatusChanged(payload);
  }

  handleBudgetCommentAdded(payload: {
    budgetId: string;
    title: string;
    commentAuthorId: string;
    requesterId: string;
  }): Promise<void> {
    return this.budget.onBudgetCommentAdded(payload);
  }

  // ─── Service Request ────────────────────────────────────────────────────

  handleServiceCreated(payload: {
    serviceRequestId: string;
    title: string;
    requesterId: string;
    urgency: ServiceUrgency;
  }): Promise<void> {
    return this.service.onServiceCreated(payload);
  }

  handleServiceStatusChanged(payload: {
    serviceRequestId: string;
    title: string;
    oldStatus: ServiceStatus;
    newStatus: ServiceStatus;
    requesterId: string;
  }): Promise<void> {
    return this.service.onServiceStatusChanged(payload);
  }

  handleServiceCommentAdded(payload: {
    serviceRequestId: string;
    title: string;
    commentAuthorId: string;
    requesterId: string;
  }): Promise<void> {
    return this.service.onServiceCommentAdded(payload);
  }

  // ─── Task / Plan ─────────────────────────────────────────────────────────

  handlePlanGenerated(payload: {
    userId: string;
    planId: string;
    propertyId: string;
    propertyAddress: string;
  }): Promise<void> {
    return this.task.onPlanGenerated(payload);
  }

  handleTaskReminders(payload: {
    notifications: Array<{
      userId: string;
      type: 'TASK_REMINDER';
      title: string;
      message: string;
      data: Record<string, unknown>;
    }>;
    emails: Array<{
      to: string;
      name: string;
      taskId: string;
      taskName: string;
      propertyAddress: string;
      dueDate: Date;
      categoryName: string;
      isOverdue: boolean;
    }>;
  }): Promise<{ notificationCount: number; failedEmails: number }> {
    return this.task.onTaskReminders(payload);
  }

  handleProblemDetected(payload: {
    taskName: string;
    propertyAddress: string;
    propertyId: string;
    conditionLabel: string;
  }): Promise<void> {
    return this.task.onProblemDetected(payload);
  }

  // ─── Referral ────────────────────────────────────────────────────────────

  handleReferralMilestoneReached(payload: {
    userId: string;
    userEmail: string;
    userName: string;
    milestone: number;
    creditMonths: number;
    nextMilestone: number | null;
    hasAnnualDiagnosis: boolean;
    hasBiannualDiagnosis: boolean;
  }): Promise<void> {
    return this.referral.onMilestoneReached(payload);
  }

  handleReferralMaxReached(payload: {
    adminEmail: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
  }): Promise<void> {
    return this.referral.onMaxReached(payload);
  }

  // ─── Subscription ────────────────────────────────────────────────────────

  handleSubscriptionChanged(payload: {
    userId: string;
    userName: string;
    action: 'extended' | 'suspended' | 'unlimited';
    newExpiresAt: Date | null;
  }): Promise<void> {
    return this.subscription.onSubscriptionChanged(payload);
  }

  handleSubscriptionReminder(payload: {
    userId: string;
    userName: string;
    daysLeft: number;
    expiresAt: Date;
  }): Promise<void> {
    return this.subscription.onSubscriptionReminder(payload);
  }

  // ─── Account ─────────────────────────────────────────────────────────────

  handleClientInvited(payload: { email: string; name: string; token: string }): Promise<void> {
    return this.account.onClientInvited(payload);
  }

  // ─── Property health ─────────────────────────────────────────────────────

  handleISVAlert(payload: {
    propertyId: string;
    userId: string;
    address: string;
    previousScore: number;
    currentScore: number;
  }): Promise<void> {
    return this.propertyHealth.onISVAlert(payload);
  }

  /**
   * Called exclusively by NotificationRetryService. Runs the named handler
   * under the retry flag (see HandlerContext.runInRetry) — on failure the
   * error re-throws instead of creating a new DLQ row. The retry service
   * manages the retryCount / backoff on the original FailedNotification row.
   */
  async retryDispatch(handler: string, payload: Record<string, unknown>): Promise<void> {
    return this.ctx.runInRetry(async () => {
      const method = (this as unknown as Record<string, unknown>)[handler];
      if (typeof method !== 'function') {
        throw new Error(`Unknown handler: ${handler}`);
      }
      await (method as (p: Record<string, unknown>) => Promise<void>).call(this, payload);
    });
  }
}
