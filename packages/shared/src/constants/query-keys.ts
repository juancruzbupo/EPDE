// ─── Query Keys (frontend SSoT) ────────────────────────

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
  taskTemplates: 'task-templates',
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
} as const;
