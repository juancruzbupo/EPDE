export const NOTIFICATION_QUEUE = 'notification';

export interface NotificationJobData {
  userId: string;
  type: 'BUDGET_UPDATE' | 'SERVICE_UPDATE' | 'TASK_REMINDER' | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, string>;
}

export interface NotificationBatchJobData {
  notifications: NotificationJobData[];
}
