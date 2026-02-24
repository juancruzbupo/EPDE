export interface DashboardStats {
  totalClients: number;
  totalProperties: number;
  overdueTasks: number;
  pendingBudgets: number;
}

export interface ActivityItem {
  id: string;
  type: 'client_created' | 'property_created' | 'task_completed' | 'budget_requested';
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
