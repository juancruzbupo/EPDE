import type { ActivityType, TaskPriority, TaskStatus } from './enums';

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
