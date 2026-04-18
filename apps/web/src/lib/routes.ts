/**
 * Canonical route strings for the web app. Every `<Link href="...">` and
 * `router.push('...')` in `apps/web/src/` should import from here.
 *
 * Why: previously routes were scattered as inline string literals across 40+
 * call sites, making renames a grep-and-pray exercise and letting typos
 * (`/budget/${id}` vs `/budgets/${id}`) slip past TypeScript. This file is
 * the forcing function — future route changes update one place.
 *
 * Static routes are plain string constants; dynamic routes are factory
 * functions. Query params that travel with a specific navigation should
 * accept an options bag (e.g. `properties(id, { tab: 'plan' })`) rather
 * than be appended by the caller, so the full URL stays testable.
 *
 * Paired with the `no-inline-href` convention documented in SIEMPRE #4-adj.
 * New hrefs / push calls that don't come from ROUTES should be flagged
 * in code review until the lint rule is written.
 */
export const ROUTES = {
  // Root
  home: '/',

  // Auth
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  setPassword: '/set-password',

  // Subscription
  subscriptionExpired: '/subscription-expired',

  // Dashboard
  dashboard: '/dashboard',

  // Client-facing domain
  properties: '/properties',
  property: (id: string, options?: { tab?: string }) =>
    options?.tab ? `/properties/${id}?tab=${options.tab}` : `/properties/${id}`,
  propertyReport: (id: string) => `/properties/${id}/report`,
  propertyCertificate: (id: string) => `/properties/${id}/certificate`,

  tasks: '/tasks',

  budgets: '/budgets',
  budget: (id: string) => `/budgets/${id}`,
  /** Deep link that opens the budgets list with the create-dialog already open. */
  newBudget: '/budgets?action=create',

  serviceRequests: '/service-requests',
  serviceRequest: (id: string) => `/service-requests/${id}`,
  /** Deep link that opens the list with the create-dialog already open. */
  newServiceRequest: '/service-requests?action=create',

  maintenancePlans: '/maintenance-plans',
  notifications: '/notifications',

  // Admin-only domain
  clients: '/clients',
  client: (id: string) => `/clients/${id}`,

  categories: '/categories',
  templates: '/templates',
  landingSettings: '/landing-settings',

  // Shared
  guide: '/guide',
  profile: '/profile',
} as const;
