/**
 * `createXxxQueries(apiClient)` factories — the idiomatic way for a domain to
 * expose its HTTP surface to both web and mobile. Each app does:
 *
 *   const queries = createXxxQueries(apiClient);
 *   export const { getXxx, createXxx, ... } = queries;
 *
 * Domains INTENTIONALLY without a shared factory (each app rolls its own):
 *   - `auth` base flow (login / refresh / token rotation) — cookies on web
 *     vs SecureStore on mobile diverge enough that sharing would obscure
 *     more than it would share. `createAuthFeatureQueries` (below) covers
 *     the post-login features (streak freezes, milestones) that are shared.
 *   - `upload` — multipart form-data to Cloudflare R2. Web uses the browser
 *     File API, mobile uses `expo-image-picker` + FormData shims. No
 *     meaningful common surface.
 *   - `landing-settings` (public read + admin write) — web-only; no mobile
 *     consumer. Promoting to a shared factory would be dead weight.
 *   - `inspections` — web-only (admin flow). Same rationale as landing.
 *
 * Adding a domain: put the factory in its own file here, re-export below,
 * then `createXxxQueries(apiClient)` from `apps/web/src/lib/api/xxx.ts` +
 * `apps/mobile/src/lib/api/xxx.ts`. ADR-011-style rationales for the four
 * exceptions above belong in this header — keep the list explicit so the
 * factory pattern doesn't become "apply where convenient".
 */
export {
  createAuthFeatureQueries,
  type StreakFreezeResult,
  type UserMilestonePublic,
} from './auth';
export { type BudgetFilters, createBudgetQueries } from './budgets';
export { createCategoryQueries } from './categories';
export { createCategoryTemplateQueries } from './category-templates';
export { type ClientFilters, createClientQueries } from './clients';
export { createDashboardQueries } from './dashboard';
export { createMaintenancePlanQueries } from './maintenance-plans';
export { createNotificationQueries, type NotificationFilters } from './notifications';
export { createProfessionalQueries } from './professionals';
export { createPropertyQueries, type PropertyFilters } from './properties';
export {
  createQuoteTemplateQueries,
  type QuoteTemplateItem,
  type QuoteTemplatePublic,
} from './quote-templates';
export { createReferralQueries } from './referrals';
export { createServiceRequestQueries, type ServiceRequestFilters } from './service-requests';
export {
  type AddTaskRequest,
  createTaskQueries,
  type TaskListFilters,
  type UpdateTaskRequest,
} from './tasks';
