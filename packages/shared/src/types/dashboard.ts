import type {
  ActionTaken,
  ActivityType,
  BudgetStatus,
  ConditionFound,
  ProfessionalRequirement,
  PropertySector,
  PropertyType,
  RecurrenceType,
  TaskPriority,
  TaskResult,
  TaskStatus,
} from './enums';

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
  upcomingThisWeek: number;
  urgentTasks: number;
  completedThisMonth: number;
  pendingBudgets: number;
  openServices: number;
  healthScore: number;
  healthLabel: string;
  /** ISV score change vs previous month (null if <2 snapshots). */
  isvDelta: number | null;
  /** Consecutive months without overdue OWNER_CAN_DO tasks. */
  streak: number;
  /** Whether all tasks due this week have been completed. */
  perfectWeek: boolean;
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
  professionalRequirement: string;
  sector: string | null;
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
  sector: PropertySector;
  total: number;
  overdue: number;
  pending: number;
  cost: number;
}

/** Property Health Index — multi-dimensional score (0-100 each). */
export interface PropertyHealthIndex {
  /** Overall ISV score (0-100, weighted average of dimensions). */
  score: number;
  /** Label: Excelente / Bueno / Regular / Necesita atención / Crítico */
  label: string;
  /** 5 dimensions, each 0-100 */
  dimensions: {
    /** % tasks on-time, weighted by priority. */
    compliance: number;
    /** Average condition found in recent inspections (mapped 0-100). */
    condition: number;
    /** % of sectors with at least 1 inspection in last 12 months. */
    coverage: number;
    /** Ratio of preventive vs corrective actions (higher = better). */
    investment: number;
    /** Change vs previous quarter: positive = improving. */
    trend: number;
  };
  /** Per-sector health scores for breakdown. */
  sectorScores: { sector: string; score: number; overdue: number; total: number }[];
}

/** A task inspection with POOR or CRITICAL condition that lacks an active ServiceRequest. */
export interface DetectedProblem {
  taskId: string;
  taskName: string;
  sector: PropertySector | null;
  conditionFound: ConditionFound;
  severity: 'high' | 'medium';
  notes: string | null;
  completedAt: string;
  propertyId: string;
  propertyAddress: string;
}

/** Monthly ISV snapshot for history chart. */
export interface ISVSnapshotPublic {
  month: string;
  score: number;
  label: string;
  compliance: number;
  condition: number;
  coverage: number;
  investment: number;
  trend: number;
}

/** Aggregated data for the Certificado de Mantenimiento Preventivo. */
export interface PropertyCertificateData {
  certificateNumber: string;
  issuedAt: string;
  coveragePeriod: { from: string; to: string };
  property: {
    id: string;
    address: string;
    city: string;
    type: PropertyType;
    yearBuilt: number | null;
    squareMeters: number | null;
    owner: { name: string; email: string };
  };
  healthIndex: PropertyHealthIndex;
  isvHistory: ISVSnapshotPublic[];
  summary: {
    totalTasksCompleted: number;
    totalInspections: number;
    sectorsInspected: number;
    totalSectors: number;
    complianceRate: number;
    totalInvested: number;
  };
  highlights: Array<{
    taskName: string;
    categoryName: string;
    sector: string | null;
    completedAt: string;
    conditionFound: ConditionFound;
  }>;
  architect: { name: string };
}

/** Aggregated data for generating a property technical report (PDF). */
export interface PropertyReportData {
  property: {
    id: string;
    address: string;
    city: string;
    type: PropertyType;
    yearBuilt: number;
    squareMeters: number;
    userId: string;
    user?: { name: string; email: string };
  };
  healthIndex: PropertyHealthIndex;
  sectorBreakdown: SectorBreakdownItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  overdueTasks: Array<{
    id: string;
    name: string;
    sector: PropertySector | null;
    priority: TaskPriority;
    professionalRequirement: ProfessionalRequirement;
    nextDueDate: string | null;
    category: { name: string };
  }>;
  upcomingTasks: Array<{
    id: string;
    name: string;
    sector: PropertySector | null;
    priority: TaskPriority;
    professionalRequirement: ProfessionalRequirement;
    nextDueDate: string | null;
    recurrenceType: RecurrenceType;
    category: { name: string };
  }>;
  recentLogs: Array<{
    id: string;
    completedAt: string;
    result: TaskResult;
    conditionFound: ConditionFound;
    actionTaken: ActionTaken;
    cost: number | null;
    notes: string | null;
    photoUrl: string | null;
    task: { name: string; category: { name: string }; sector: PropertySector | null };
    user: { name: string };
  }>;
  taskStats: {
    total: number;
    overdue: number;
    pending: number;
    upcoming: number;
    completed: number;
  };
}

/** Annual progress summary. */
export interface AnnualSummary {
  tasksCompleted: number;
  problemsDetected: number;
  estimatedSavings: number;
  isvStart: number | null;
  isvEnd: number | null;
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
  healthIndex: PropertyHealthIndex;
  annualSummary: AnnualSummary;
}
