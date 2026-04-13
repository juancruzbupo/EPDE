/**
 * Onboarding tour barrel re-export.
 *
 * Individual tour components live in `./tours/`:
 * - tour-core.tsx: shared Tour component, styles, locale, TOUR_KEYS, resetOnboardingTour
 * - client-tours.tsx: 11 CLIENT-role tours (dashboard, tasks, property, budget, plan, etc.)
 * - admin-tours.tsx: 4 ADMIN-role tours (admin dashboard, inspection, templates, clients)
 *
 * Keeping this barrel preserves existing imports of the form
 * `import { DashboardTour } from '@/components/onboarding-tour'`.
 */

export {
  AdminDashboardTour,
  ClientsTour,
  InspectionTour,
  TemplatesTour,
} from './tours/admin-tours';
export {
  BudgetsListTour,
  BudgetTour,
  DashboardTour,
  ExpensesTour,
  PlansListTour,
  PlanViewerTour,
  PropertiesListTour,
  PropertyTour,
  ServiceDetailTour,
  ServicesListTour,
  TasksTour,
} from './tours/client-tours';
export { resetOnboardingTour, TOUR_KEYS } from './tours/tour-core';
