// ─── Query Keys (frontend SSoT) ────────────────────────
//
// Pattern:
//   queryKey: buildKey('inspections', 'templates', propertyId)
//
// The first argument is a `QUERY_KEY_NAME` (type-checked against
// the QUERY_KEYS dictionary below). Remaining segments can be
// QUERY_SUB_KEY_NAME (sub-key from the enum) or raw strings
// (typically UUIDs / runtime IDs).
//
// Why: prevents typos between invalidation and consumption
// (`'templates'` vs `'template'`) that silently break cache.
// ESLint rule `query-key-must-use-builder` enforces use in hooks.

export const QUERY_KEYS = {
  budgets: 'budgets',
  dashboard: 'dashboard',
  clients: 'clients',
  properties: 'properties',
  serviceRequests: 'service-requests',
  notifications: 'notifications',
  plans: 'plans',
  categories: 'categories',
  categoryTemplates: 'category-templates',
  quoteTemplates: 'quote-templates',
  taskDetail: 'task-detail',
  taskLogs: 'task-logs',
  taskNotes: 'task-notes',
  // Dashboard sub-keys
  dashboardStats: 'stats',
  dashboardActivity: 'activity',
  dashboardClientStats: 'client-stats',
  dashboardClientUpcoming: 'client-upcoming',
  dashboardAnalytics: 'analytics',
  dashboardClientAnalytics: 'client-analytics',
  // Budget sub-keys
  budgetAuditLog: 'budget-audit-log',
  budgetComments: 'budget-comments',
  // Service request sub-keys
  serviceRequestAuditLog: 'service-request-audit-log',
  serviceRequestComments: 'service-request-comments',
  // Notifications sub-keys
  notificationsUnreadCount: 'unread-count',
  // Property sub-keys
  propertyExpenses: 'expenses',
  propertyPhotos: 'photos',
  propertyHealthIndex: 'health-index',
  propertyHealthHistory: 'health-history',
  propertyProblems: 'problems',
  propertyCertificate: 'certificate',
  propertyReport: 'report',
  // Plan sub-keys
  plansList: 'list',
  plansTasks: 'tasks',
  // Client sub-keys
  clientsSearch: 'search',
  // Inspection sub-keys
  inspections: 'inspections',
  // Landing settings
  landingSettings: 'landing-settings',
  // User features
  milestones: 'milestones',
  // Referral program
  referrals: 'referrals',
  // Professionals directory (admin)
  professionals: 'professionals',
  professionalSuggestions: 'suggestions',
  professionalRatings: 'ratings',
  professionalTimeline: 'timeline',
  professionalAttachments: 'attachments',
  professionalPayments: 'professional-payments',
  // Technical inspections (admin-billable service)
  technicalInspections: 'technical-inspections',
} as const;

export type QueryKeyName = keyof typeof QUERY_KEYS;

/**
 * Known sub-keys that appear concatenated after a `QUERY_KEYS.*` base.
 * Each entry is a literal string that hooks can reference as a typed
 * constant instead of a bare string. Runtime IDs (UUIDs, propertyIds)
 * are passed as raw strings — those don't need typing.
 */
export const QUERY_SUB_KEYS = {
  all: 'all',
  templates: 'templates',
  weeklyChallenge: 'weekly-challenge',
  trend: 'trend',
  stats: 'stats',
} as const;

export type QuerySubKey = (typeof QUERY_SUB_KEYS)[keyof typeof QUERY_SUB_KEYS];

/**
 * Build a type-safe queryKey array for react-query. Validates that the
 * first argument is a known QUERY_KEYS entry and accepts any number of
 * additional segments (sub-keys or runtime IDs).
 *
 * @example
 *   buildKey('inspections', QUERY_SUB_KEYS.templates, propertyId)
 *   buildKey('dashboard', QUERY_SUB_KEYS.weeklyChallenge)
 *   buildKey('properties', propertyId)  // bare ID, no sub-key
 */
export function buildKey(
  base: QueryKeyName,
  ...segments: Array<QuerySubKey | string | number | null | undefined>
): readonly unknown[] {
  return [QUERY_KEYS[base], ...segments.filter((s) => s != null)];
}
