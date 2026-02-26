import type { NotificationType } from '../enums';
import type { Serialized } from './common';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: Date;
}

export type NotificationPublic = Serialized<Notification>;
