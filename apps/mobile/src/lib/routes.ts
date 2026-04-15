/**
 * Canonical route strings for the mobile app. Every `router.push(...)` /
 * `router.replace(...)` / `<Redirect href="...">` in `apps/mobile/src/`
 * should import from here.
 *
 * Why: previously routes were inline string literals across 25+ call sites,
 * with `as never` casts hiding typos from TypeScript. A rename meant a
 * grep-and-pray exercise. This file is the forcing function.
 *
 * Mirrors `apps/web/src/lib/routes.ts` in spirit — see ADR-013-adj for the
 * cross-platform routing policy. Note the URL shape DIFFERS between web and
 * mobile by design (e.g. web uses `/properties/${id}`, mobile uses
 * `/property/${id}`) because Expo Router's file-based layout settled on
 * singular-resource segments. Don't try to "fix" this asymmetry.
 *
 * Auth + tabs routes use Expo Router's group syntax `(auth)` / `(tabs)` —
 * these segments do NOT appear in the URL but group files in the file system.
 */
export const ROUTES = {
  // Auth
  login: '/(auth)/login',
  forgotPassword: '/(auth)/forgot-password',
  subscriptionExpired: '/(auth)/subscription-expired',

  // Tabs root (post-login landing)
  tabs: '/(tabs)',

  // Tab routes (visible)
  properties: '/properties',
  tasks: '/tasks',
  budgets: '/budgets',
  serviceRequests: '/service-requests',

  // Aliases — request-type-helper hops the user to the right list when they
  // pick "presupuesto" vs "servicio". Keeping these distinct reads cleaner
  // at call sites than reusing budgets/serviceRequests with a comment.
  budget: '/budget' as const,

  // Detail routes (dynamic)
  property: (id: string) => `/property/${id}` as const,
  task: (planId: string, taskId: string) => `/task/${planId}/${taskId}` as const,
  budgetDetail: (id: string) => `/budget/${id}` as const,
  serviceRequest: (id: string) => `/service-requests/${id}` as const,
} as const;
