/**
 * Barrel export for notification handler classes.
 *
 * Why this file exists: the facade `NotificationsHandlerService` injects each
 * handler by name. Without a single registration point, a new contributor
 * adding a `foo-handlers.ts` file would also need to remember to wire it into
 * the facade — easy to forget, no enforcement, the handler ends up uninvoked.
 *
 * Rules for adding a new handler:
 *   1. Create `<context>-handlers.ts` with the handler class.
 *   2. Add `export { ... } from './<context>-handlers';` here.
 *   3. Add it to the `providers: [...]` of `NotificationsModule`.
 *   4. Inject + delegate from `notifications-handler.service.ts`.
 *
 * Step 2 is what this file enforces — `notifications-handler.service.ts`
 * imports from this barrel, so a missing entry surfaces as a compile error
 * the moment you reference the handler from the facade.
 */
export { AccountHandlers } from './account-handlers';
export { BudgetHandlers } from './budget-handlers';
export { PropertyHealthHandlers } from './property-health-handlers';
export { ReferralHandlers } from './referral-handlers';
export { ServiceRequestHandlers } from './service-request-handlers';
export { SubscriptionHandlers } from './subscription-handlers';
export { TaskHandlers } from './task-handlers';
