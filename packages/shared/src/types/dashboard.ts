export interface DashboardStats {
  totalClients: number;
  totalProperties: number;
  overdueTasks: number;
  pendingBudgets: number;
}

export interface ClientDashboardStats {
  totalProperties: number;
  pendingTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
  completedThisMonth: number;
}

export interface UpcomingTask {
  id: string;
  name: string;
  nextDueDate: string;
  priority: string;
  status: string;
  propertyAddress: string;
  categoryName: string;
  maintenancePlanId: string;
}

export interface ActivityItem {
  id: string;
  type: 'client_created' | 'property_created' | 'task_completed' | 'budget_requested';
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
