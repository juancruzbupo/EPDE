import type { NotificationType } from '@epde/shared';

export const NOTIFICATION_QUEUE = 'notification';

export interface NotificationJobData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;
}

export interface NotificationBatchJobData {
  notifications: NotificationJobData[];
}
