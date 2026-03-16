import type { ActivityType, BudgetStatus, ConditionFound, TaskPriority, TaskStatus } from './enums';

export interface DashboardStats {
  totalClients: number;
  totalProperties: number;
  overdueTasks: number;
  pendingBudgets: number;
  pendingServices: number;
}

export interface ClientDashboardStats {
  totalProperties: number;
  pendingTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
  completedThisMonth: number;
  pendingBudgets: number;
  openServices: number;
}

export interface UpcomingTask {
  id: string;
  name: string;
  nextDueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  propertyAddress: string;
  propertyId: string;
  categoryName: string;
  maintenancePlanId: string;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ─── Analytics Types ──────────────────────────────────

/** Data point for temporal charts */
export interface TimeSeriesPoint {
  month: string;
  label: string;
  value: number;
}

/** Condition distribution from inspection logs */
export interface ConditionDistribution {
  condition: ConditionFound;
  count: number;
  label: string;
}

/** Category with issue count from inspections */
export interface CategoryIssue {
  categoryName: string;
  issueCount: number;
  totalInspections: number;
}

/** Budget pipeline by status */
export interface BudgetPipeline {
  status: BudgetStatus;
  count: number;
  label: string;
  totalAmount: number;
}

/** Cost per category per month */
export interface CategoryCostPoint {
  month: string;
  label: string;
  categories: Record<string, number>;
}

/** Full admin analytics response */
export interface SlaMetrics {
  avgResponseHours: number | null;
  avgResolutionHours: number | null;
  totalTracked: number;
}

/** Full admin analytics response */
export interface AdminAnalytics {
  completionTrend: TimeSeriesPoint[];
  conditionDistribution: ConditionDistribution[];
  problematicCategories: CategoryIssue[];
  budgetPipeline: BudgetPipeline[];
  categoryCosts: CategoryCostPoint[];
  avgBudgetResponseDays: number | null;
  totalMaintenanceCost: number;
  completionRate: number;
  slaMetrics: SlaMetrics;
  problematicSectors: { sector: string; overdueCount: number }[];
}

/** Category breakdown for client dashboard */
export interface CategoryBreakdownItem {
  categoryName: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  avgCondition: number;
}

export interface SectorBreakdownItem {
  sector: string;
  total: number;
  overdue: number;
  pending: number;
  cost: number;
}

/** Client analytics response */
export interface ClientAnalytics {
  conditionTrend: Array<{
    month: string;
    label: string;
    categories: Record<string, number>;
  }>;
  costHistory: TimeSeriesPoint[];
  healthScore: number;
  healthLabel: string;
  conditionDistribution: ConditionDistribution[];
  categoryBreakdown: CategoryBreakdownItem[];
  sectorBreakdown: SectorBreakdownItem[];
}
